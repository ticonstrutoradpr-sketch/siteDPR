/* Casa do menu em 3D real (Three.js): maquete com luz de fim de tarde, sombras suaves e texturas feitas em canvas.
   Carregada so no computador, na primeira vez que o menu abre. Le o estado do SVG reserva (data-modo) e a classe
   "aberto" do painel; se o WebGL falhar, nada muda e o SVG continua aparecendo. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

var limita = function (v) { return Math.max(0, Math.min(1, v)); };
var suave = function (v) { v = limita(v); return v * v * (3 - 2 * v); };

/* texturas desenhadas em canvas (nada para baixar) */
function textura(desenha, rx, ry) {
  var c = document.createElement('canvas'); c.width = c.height = 512;
  desenha(c.getContext('2d'), 512);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8;
  return t;
}
function ruido(g, n, cor, a, tam) {
  for (var i = 0; i < n; i++) { g.fillStyle = cor.replace('A', (Math.random() * a).toFixed(3)); g.fillRect(Math.random() * 512, Math.random() * 512, tam, tam); }
}
var reboco = function (g) { g.fillStyle = '#F2ECE2'; g.fillRect(0, 0, 512, 512); ruido(g, 9000, 'rgba(120,100,80,A)', .07, 2); ruido(g, 4000, 'rgba(255,255,255,A)', .25, 2); };
var tijolo = function (g) {
  g.fillStyle = '#E6DCCD'; g.fillRect(0, 0, 512, 512);
  for (var r = 0; r < 32; r++) for (var c = -1; c < 9; c++) {
    var x = c * 64 + (r % 2 ? 32 : 0), y = r * 16, k = Math.random() * 26;
    g.fillStyle = 'rgb(' + (176 + k) + ',' + (128 + k * .7) + ',' + (92 + k * .5) + ')';
    g.fillRect(x + 2, y + 2, 60, 12);
  }
  ruido(g, 6000, 'rgba(60,40,20,A)', .12, 2);
};
var telha = function (g) {
  for (var r = 0; r < 16; r++) {
    var y = r * 32;
    for (var c = 0; c < 16; c++) {
      var k = Math.random() * 22, x = c * 32 + (r % 2 ? 16 : 0);
      var gr = g.createLinearGradient(0, y, 0, y + 32);
      gr.addColorStop(0, 'rgb(' + (176 + k) + ',' + (128 + k) + ',' + (88 + k * .6) + ')');
      gr.addColorStop(1, 'rgb(' + (128 + k) + ',' + (88 + k) + ',' + (58 + k * .5) + ')');
      g.fillStyle = gr; g.fillRect(x, y, 32, 32); g.fillRect(x - 512, y, 32, 32);
      g.fillStyle = 'rgba(60,38,20,.35)'; g.fillRect(x, y, 1.5, 32);
    }
    g.fillStyle = 'rgba(50,30,15,.45)'; g.fillRect(0, y + 30, 512, 2);
  }
};
var grama = function (g) { g.fillStyle = '#BFC7A2'; g.fillRect(0, 0, 512, 512); ruido(g, 30000, 'rgba(70,90,40,A)', .16, 2); ruido(g, 12000, 'rgba(240,240,200,A)', .2, 2); };
var madeira = function (g) {
  g.fillStyle = '#7B5A38'; g.fillRect(0, 0, 512, 512);
  for (var x = 0; x < 512; x += 3) { g.fillStyle = 'rgba(40,25,10,' + (Math.random() * .25).toFixed(2) + ')'; g.fillRect(x, 0, 1.5, 512); }
  g.fillStyle = 'rgba(30,18,8,.5)'; [128, 256, 384].forEach(function (x) { g.fillRect(x, 0, 3, 512); });
};
var piso = function (g) { g.fillStyle = '#E9E3D8'; g.fillRect(0, 0, 512, 512); ruido(g, 8000, 'rgba(90,80,70,A)', .1, 2); g.fillStyle = 'rgba(90,80,70,.25)'; for (var y = 0; y < 512; y += 64) g.fillRect(0, y, 512, 2); };

