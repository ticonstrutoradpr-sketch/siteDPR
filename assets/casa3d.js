/* Casa do menu em 3D real (Three.js): maquete com luz de fim de tarde, reflexo de ambiente, sombras macias,
   texturas fotograficas (assets/tex), telhas em relevo, grama em folhas, arvores organicas, cerca, poste e caminho de pedra.
   Carregada so no computador, na primeira vez que o menu abre. Le o estado do SVG reserva (data-modo) e a classe
   "aberto" do painel; se o WebGL falhar, nada muda e o SVG continua aparecendo. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

var limita = function (v) { return Math.max(0, Math.min(1, v)); };
var suave = function (v) { v = limita(v); return v * v * (3 - 2 * v); };
var acaso = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

/* texturas desenhadas em canvas */
function textura(desenha, rx, ry, tam) {
  tam = tam || 512;
  var c = document.createElement('canvas'); c.width = c.height = tam;
  desenha(c.getContext('2d'), tam);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8;
  return t;
}
function ruido(g, n, cor, a, tam) {
  for (var i = 0; i < n; i++) { g.fillStyle = cor.replace('A', (acaso() * a).toFixed(3)); g.fillRect(acaso() * 512, acaso() * 512, tam, tam); }
}
var reboco = function (g) { g.fillStyle = '#F1EBE0'; g.fillRect(0, 0, 512, 512); ruido(g, 14000, 'rgba(120,100,80,A)', .08, 2); ruido(g, 6000, 'rgba(255,255,255,A)', .3, 3); ruido(g, 300, 'rgba(120,100,80,A)', .04, 14); };
var telha = function (g) {
  g.fillStyle = '#9E7148'; g.fillRect(0, 0, 512, 512);
  for (var c = 0; c < 16; c++) { var k = acaso() * 30 - 15; g.fillStyle = 'rgb(' + (168 + k) + ',' + (116 + k) + ',' + (74 + k * .6) + ')'; g.fillRect(c * 32 + 1, 0, 30, 512); g.fillStyle = 'rgba(40,22,10,.35)'; g.fillRect(c * 32, 0, 2, 512); }
  ruido(g, 9000, 'rgba(40,25,10,A)', .15, 2); ruido(g, 4000, 'rgba(255,240,220,A)', .12, 2);
};
var pedra = function (g) { g.fillStyle = '#E2DBCF'; g.fillRect(0, 0, 512, 512); ruido(g, 16000, 'rgba(90,80,70,A)', .14, 2); ruido(g, 400, 'rgba(90,80,70,A)', .05, 18); };
var sombraContato = function (g, n) {
  var gr = g.createRadialGradient(n / 2, n / 2, n * .18, n / 2, n / 2, n * .5);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
};

