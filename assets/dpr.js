/* DPR Construtora - site novo: so o essencial (pagina leve para celular simples).
   Topo que fica solido depois da abertura, menu do celular, entrada suave ao rolar e foto ampliada das obras. */
(function () {
  var doc = document.documentElement;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* entrada suave ao rolar */
  var alvos = $$('[data-revela]');
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* abertura que muda com a rolagem */
  var palco = $('.palco'), fixo = $('.palco-fixo'), pedido = false;
  var limita = function (v) { return Math.min(1, Math.max(0, v)); };
  var suave = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var mistura = function (a, b, t) { return a + (b - a) * t; };
  var fase = function (p, a, b) { return limita((p - a) / (b - a)); };
  var s0, vidAtual = 1, yAntes = window.scrollY;

  /* videos do comeco: passam um atras do outro com troca suave; so baixa o atual e o proximo; para quando some */
  var vids = $$('.tela-video .vid'), filaVideos = ['7-familia', '2-tijolo'];
  var vAtual = 0, vIdx = 0, querTocar = !calmo;
  var fonte = function (n) { return '/video/' + n + (window.innerWidth < 900 ? '-cel' : '-pc') + '.mp4'; };
  var capa = function (n) { return '/video/capas/' + n + (window.innerWidth < 900 ? '-cel' : '-pc') + '.webp'; };
  function preparaProximo() {
    var prox = vids[1 - vAtual], n = filaVideos[(vIdx + 1) % filaVideos.length];
    prox.src = fonte(n); prox.poster = capa(n); prox.preload = 'auto'; prox.load();
  }
  function trocaVideo() {
    var velho = vids[vAtual], novo = vids[1 - vAtual];
    vIdx = (vIdx + 1) % filaVideos.length; vAtual = 1 - vAtual;
    try { novo.currentTime = 0; } catch (e) {}
    if (querTocar) { var pr = novo.play(); if (pr && pr.catch) pr.catch(function () {}); }
    novo.classList.add('ativo'); velho.classList.remove('ativo');
    setTimeout(function () { velho.pause(); preparaProximo(); }, 1500);
  }
  function tocaVideo(sim) {
    if (!vids.length) return;
    querTocar = sim && !calmo;
    var v = vids[vAtual];
    if (querTocar && v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    else if (!querTocar && !v.paused) v.pause();
  }
  if (vids.length) {
    vids[0].src = fonte(filaVideos[0]); vids[0].poster = capa(filaVideos[0]);
    vids.forEach(function (v) { v.muted = true; v.addEventListener('ended', function () { if (v === vids[vAtual]) trocaVideo(); }); });
    preparaProximo();
    if (!calmo) { var pr0 = vids[0].play(); if (pr0 && pr0.catch) pr0.catch(function () {}); }
  }
  function quadro() {
    pedido = false;
    if (!palco || !fixo) return;
    var W = fixo.clientWidth, H = fixo.clientHeight, largo = W >= 900;
    var p = calmo ? 1 : limita(-palco.getBoundingClientRect().top / Math.max(1, palco.offsetHeight - H));
    /* fases: letras vazadas se abrem ate o video ocupar a tela 0-.1, video cheio ate .14, dissolve na tela areia .14-.24,
       encolhe .3-.56, vai a esquerda .56-.7, texto .62-.76, conversa .78-.97 */
    /* as letras crescem e a camada do video se dissolve direto na tela areia (sem mostrar o video inteiro) */
    var abre = suave(fase(p, 0, .16));
    var vid = 1 - suave(fase(p, .03, .16));
    fixo.style.setProperty('--abre', abre.toFixed(4));
    var encolhe = suave(fase(p, .3, .56)), vai = suave(fase(p, .56, .7)), txt = fase(p, .62, .76), chat = fase(p, .78, .97);
    s0 = fixo.style; s0.setProperty('--vid', vid.toFixed(4)); vidAtual = vid;
    tocaVideo(vid > .02);
    /* tamanho final da tela do celular */
    var th = largo ? Math.min(H * .74, 660) : Math.min(H * (H < 800 ? .44 : .5), 440);
    var tw = th * .48;
    var cx = W / 2, cy = largo ? H / 2 : (H * .06 + 70 + th / 2);
    var destinoX = largo ? Math.max(W * .26, tw / 2 + 60) : W / 2;
    var x = mistura(cx, destinoX, vai);
    var w = mistura(W, tw, encolhe), h = mistura(H, th, encolhe);
    var yc = mistura(H / 2, cy, encolhe);
    var s = fixo.style;
    s.setProperty('--p', p.toFixed(4));
    s.setProperty('--tw', w.toFixed(1) + 'px'); s.setProperty('--th', h.toFixed(1) + 'px');
    s.setProperty('--tx', (x - w / 2).toFixed(1) + 'px'); s.setProperty('--ty', (yc - h / 2).toFixed(1) + 'px');
    s.setProperty('--tr', mistura(0, 30, encolhe).toFixed(1) + 'px');
    s.setProperty('--fh', mistura(largo ? Math.min(W * .055, 78) : Math.min(W * .1, 42), largo ? 30 : 22, encolhe).toFixed(1) + 'px');
    s.setProperty('--moldura', fase(p, .3, .48).toFixed(3));
    s.setProperty('--brilho', (encolhe * (1 - chat * .5)).toFixed(3));
    s.setProperty('--txt', txt.toFixed(3));
    s.setProperty('--chat', chat.toFixed(3));
    /* no celular o cartao flutuante esconde enquanto a abertura esta na tela (ele cobriria o texto) */
    document.body.classList.toggle('no-palco', palco.getBoundingClientRect().bottom > H * .5);
    /* link do menu que corresponde a secao na tela */
    var y = window.scrollY + H * .4, atual = 'inicio';
    ['obras', 'como-funciona', 'contato'].forEach(function (id) { var el = document.getElementById(id); if (el && el.offsetTop <= y) atual = id; });
    $$('.painel-nav a').forEach(function (a) { a.classList.toggle('atual', a.getAttribute('href') === '#' + atual); });
    /* topo: sem fundo na abertura; depois veu marfim leve, some ao descer e volta ao subir */
    var topoEl = $('.topo');
    if (topoEl && !doc.classList.contains('menu-aberto')) {
      var yAgora = window.scrollY, passou = yAgora > H * .9;
      topoEl.classList.toggle('fundo', passou);
      if (!passou || yAgora < yAntes - 4) topoEl.classList.remove('fora');
      else if (yAgora > yAntes + 6) topoEl.classList.add('fora');
      yAntes = yAgora;
    }
  }

  /* lanterna da abertura: segue o mouse; sem mouse, passeia sozinha */
  var tv = $('.tela-video'), temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (tv && !calmo) {
    if (temMouse) {
      fixo.addEventListener('mousemove', function (e) { tv.style.setProperty('--mx', e.clientX + 'px'); tv.style.setProperty('--my', e.clientY + 'px'); });
      fixo.addEventListener('mouseleave', function () { tv.style.removeProperty('--mx'); tv.style.removeProperty('--my'); });
    } else {
      (function passeia(t) {
        if (vidAtual > .02) {
          var x = 50 + Math.sin(t / 2300) * 28, y = 46 + Math.sin(t / 1700) * 16;
          tv.style.setProperty('--mx', x.toFixed(2) + '%'); tv.style.setProperty('--my', y.toFixed(2) + '%');
          tv.style.setProperty('--raio', '180px');
        }
        requestAnimationFrame(passeia);
      })(0);
    }
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', quadro);
  quadro();

  /* cartao flutuante: fechar mostra o botao redondo do WhatsApp */
  var cartao = $('.cartao-flutua');
  if (cartao) $('.cartao-fechar', cartao).addEventListener('click', function () { cartao.classList.add('fechado'); document.body.classList.add('sem-cartao'); });

  /* menu em cortina: abre/fecha; ao lado, o video da familia toca e a frase troca com o item sob o mouse ou o foco */
  var botao = $('.topo-menu'), painel = $('.painel'), casa = $('.casa'), leg = $('.painel-leg-txt');
  function mostraFrase(a) {
    if (!a || !leg) return;
    var f = a.getAttribute('data-frase');
    if (casa) casa.setAttribute('data-modo', a.getAttribute('href').slice(1));
    if (leg.textContent === f) return;
    leg.textContent = f;
    leg.classList.remove('troca'); void leg.offsetWidth; leg.classList.add('troca');
  }
  function fraseAtual() { mostraFrase($('.painel-nav a.atual') || $('.painel-nav a')); }
  function menu(abrir) {
    if (!botao || !painel) return;
    if (abrir) { fraseAtual(); painel.classList.add('desenhando'); setTimeout(function () { painel.classList.remove('desenhando'); }, 2600); }
    painel.classList.toggle('aberto', abrir);
    doc.classList.toggle('menu-aberto', abrir);
    botao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    painel.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    document.body.style.overflow = abrir ? 'hidden' : '';
  }
  if (botao) botao.addEventListener('click', function () { menu(!painel.classList.contains('aberto')); });
  $$('.painel a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  $$('.painel-nav a').forEach(function (a) {
    a.addEventListener('mouseenter', function () { mostraFrase(a); });
    a.addEventListener('focus', function () { mostraFrase(a); });
  });
  /* maquete inclina acompanhando o mouse em qualquer ponto do menu */
  if (casa && painel && temMouse && !calmo) painel.addEventListener('mousemove', function (e) {
    casa.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
    casa.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
  });
  var pnav = $('.painel-nav');
  if (pnav) pnav.addEventListener('mouseleave', fraseAtual);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && painel && painel.classList.contains('aberto')) { menu(false); botao.focus(); } });

  /* foto ampliada: galeria de cada obra */
  var amp = $('.ampliada'), galerias = {};
  try { galerias = JSON.parse(($('#galerias') || {}).textContent || '{}'); } catch (e) { galerias = {}; }
  if (amp) {
    var ampImg = $('.amp-fig img', amp), ampNome = $('.amp-nome', amp), ampNum = $('.amp-num', amp), ampLeg = $('.amp-leg', amp);
    var idx = 0, lista = [], voltaFoco = null;
    var poe = function (i) {
      idx = (i + lista.length) % lista.length;
      var f = lista[idx];
      ampImg.style.opacity = 0;
      ampImg.onload = function () { ampImg.style.opacity = 1; };
      ampImg.src = window.innerWidth < 900 ? f.p : f.g;
      ampImg.alt = f.nome;
      ampNome.textContent = f.nome;
      ampLeg.textContent = f.leg;
      ampNum.textContent = (idx + 1) + ' de ' + lista.length;
    };
    var abre = function (fotos) {
      lista = fotos; voltaFoco = document.activeElement; poe(0);
      amp.hidden = false; requestAnimationFrame(function () { amp.classList.add('aberta'); });
      document.body.style.overflow = 'hidden'; $('.amp-fechar', amp).focus();
    };
    var fecha = function () {
      amp.classList.remove('aberta'); document.body.style.overflow = '';
      setTimeout(function () { amp.hidden = true; }, 300);
      if (voltaFoco) voltaFoco.focus();
    };
    $$('[data-galeria]').forEach(function (b) {
      b.addEventListener('click', function () { var g = galerias[b.getAttribute('data-galeria')]; if (g && g.length) abre(g); });
    });
    $('.amp-fechar', amp).addEventListener('click', fecha);
    $('.amp-ant', amp).addEventListener('click', function () { poe(idx - 1); });
    $('.amp-prox', amp).addEventListener('click', function () { poe(idx + 1); });
    amp.addEventListener('click', function (e) { if (e.target === amp) fecha(); });
    document.addEventListener('keydown', function (e) {
      if (amp.hidden) return;
      if (e.key === 'Escape') fecha();
      else if (e.key === 'ArrowLeft') poe(idx - 1);
      else if (e.key === 'ArrowRight') poe(idx + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', amp), primeiro = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    });
    var tx0 = null;
    amp.addEventListener('touchstart', function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
    amp.addEventListener('touchend', function (e) {
      if (tx0 === null) return;
      var dx = e.changedTouches[0].clientX - tx0; tx0 = null;
      if (Math.abs(dx) > 50) poe(idx + (dx < 0 ? 1 : -1));
    });
  }
})();
