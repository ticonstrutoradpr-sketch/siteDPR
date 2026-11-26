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
  /* um cartao tipografico por empreendimento (tom mais escuro do fundo, nome fino, fio, local, situacao e o arco da DPR) */
  var hex = function (s) { var n = parseInt(s.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var mix = function (a, b, t) { var x = hex(a), y = hex(b); return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')'; };
  var arco = new Image(); arco.src = '/marca/dpr-arco.png';
  var letras = new Image(); letras.src = '/marca/dpr-letras.png';
  var fotos = itens.map(function () { var c = document.createElement('canvas'); c.width = c.height = 1024; var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c: c }; return t; });
  function desenhaCartoes() {
    itens.forEach(function (it, i) {
      var c = fotos[i].userData.c, g = c.getContext('2d'), S = 1024, partes = it.info.split(' · ');
      g.fillStyle = mix(it.fundo, '#000000', .1); g.fillRect(0, 0, S, S);
      g.strokeStyle = it.tinta; g.globalAlpha = .16; g.lineWidth = 2; g.strokeRect(40, 40, S - 80, S - 80); g.globalAlpha = 1;
      g.fillStyle = it.tinta; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = '500 24px Poppins'; g.letterSpacing = '8px'; g.globalAlpha = .7;
      g.fillText(String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0'), S / 2 + 4, 130); g.globalAlpha = 1;
      var linhas = estado.quebraNome(it.nome), tam = 128;
      g.letterSpacing = '-3px';
      do { g.font = '300 ' + tam + 'px Poppins'; tam -= 4; } while (Math.max.apply(null, linhas.map(function (l) { return g.measureText(l).width; })) > S - 200 && tam > 60);
      tam += 4;
      var y = S / 2 - (linhas.length - 1) * tam * .55 + tam * .2;
      linhas.forEach(function (l, k) { g.fillText(l, S / 2, y + k * tam * 1.08); });
      var yb = y + (linhas.length - 1) * tam * 1.08 + 70;
      g.globalAlpha = .55; g.fillRect(S / 2 - 40, yb, 80, 2); g.globalAlpha = 1;
      g.font = '500 24px Poppins'; g.letterSpacing = '7px';
      g.fillText((partes[1] || '').toUpperCase(), S / 2 + 3, yb + 64);
      g.globalAlpha = .7; g.fillText([partes[0]].concat(partes.slice(2)).join(' · ').toUpperCase(), S / 2 + 3, yb + 106); g.globalAlpha = 1;
      /* logo oficial da DPR no pe do cartao: letras na cor do texto e arco em areia */
      [[letras, it.tinta], [arco, '#BC9C74']].forEach(function (par) {
        var im = par[0]; if (!im.complete || !im.naturalWidth) return;
        var w = 150, hgt = w * 380 / 947, t = document.createElement('canvas'); t.width = w; t.height = hgt;
        var tg = t.getContext('2d'); tg.drawImage(im, 0, 0, w, hgt); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = par[1]; tg.fillRect(0, 0, w, hgt);
        g.globalAlpha = .85; g.drawImage(t, S / 2 - w / 2, S - 170); g.globalAlpha = 1;
      });
      fotos[i].needsUpdate = true;
    });
  }
  desenhaCartoes();
  var refaz = function () { desenhaCartoes(); };
  arco.onload = refaz; letras.onload = refaz;
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('300 100px Poppins'), document.fonts.load('500 24px Poppins')]).then(refaz).catch(function () {});

  /* fita em pedacos soltos entre os cartoes (com um vao fino junto de cada cartao, como folhas separadas).
     Ao se afastar do cartao, cada pedaco torce meia volta e se curva vindo na direcao de quem olha, como papel enrolando. */
  var VAO = .07, materialFrente = new THREE.MeshLambertMaterial({ map: tex, side: THREE.FrontSide }), materialVerso = new THREE.MeshLambertMaterial({ color: 0x8a7a6a, side: THREE.BackSide });
  var frente = { material: materialFrente }, verso = { material: materialVerso };
  var tira = new THREE.Group(); cena.add(tira);
  var pedacos = [];
  for (var k = -1; k < N; k++) {
    var topo = k < 0 ? L / 2 : -k * L - .5 - VAO, fundo = k >= N - 1 ? -(N - 1) * L - L / 2 : -(k + 1) * L + .5 + VAO;
    if (k < 0) topo = L / 2; if (k < 0) fundo = .5 + VAO;
    var comp = topo - fundo, gp = new THREE.PlaneGeometry(1, comp, 8, 90), pp = gp.attributes.position, bs = new Float32Array(pp.array.length);
    for (var i = 0; i < pp.count; i++) { bs[i * 3] = pp.getX(i); bs[i * 3 + 1] = pp.getY(i) + (topo + fundo) / 2; }
    /* os vertices mudam a cada quadro: sem o corte automatico por area, senao o pedaco some fora do lugar original */
    var mf = new THREE.Mesh(gp, materialFrente), mv = new THREE.Mesh(gp, materialVerso);
    mf.frustumCulled = false; mv.frustumCulled = false; tira.add(mf, mv);
    pedacos.push({ geo: gp, pos: pp, base: bs });
  }
  var cartoes = fotos.map(function (t) { var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t })); tira.add(m); return m; });

  function torce(s) {
    var desl = s * L;
    pedacos.forEach(function (p) {
      for (var i = 0; i < p.pos.count; i++) {
        var x0 = p.base[i * 3], y0 = p.base[i * 3 + 1];
        var j = Math.round(-y0 / L), d = y0 + j * L, lado = d > 0 ? 1 : -1;
        var t = Math.max(0, (Math.abs(d) - .5 - VAO) / (L / 2 - .5 - VAO));
        var a = lado * Math.PI * suave(t);
        var perto = 2.4 * t * t;
        pos3.set(x0 * Math.cos(a) + Math.sin(a) * .22 * lado, y0 + desl - lado * t * t * .35, x0 * Math.sin(a) + perto);
        p.pos.setXYZ(i, pos3.x, pos3.y, pos3.z);
      }
      p.pos.needsUpdate = true; p.geo.computeVertexNormals();
    });
    cartoes.forEach(function (m, i) { m.position.set(0, -i * L + desl, 0); });
  }
  var pos3 = new THREE.Vector3();

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
    var a = Math.floor(estado.s), b = Math.min(N - 1, a + 1), tt = estado.s - a;
    var cf = new THREE.Color(mix(itens[a].fundo, '#FFFFFF', .62)).lerp(new THREE.Color(mix(itens[b].fundo, '#FFFFFF', .62)), tt);
    var cv2 = new THREE.Color(mix(itens[a].fundo, '#000000', .28)).lerp(new THREE.Color(mix(itens[b].fundo, '#000000', .28)), tt);
    frente.material.color.copy(cf); verso.material.color.copy(cv2);
    tira.rotation.y = mx * .22; tira.rotation.x = my * .08;
    r.render(cena, cam);
  }
  quadro();
  fixo.classList.add('tem-3d');
}