export function inicia(o) {
  var painel = o.painel, lado = o.lado, svg = o.svg;
  if (!painel || !lado || !svg) return;
  var cv = document.createElement('canvas'); cv.className = 'casa3d'; cv.setAttribute('aria-hidden', 'true');
  lado.insertBefore(cv, svg);
  var r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { cv.remove(); return; }
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .82;
  r.outputColorSpace = THREE.SRGBColorSpace;

  var cena = new THREE.Scene();
  var pm = new THREE.PMREMGenerator(r);
  cena.environment = pm.fromScene(new RoomEnvironment(r), .04).texture;
  var cam = new THREE.PerspectiveCamera(24, 1, .1, 200);

  /* luz: ambiente refletido, sol quente de fim de tarde com sombra macia e um preenchimento frio */
  cena.add(new THREE.HemisphereLight(0xfff3e0, 0xa89b84, .45));
  var sol = new THREE.DirectionalLight(0xffd9a8, 3.1);
  sol.position.set(-9, 18, 10); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  var sc = sol.shadow.camera; sc.left = -13; sc.right = 13; sc.top = 13; sc.bottom = -13; sc.near = 1; sc.far = 50;
  sol.shadow.bias = -.0005; sol.shadow.normalBias = .03; sol.shadow.radius = 5;
  cena.add(sol);
  var frio = new THREE.DirectionalLight(0xd8e2ff, .35); frio.position.set(12, 6, -8); cena.add(frio);

  var carrega = new THREE.TextureLoader();
  var foto = function (nome, rx, ry, cor) {
    var t = carrega.load('/assets/tex/' + nome + '.webp');
    if (cor !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
    return t;
  };
  var mat = function (o) { if (o.envMapIntensity === undefined) o.envMapIntensity = .4; return new THREE.MeshStandardMaterial(o); };
  var sombra = function (m) { m.castShadow = true; m.receiveShadow = true; return m; };
  var caixa = function (w, h, d, m, x, y, z) { var b = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); b.position.set(x, y, z); return b; };

  var texReboco = textura(reboco, .3, .3);
  var texTijolo = foto('tijolo', .32, .32), relevoTijolo = foto('tijolo-relevo', .32, .32, false);
  var mParede = mat({ map: texReboco, bumpMap: texReboco, bumpScale: .015, roughness: .93 });
  var mTelha = mat({ map: textura(telha, 1, 1), roughness: .72 });
  var mBranco = mat({ color: 0xf6f2eb, roughness: .45 });
  var mPedra = mat({ map: textura(pedra, 1, 1), roughness: .9 });
  var mVidro = mat({ envMapIntensity: 1, color: 0x2f3439, roughness: .04, metalness: .9, transparent: true, opacity: .5, emissive: 0xffc77a, emissiveIntensity: 0 });
  var mDentro = mat({ color: 0xe7d6bb, roughness: 1, side: THREE.BackSide, emissive: 0xffc27a, emissiveIntensity: 0 });
  var mPorta = mat({ map: foto('madeira', 1, 1), color: 0x9a7552, roughness: .55 });
  var mMetal = mat({ color: 0x7d766e, roughness: .35, metalness: .8 });
  var mEscuro = mat({ color: 0x3b3631, roughness: .4, metalness: .6 });
  var mTabua = mat({ color: 0xb49a74, roughness: .9 });
  var mTronco = mat({ color: 0x5e4a38, roughness: 1 });

  /* terreno: bloco de maquete com grama fotografica, folhas de grama, caminho de pedra e a sombra na pagina */
  var chao = new THREE.Group(); cena.add(chao);
  var mLoteLado = mat({ color: 0xc8b89c, roughness: 1 });
  var mGrama = mat({ map: foto('grama', 5, 5), color: 0xb9b99a, roughness: 1 });
  var lote = new THREE.Mesh(new THREE.BoxGeometry(17, .6, 15), [mLoteLado, mLoteLado, mGrama, mLoteLado, mLoteLado, mLoteLado]);
  lote.position.y = -.3; lote.receiveShadow = true; lote.castShadow = true; chao.add(lote);
  for (var p = 0; p < 6; p++) { var pl = caixa(1.15, .07, .55, mPedra, (acaso() - .5) * .12, .035, 4.15 + p * .62); pl.rotation.y = (acaso() - .5) * .12; chao.add(pl); }
  // folhas de grama (instanciadas), fora da casa e do caminho
  var folha = new THREE.ConeGeometry(.025, .26, 3); folha.translate(0, .13, 0);
  var N = 9000, grama = new THREE.InstancedMesh(folha, mat({ color: 0xffffff, roughness: 1 }), N);
  var mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), cor = new THREE.Color();
  for (var i = 0, n = 0; n < N && i < N * 3; i++) {
    var x = (acaso() - .5) * 16.6, z = (acaso() - .5) * 14.6;
    if (Math.abs(x) < 4.6 && Math.abs(z) < 3.7) continue;
    if (Math.abs(x) < .8 && z > 3.6) continue;
    e3.set((acaso() - .5) * .5, acaso() * 6.28, (acaso() - .5) * .5); q.setFromEuler(e3);
    var h = .6 + acaso() * .9; s3.set(1, h, 1); v.set(x, 0, z);
    mtx.compose(v, q, s3); grama.setMatrixAt(n, mtx);
    cor.setHSL(.17 + acaso() * .05, .16 + acaso() * .1, .36 + acaso() * .12); grama.setColorAt(n, cor);
    n++;
  }
  grama.count = n; grama.receiveShadow = true; chao.add(grama);
  var pegada = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .15 }));
  pegada.rotation.x = -Math.PI / 2; pegada.position.y = -.6; pegada.receiveShadow = true; cena.add(pegada);
  var contato = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 9.5), new THREE.MeshBasicMaterial({ map: textura(sombraContato, 1, 1, 256), transparent: true, depthWrite: false, opacity: .75 }));
  contato.rotation.x = -Math.PI / 2; contato.position.y = .012; chao.add(contato);

  /* cerca branca na frente e nas laterais, com passagem no caminho */
  var estaca = new THREE.BoxGeometry(.09, .75, .05); estaca.translate(0, .375, 0);
  var cercaPos = [];
  for (var cx0 = -7.8; cx0 <= 7.8; cx0 += .26) if (Math.abs(cx0) > 1) cercaPos.push([cx0, 7.2, 0]);
  for (var cz0 = 2.5; cz0 < 7.2; cz0 += .26) { cercaPos.push([-7.8, cz0, Math.PI / 2]); cercaPos.push([7.8, cz0, Math.PI / 2]); }
  var cerca = new THREE.InstancedMesh(estaca, mBranco, cercaPos.length);
  cercaPos.forEach(function (c, i) { e3.set(0, c[2], 0); q.setFromEuler(e3); v.set(c[0], 0, c[1]); s3.set(1, 1, 1); mtx.compose(v, q, s3); cerca.setMatrixAt(i, mtx); });
  cerca.castShadow = true; cerca.receiveShadow = true; chao.add(cerca);
  [.25, .6].forEach(function (y) {
    chao.add(caixa(6.8, .06, .04, mBranco, -4.4, y, 7.17), caixa(6.8, .06, .04, mBranco, 4.4, y, 7.17),
      caixa(.04, .06, 4.7, mBranco, -7.77, y, 4.85), caixa(.04, .06, 4.7, mBranco, 7.77, y, 4.85));
  });

  /* poste de jardim com luz quente */
  var poste = new THREE.Group(); poste.position.set(1.35, 0, 6.3); chao.add(poste);
  poste.add(caixa(.08, 1.5, .08, mEscuro, 0, .75, 0), caixa(.26, .3, .26, mEscuro, 0, 1.62, 0));
  var mLampada = mat({ color: 0xfff1d6, emissive: 0xffc070, emissiveIntensity: 0, roughness: .3 });
  poste.add(caixa(.2, .24, .2, mLampada, 0, 1.6, 0));
  var luzPoste = new THREE.PointLight(0xffbe70, 0, 5, 1.8); luzPoste.position.set(0, 1.5, 0); poste.add(luzPoste);

  /* casa */
  var casa = new THREE.Group(); cena.add(casa);
  casa.add(caixa(8.6, .3, 6.6, mPedra, 0, .15, 0));
  var paredes = new THREE.Group(); paredes.position.y = .3; casa.add(paredes);
  var T = .22, H = 3, G = 2.3;
  var extruda = function (forma) { return new THREE.ExtrudeGeometry(forma, { depth: T, bevelEnabled: false }); };
  var furo = function (x, y, w, h) { var pt = new THREE.Path(); pt.moveTo(x, y); pt.lineTo(x, y + h); pt.lineTo(x + w, y + h); pt.lineTo(x + w, y); pt.lineTo(x, y); return pt; };
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
  // rodape de pedra em volta
  paredes.add(caixa(8.12, .35, .06, mPedra, 0, .175, 3.03), caixa(.06, .35, 6.1, mPedra, 4.03, .175, 0));
  var dentro = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.95, 5.5), mDentro); dentro.position.y = 1.48; paredes.add(dentro);
  var vidros = [];
  function janela(w, h, grupo) {
    var vd = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mVidro); vd.position.z = -.03; vidros.push(vd); grupo.add(vd);
    var e = .07;
    grupo.add(caixa(w, e, .1, mBranco, 0, h / 2 - e / 2, 0), caixa(w, e, .1, mBranco, 0, -h / 2 + e / 2, 0),
      caixa(e, h, .1, mBranco, -w / 2 + e / 2, 0, 0), caixa(e, h, .1, mBranco, w / 2 - e / 2, 0, 0),
      caixa(.045, h, .06, mBranco, 0, 0, 0), caixa(w, .045, .06, mBranco, 0, 0, 0),
      caixa(w + .3, .07, .32, mBranco, 0, -h / 2 - .03, .13));
  }
  janelas.forEach(function (j) { var g = new THREE.Group(); g.position.set(j[0] + j[2] / 2, j[1] + j[3] / 2, 3 - T / 2); janela(j[2], j[3], g); paredes.add(g); });
  janLado.forEach(function (j) { var g = new THREE.Group(); g.rotation.y = Math.PI / 2; g.position.set(4 - T / 2, j[1] + j[3] / 2, -(j[0] + j[2] / 2)); janela(j[2], j[3], g); paredes.add(g); });
  (function () { var g = new THREE.Group(); g.position.set(0, 3.825, 3 - T / 2); janela(.7, .55, g); paredes.add(g); })();
  var dobradica = new THREE.Group(); dobradica.position.set(-.55, 0, 3 - T / 2); paredes.add(dobradica);
  dobradica.add(caixa(1.1, 2.2, .07, mPorta, .55, 1.1, 0), caixa(.05, .22, .09, mMetal, .95, 1.05, .07));
  paredes.add(caixa(.09, 2.32, .16, mBranco, -.645, 1.16, 3 - T / 2), caixa(.09, 2.32, .16, mBranco, .645, 1.16, 3 - T / 2), caixa(1.38, .09, .16, mBranco, 0, 2.3, 3 - T / 2));
  casa.add(caixa(2, .16, .8, mPedra, 0, .08, 3.6));
  // marquise sobre a porta
  casa.add(caixa(1.9, .08, .7, mBranco, 0, 2.95, 3.35));

  /* telhado: laje + fileiras de telha em relevo, cumeeira, calhas */
  var telhado = new THREE.Group(); casa.add(telhado);
  var topo = .3 + H + G, beiral = 4.55, queda = topo - (G / 4) * beiral;
  var meia = Math.hypot(beiral, topo - queda), ang = Math.atan2(topo - queda, beiral);
  var fileiras = 14, passo = meia / fileiras;
  [-1, 1].forEach(function (s) {
    var agua = new THREE.Group(); agua.position.set(0, topo + .1, 0); agua.rotation.z = -s * ang; telhado.add(agua);
    agua.add(caixa(meia, .1, 7.1, mat({ color: 0x6f4f33, roughness: .9 }), s * meia / 2, -.06, 0));
    for (var k = 0; k < fileiras; k++) {
      var f = caixa(passo * 1.35, .07, 7.1, mTelha, s * (k + .5) * passo, .02, 0);
      f.rotation.z = s * -.07; agua.add(f);
    }
    var calha = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 7.1, 10, 1, true, 0, Math.PI), mBranco));
    calha.rotation.x = Math.PI / 2; calha.position.set(s * (beiral + .05), queda - .02, 0); telhado.add(calha);
  });
  telhado.add(caixa(.34, .16, 7.15, mat({ color: 0x7c5434, roughness: .7 }), 0, topo + .2, 0));
  telhado.add(caixa(.07, queda - .2, .07, mBranco, beiral + .05, (queda - .2) / 2 + .1, 3.45));
  var cxc = 2, cyc = topo - (G / 4) * cxc;
  telhado.add(caixa(.75, 2.1, .75, mat({ color: 0xded3c2, roughness: .95 }), cxc, cyc + .75, -1.3), caixa(.92, .12, .92, mEscuro, cxc, cyc + 1.85, -1.3));
  var boca = new THREE.Vector3(cxc, cyc + 1.95, -1.3);

  /* arvores organicas: copas arredondadas e irregulares */
  var arvores = new THREE.Group(); cena.add(arvores);
  function copa(raio, corCopa) {
    var g = new THREE.IcosahedronGeometry(raio, 3), pos = g.attributes.position, w = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) { w.fromBufferAttribute(pos, i); var kk = 1 + (Math.sin(w.x * 5.1) * Math.cos(w.y * 4.3) * Math.sin(w.z * 3.7)) * .14; w.multiplyScalar(kk); pos.setXYZ(i, w.x, w.y, w.z); }
    g.computeVertexNormals();
    return sombra(new THREE.Mesh(g, mat({ color: corCopa, roughness: .95 })));
  }
  var verdes = [0x7d8a5c, 0x6f7d52, 0x8b9766, 0x66744a];
  function arvore(x, z, s, n) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    var t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.09, .16, 1.9, 8), mTronco)); t.position.y = .95; g.add(t);
    for (var i = 0; i < n; i++) {
      var c = copa(.72 - i * .07, verdes[(i + Math.round(x)) & 3]);
      c.position.set(Math.sin(i * 2.4) * .45, 2.05 + (i % 3) * .38, Math.cos(i * 2.4) * .45); g.add(c);
    }
    arvores.add(g);
  }
  function arbusto(x, z, s) { var b = copa(.5, verdes[Math.round(acaso() * 3)]); b.position.set(x, .32 * s, z); b.scale.set(s, s * .72, s); arvores.add(b); }
  arvore(-6.3, -3.8, 1.5, 6); arvore(-2.8, -5.7, 1.15, 5); arvore(6.5, 4.6, 1.1, 5); arvore(-6.5, 4.9, .85, 4); arvore(6.6, -4.6, 1.25, 5);
  arbusto(-2.6, 3.75, .95); arbusto(2.6, 3.75, .95); arbusto(-1.45, 3.8, .6); arbusto(4.75, 1.6, .85); arbusto(4.8, -1.2, .75); arbusto(-4.8, .6, .8);

  /* andaime (fase Obras) */
  var andaime = new THREE.Group(); cena.add(andaime);
  [-2.6, 0, 2.6].forEach(function (z) { [4.65, 5.55].forEach(function (x) { var pp = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4.6, 8), mMetal)); pp.position.set(x, 2.3, z); andaime.add(pp); }); });
  [1.6, 3.2].forEach(function (y) { andaime.add(caixa(1.05, .06, 5.6, mTabua, 5.1, y, 0)); });

  /* fumaca da chamine em nuvens suaves */
  var fumos = [];
  var nuvem = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (var fi = 0; fi < 12; fi++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvem, color: 0xe9e3da, transparent: true, opacity: 0, depthWrite: false }));
    sp.userData.fase = fi / 12; sp.userData.lado = (acaso() - .5) * .5; cena.add(sp); fumos.push(sp);
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

  var antes = performance.now(), tijoloAgora = false;
  function quadro(agora) {
    if (!painel.classList.contains('aberto')) { rodando = false; return; }
    requestAnimationFrame(quadro);
    var dt = Math.min(.05, (agora - antes) / 1000); antes = agora;
    var k = 1 - Math.pow(.02, dt);
    for (var c in alvo) atual[c] += (alvo[c] - atual[c]) * k;
    var ta = (agora - inicioAbertura) / 1000;

    var bChao = suave((ta - .3) / .8), bPar = suave((ta - .6) / 1.2), bTel = suave((ta - 1.4) / 1), bArv = suave((ta - 1.6) / .9);
    if (modo === 'como-funciona') {
      var pz = ((agora - inicioLoop) / 4200) % 1;
      bPar = Math.min(bPar, pz > .94 ? 0 : suave(pz / .38));
      bTel = Math.min(bTel, pz > .94 ? 0 : suave((pz - .4) / .18));
      atual.luz = pz > .62 && pz < .94 ? Math.min(1, (pz - .62) * 8) : 0;
    }
    chao.position.y = (1 - bChao) * -1.2; chao.visible = bChao > .001;
    paredes.scale.y = Math.max(.001, bPar); paredes.visible = bPar > .001;
    telhado.position.y = (1 - bTel) * 3; telhado.visible = bTel > .01;
    arvores.children.forEach(function (a, i) { var s = suave(bArv * 1.4 - i * .04); a.visible = s > .001; a.userData.s0 = a.userData.s0 || a.scale.clone(); a.scale.copy(a.userData.s0).multiplyScalar(Math.max(.001, s)); });

    mVidro.emissiveIntensity = atual.luz * 1.6; mDentro.emissiveIntensity = atual.luz * 1.1 + atual.porta * 1.4;
    mLampada.emissiveIntensity = atual.luz * 2.2; luzPoste.intensity = atual.luz * 6;
    vidros.forEach(function (vd) { vd.visible = atual.obra < .5; });
    var querTijolo = atual.obra > .5;
    if (querTijolo !== tijoloAgora) { tijoloAgora = querTijolo; mParede.map = querTijolo ? texTijolo : texReboco; mParede.bumpMap = querTijolo ? relevoTijolo : texReboco; mParede.bumpScale = querTijolo ? .05 : .015; mParede.needsUpdate = true; }
    andaime.visible = atual.obra > .02; andaime.position.y = (1 - atual.obra) * -5;
    dobradica.rotation.y = atual.porta * 1.6;
    facho.intensity = atual.porta * 90;
    fumos.forEach(function (f) {
      var fz = (f.userData.fase + agora / 5200) % 1;
      f.position.set(boca.x + fz * 1.3 + f.userData.lado * fz, boca.y + fz * 3.2, boca.z - fz * .5);
      f.scale.setScalar(.7 + fz * 2.6);
      f.material.opacity = atual.fumo * bTel * Math.sin(fz * Math.PI) * .32;
    });

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
