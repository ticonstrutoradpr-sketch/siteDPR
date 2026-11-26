/* Fita 3D da vitrine das obras (Three.js): uma tira de papel com a foto de cada empreendimento em quadrados;
   entre um quadrado e o outro a tira da uma volta inteira, torcendo. A rolagem (estado.s) sobe a tira e assenta
   cada foto no centro. Se o WebGL falhar, nada muda e o cartao parado continua aparecendo. */
import * as THREE from 'three';

var suave = function (v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };

export function inicia(fixo, estado) {
  var cv = document.createElement('canvas'); cv.className = 'vit-canvas'; cv.setAttribute('aria-hidden', 'true');
  fixo.insertBefore(cv, fixo.querySelector('.vit-barra'));
  var r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { cv.remove(); return; }
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.outputColorSpace = THREE.SRGBColorSpace;
  var cena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  cena.add(new THREE.AmbientLight(0xffffff, 1.55));
  var luz = new THREE.DirectionalLight(0xffffff, 1.6); luz.position.set(.6, 1, 1.4); cena.add(luz);

  var itens = estado.itens, N = itens.length, L = 3.2;
  /* papel da fita: degrade claro no sentido da largura */
  var papel = document.createElement('canvas'); papel.width = 256; papel.height = 4;
  var g = papel.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0, '#E6DFD3'); gr.addColorStop(.5, '#F7F3EC'); gr.addColorStop(1, '#E1D8CA');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 4);
  var tex = new THREE.CanvasTexture(papel); tex.colorSpace = THREE.SRGBColorSpace;
  /* uma foto por cartao, recortada em quadrado */
  var fotos = itens.map(function (it) {
    var c = document.createElement('canvas'); c.width = c.height = 768;
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    var img = new Image();
    img.onload = function () { var l = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - l) / 2, (img.height - l) / 2, l, l, 0, 0, 768, 768); t.needsUpdate = true; };
    img.src = it.foto;
    return t;
  });

  /* tira: de meia volta acima do primeiro ate meia volta abaixo do ultimo; o centro do cartao i fica em y = -i*L */
  var comp = L * N, segs = N * 70;
  var geo = new THREE.PlaneGeometry(1, comp, 6, segs);
  var pos = geo.attributes.position, base = new Float32Array(pos.array.length);
  for (var i = 0; i < pos.count; i++) { base[i * 3] = pos.getX(i); base[i * 3 + 1] = pos.getY(i) - comp / 2 + L / 2; base[i * 3 + 2] = 0; }
  var frente = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.FrontSide }));
  var verso = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x3f3631, side: THREE.BackSide }));
  var tira = new THREE.Group(); tira.add(frente, verso); cena.add(tira);
  var cartoes = fotos.map(function (t) { var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: t })); tira.add(m); return m; });

  function torce(s) {
    var desl = s * L;
    for (var i = 0; i < pos.count; i++) {
      var x0 = base[i * 3], y0 = base[i * 3 + 1];
      var j = Math.round(-y0 / L), d = y0 + j * L, a = 0;
      if (Math.abs(d) > .5) { var t = (Math.abs(d) - .5) / (L / 2 - .5); a = (d > 0 ? 1 : -1) * Math.PI * suave(t); }
      var curva = Math.sin(a) * .18;
      pos.setXYZ(i, x0 * Math.cos(a) + curva, y0 + desl, x0 * Math.sin(a));
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    cartoes.forEach(function (m, i) { m.position.set(0, -i * L + desl, .004); });
  }

  var lado = 1;
  function tamanho() {
    var W = fixo.clientWidth, H = fixo.clientHeight;
    r.setSize(W, H, false); cam.aspect = W / H;
    var px = W < 900 ? Math.min(W * .5, 230) : Math.min(Math.max(W * .2, 220), 300);
    lado = px;
    var altoMundo = H / px;
    cam.position.set(0, 0, (altoMundo / 2) / Math.tan(THREE.MathUtils.degToRad(15)));
    cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  }
  window.addEventListener('resize', tamanho); tamanho();

  var mx = 0, my = 0;
  function quadro() {
    requestAnimationFrame(quadro);
    if (!estado.visivel) return;
    mx += (estado.mx - mx) * .06; my += (estado.my - my) * .06;
    torce(estado.s);
    tira.rotation.y = mx * .22; tira.rotation.x = my * .08;
    r.render(cena, cam);
  }
  quadro();
  fixo.classList.add('tem-3d');
}