export function inicia(o) {
  var painel = o.painel, lado = o.lado, svg = o.svg;
  if (!painel || !lado || !svg) return;
  var cv = document.createElement('canvas'); cv.className = 'casa3d'; cv.setAttribute('aria-hidden', 'true');
  lado.insertBefore(cv, svg);
  var r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { cv.remove(); return; }
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
  r.outputColorSpace = THREE.SRGBColorSpace;

  var cena = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(24, 1, .1, 200);

  /* luz: ceu claro, sol quente de fim de tarde com sombra suave e um preenchimento frio */
  cena.add(new THREE.HemisphereLight(0xfff6e6, 0xb3a68f, 1.15));
  var sol = new THREE.DirectionalLight(0xffe0b5, 2.8);
  sol.position.set(-11, 15, 9); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  var sc = sol.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; sol.shadow.radius = 4;
  cena.add(sol);
  var frio = new THREE.DirectionalLight(0xdbe4ff, .45); frio.position.set(12, 6, -8); cena.add(frio);

  var mat = function (o) { return new THREE.MeshStandardMaterial(o); };
  var sombra = function (m) { m.castShadow = true; m.receiveShadow = true; return m; };
  var caixa = function (w, h, d, m, x, y, z) { var b = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); b.position.set(x, y, z); return b; };

  var texReboco = textura(reboco, .25, .25), texTijolo = textura(tijolo, .25, .25);
  var mParede = mat({ map: texReboco, roughness: .92 });
  var mTelha = mat({ map: textura(telha, 3, 4), roughness: .78 });
  var mBranco = mat({ color: 0xf7f3ec, roughness: .6 });
  var mBase = mat({ map: textura(piso, 2, 2), roughness: .9 });
  var mVidro = mat({ color: 0x4a5056, roughness: .08, metalness: .35, transparent: true, opacity: .62, emissive: 0xffc77a, emissiveIntensity: 0 });
  var mDentro = mat({ color: 0xe7d6bb, roughness: 1, side: THREE.BackSide, emissive: 0xffc27a, emissiveIntensity: 0 });
  var mPorta = mat({ map: textura(madeira), roughness: .7 });
  var mMetal = mat({ color: 0x8f877d, roughness: .5, metalness: .6 });
  var mTabua = mat({ color: 0xb49a74, roughness: .9 });
  var mTronco = mat({ color: 0x6f5a46, roughness: 1 });
  var verdes = [0x8e9a72, 0x7f8c66, 0x9da77f, 0x768360].map(function (c) { return mat({ color: c, roughness: .95, flatShading: true }); });

  /* terreno: bloco de maquete com grama, caminho e a sombra caindo na pagina */
  var chao = new THREE.Group(); cena.add(chao);
  var mLoteLado = mat({ color: 0xcdbfa6, roughness: 1 });
  var lote = new THREE.Mesh(new THREE.BoxGeometry(17, .6, 15), [mLoteLado, mLoteLado, mat({ map: textura(grama, 4, 4), roughness: 1 }), mLoteLado, mLoteLado, mLoteLado]);
  lote.position.y = -.3; lote.receiveShadow = true; chao.add(lote);
  chao.add(caixa(1.3, .04, 4.2, mat({ color: 0xece6db, roughness: .95 }), 0, .02, 5.4));
  var pegada = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .16 }));
  pegada.rotation.x = -Math.PI / 2; pegada.position.y = -.6; pegada.receiveShadow = true; cena.add(pegada);

  /* casa */
  var casa = new THREE.Group(); cena.add(casa);
  casa.add(caixa(8.6, .3, 6.6, mBase, 0, .15, 0));
  var paredes = new THREE.Group(); paredes.position.y = .3; casa.add(paredes);
  var T = .22, H = 3, G = 2.3;
  var extruda = function (forma) { return new THREE.ExtrudeGeometry(forma, { depth: T, bevelEnabled: false }); };
  var furo = function (x, y, w, h) { var p = new THREE.Path(); p.moveTo(x, y); p.lineTo(x, y + h); p.lineTo(x + w, y + h); p.lineTo(x + w, y); p.lineTo(x, y); return p; };
  // frente (z = +3) com recorte da porta no contorno
  var fr = new THREE.Shape();
  fr.moveTo(-4, 0); fr.lineTo(-.6, 0); fr.lineTo(-.6, 2.25); fr.lineTo(.6, 2.25); fr.lineTo(.6, 0); fr.lineTo(4, 0); fr.lineTo(4, H); fr.lineTo(0, H + G); fr.lineTo(-4, H); fr.lineTo(-4, 0);
  var janelas = [[-3.1, 1, 1.6, 1.3], [1.5, 1, 1.6, 1.3]];
  janelas.forEach(function (j) { fr.holes.push(furo(j[0], j[1], j[2], j[3])); });
  fr.holes.push(furo(-.35, 3.55, .7, .55));
  var mFrente = sombra(new THREE.Mesh(extruda(fr), mParede)); mFrente.position.z = 3 - T; paredes.add(mFrente);
  var tr = new THREE.Shape(); tr.moveTo(-4, 0); tr.lineTo(4, 0); tr.lineTo(4, H); tr.lineTo(0, H + G); tr.lineTo(-4, H); tr.lineTo(-4, 0);
  var mTras = sombra(new THREE.Mesh(extruda(tr), mParede)); mTras.position.z = -3; paredes.add(mTras);
  var la = new THREE.Shape(); la.moveTo(-2.78, 0); la.lineTo(2.78, 0); la.lineTo(2.78, H); la.lineTo(-2.78, H); la.lineTo(-2.78, 0);
  var janLado = [[-2.2, 1, 1.5, 1.3], [.7, 1, 1.5, 1.3]];
  janLado.forEach(function (j) { la.holes.push(furo(j[0], j[1], j[2], j[3])); });
  var mDir = sombra(new THREE.Mesh(extruda(la), mParede)); mDir.rotation.y = Math.PI / 2; mDir.position.x = 4 - T; paredes.add(mDir);
  var mEsq = sombra(new THREE.Mesh(extruda(la), mParede)); mEsq.rotation.y = Math.PI / 2; mEsq.position.x = -4; paredes.add(mEsq);
  // interior (visto pelas janelas e pela porta)
  var dentro = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.95, 5.5), mDentro); dentro.position.y = 1.48; paredes.add(dentro);
  // janelas: vidro, caixilho, peitoril
  var vidros = [];
  function janela(w, h, grupo) {
    var v = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mVidro); vidros.push(v); grupo.add(v);
    var e = .07;
    grupo.add(caixa(w, e, .1, mBranco, 0, h / 2 - e / 2, 0), caixa(w, e, .1, mBranco, 0, -h / 2 + e / 2, 0),
      caixa(e, h, .1, mBranco, -w / 2 + e / 2, 0, 0), caixa(e, h, .1, mBranco, w / 2 - e / 2, 0, 0),
      caixa(.05, h, .06, mBranco, 0, 0, 0), caixa(w, .05, .06, mBranco, 0, 0, 0),
      caixa(w + .25, .07, .3, mBranco, 0, -h / 2 - .03, .12));
  }
  janelas.forEach(function (j) { var g = new THREE.Group(); g.position.set(j[0] + j[2] / 2, j[1] + j[3] / 2, 3 - T / 2); janela(j[2], j[3], g); paredes.add(g); });
  janLado.forEach(function (j) { var g = new THREE.Group(); g.rotation.y = Math.PI / 2; g.position.set(4 - T / 2, j[1] + j[3] / 2, -(j[0] + j[2] / 2)); janela(j[2], j[3], g); paredes.add(g); });
  (function () { var g = new THREE.Group(); g.position.set(0, 3.825, 3 - T / 2); janela(.7, .55, g); paredes.add(g); })();
  // porta numa dobradica e o degrau
  var dobradica = new THREE.Group(); dobradica.position.set(-.55, 0, 3 - T / 2); paredes.add(dobradica);
  var folha = caixa(1.1, 2.2, .07, mPorta, .55, 1.1, 0); dobradica.add(folha);
  dobradica.add(caixa(.05, .2, .08, mMetal, .95, 1.05, .07));
  paredes.add(caixa(.08, 2.3, .14, mBranco, -.64, 1.15, 3 - T / 2), caixa(.08, 2.3, .14, mBranco, .64, 1.15, 3 - T / 2), caixa(1.36, .08, .14, mBranco, 0, 2.29, 3 - T / 2));
  casa.add(caixa(2, .16, .8, mBase, 0, .08, 3.6));
  // telhado de duas aguas
  var telhado = new THREE.Group(); casa.add(telhado);
  var topo = .3 + H + G, beiral = 4.5, queda = topo - (G / 4) * beiral;
  var meia = Math.hypot(beiral, topo - queda), ang = Math.atan2(topo - queda, beiral);
  [-1, 1].forEach(function (s) {
    var a = caixa(meia + .05, .16, 7, mTelha, s * beiral / 2, (topo + queda) / 2 + .13, 0); a.rotation.z = -s * ang; telhado.add(a);
  });
  telhado.add(caixa(.32, .14, 7.05, mat({ color: 0x8a6440, roughness: .7 }), 0, topo + .2, 0));
  var cx = 2, cy = topo - (G / 4) * cx;
  telhado.add(caixa(.75, 2.1, .75, mat({ color: 0xe2d8c8, roughness: .95 }), cx, cy + .7, -1.3), caixa(.9, .12, .9, mat({ color: 0x8b7e70, roughness: .8 }), cx, cy + 1.8, -1.3));
  var boca = new THREE.Vector3(cx, cy + 1.9, -1.3);

  /* arvores e arbustos facetados */
  var arvores = new THREE.Group(); cena.add(arvores);
  function arvore(x, z, s, n) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    var t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.11, .17, 1.6, 7), mTronco)); t.position.y = .8; g.add(t);
    for (var i = 0; i < n; i++) {
      var f = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(.75 - i * .1, 1), verdes[(i + Math.round(x)) & 3]));
      f.position.set(Math.sin(i * 2.4) * .38, 1.8 + i * .42, Math.cos(i * 2.4) * .38); g.add(f);
    }
    arvores.add(g); return g;
  }
  function arbusto(x, z, s) {
    var b = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), verdes[(Math.round(x * 3) & 3)]));
    b.position.set(x, .3 * s, z); b.scale.set(s, s * .75, s); arvores.add(b);
  }
  arvore(-6.2, -3.6, 1.5, 4); arvore(-2.8, -5.6, 1.15, 3); arvore(6.4, 4.8, 1.1, 3); arvore(-6.4, 5.2, .8, 2);
  arbusto(-2.6, 3.7, .9); arbusto(2.6, 3.7, .9); arbusto(-1.4, 3.75, .6); arbusto(4.7, 1.6, .8); arbusto(4.75, -1.2, .7);

  /* andaime (fase Obras) */
  var andaime = new THREE.Group(); cena.add(andaime);
  [-2.6, 0, 2.6].forEach(function (z) { [4.6, 5.5].forEach(function (x) { var p = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4.6, 6), mMetal)); p.position.set(x, 2.3, z); andaime.add(p); }); });
  [1.6, 3.2].forEach(function (y) { andaime.add(caixa(1.05, .06, 5.6, mTabua, 5.05, y, 0)); });

  /* fumaca da chamine */
  var fumos = [];
  var nuvem = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (var i = 0; i < 12; i++) {
    var m = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvem, color: 0xe9e3da, transparent: true, opacity: 0, depthWrite: false }));
    m.userData.fase = i / 12; m.userData.lado = (Math.random() - .5) * .5; cena.add(m); fumos.push(m);
  }

  /* luz que sai pela porta (fase Contato) */
  var facho = new THREE.SpotLight(0xffbf72, 0, 14, .75, .9, 1.6);
  facho.position.set(0, 2.2, 2.4); facho.target.position.set(0, 0, 7.5); cena.add(facho, facho.target);

  /* estado: le o data-modo do SVG reserva e a abertura do painel */
  var alvo = { luz: 1, porta: 0, obra: 0, fumo: 1 }, atual = { luz: 0, porta: 0, obra: 0, fumo: 0 };
  var modo = 'inicio', inicioAbertura = performance.now(), inicioLoop = 0, rodando = false;
  function leModo() {
    modo = svg.getAttribute('data-modo') || 'inicio';
    alvo.luz = (modo === 'inicio' || modo === 'contato') ? 1 : 0;
    alvo.porta = modo === 'contato' ? 1 : 0;
    alvo.obra = modo === 'obras' ? 1 : 0;
    alvo.fumo = (modo === 'inicio' || modo === 'contato') ? 1 : 0;
    if (modo === 'como-funciona') inicioLoop = performance.now();
  }
  new MutationObserver(leModo).observe(svg, { attributes: true, attributeFilter: ['data-modo'] });
  leModo();

  var mx = 0, my = 0, cxm = 0, cym = 0;
  painel.addEventListener('mousemove', function (e) { mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; });

  function tamanho() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(tamanho).observe(cv);

  var antes = performance.now();
  function quadro(agora) {
    if (!painel.classList.contains('aberto')) { rodando = false; return; }
    requestAnimationFrame(quadro);
    var dt = Math.min(.05, (agora - antes) / 1000); antes = agora;
    var k = 1 - Math.pow(.02, dt);
    for (var c in alvo) atual[c] += (alvo[c] - atual[c]) * k;
    var ta = (agora - inicioAbertura) / 1000;

    // nascimento ao abrir: chao, paredes subindo, telhado descendo, arvores brotando
    var bChao = suave((ta - .3) / .8), bPar = suave((ta - .6) / 1.2), bTel = suave((ta - 1.4) / 1), bArv = suave((ta - 1.6) / .9);
    // Como funciona: loop de construcao
    if (modo === 'como-funciona') {
      var p = ((agora - inicioLoop) / 4200) % 1;
      bPar = Math.min(bPar, p > .94 ? 0 : suave(p / .38));
      bTel = Math.min(bTel, p > .94 ? 0 : suave((p - .4) / .18));
      atual.luz = p > .62 && p < .94 ? Math.min(1, (p - .62) * 8) : 0;
    }
    chao.position.y = (1 - bChao) * -1.2; chao.visible = bChao > .001;
    paredes.scale.y = Math.max(.001, bPar); paredes.visible = bPar > .001;
    telhado.position.y = (1 - bTel) * 3; telhado.visible = bTel > .01;
    arvores.children.forEach(function (a, i) { var s = suave(bArv * 1.4 - i * .04); a.visible = s > .001; a.userData.s0 = a.userData.s0 || a.scale.clone(); a.scale.copy(a.userData.s0).multiplyScalar(Math.max(.001, s)); });

    // luz de dentro, vidros, porta, obra e fumaca
    mVidro.emissiveIntensity = atual.luz * 1.5; mDentro.emissiveIntensity = atual.luz * 1.1 + atual.porta * 1.4;
    vidros.forEach(function (v) { v.visible = atual.obra < .5; });
    mParede.map = atual.obra > .5 ? texTijolo : texReboco; mParede.needsUpdate = true;
    andaime.visible = atual.obra > .02; andaime.position.y = (1 - atual.obra) * -5;
    dobradica.rotation.y = atual.porta * 1.6;
    facho.intensity = atual.porta * 90;
    fumos.forEach(function (f) {
      var fz = (f.userData.fase + agora / 5200) % 1;
      f.position.set(boca.x + fz * 1.3 + f.userData.lado * fz, boca.y + fz * 3.2, boca.z - fz * .5);
      f.scale.setScalar(.7 + fz * 2.6);
      f.material.opacity = atual.fumo * bTel * Math.sin(fz * Math.PI) * .32;
    });

    // camera gira de leve em volta da casa com o mouse
    cxm += (mx - cxm) * k * .8; cym += (my - cym) * k * .8;
    var az = .8 + cxm * .26, el = .44 - cym * .08, raio = 52;
    cam.position.set(Math.sin(az) * Math.cos(el) * raio, Math.sin(el) * raio + 1, Math.cos(az) * Math.cos(el) * raio);
    cam.lookAt(0, 1.4 + Math.sin(agora / 2200) * .08, .4);
    r.render(cena, cam);
  }
  function liga() {
    if (rodando) return;
    rodando = true; inicioAbertura = performance.now(); antes = inicioAbertura;
    tamanho(); requestAnimationFrame(quadro);
  }
  new MutationObserver(function () { if (painel.classList.contains('aberto')) liga(); }).observe(painel, { attributes: true, attributeFilter: ['class'] });
  tamanho(); r.render(cena, cam);
  lado.classList.add('tem-3d');
  if (painel.classList.contains('aberto')) liga();
}
