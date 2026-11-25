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

  /* topo: transparente sobre a foto da abertura, marfim depois */
  var topo = $('.topo'), heroi = $('.heroi'), pedido = false;
  function quadro() {
    pedido = false;
    if (!topo || doc.classList.contains('menu-aberto')) return;
    var fim = heroi ? heroi.offsetHeight - topo.offsetHeight : 0;
    topo.classList.toggle('solido', window.scrollY > fim - 4);
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', quadro);
  quadro();

  /* menu do celular */
  var botao = $('.topo-menu'), painel = $('.painel');
  function menu(abrir) {
    if (!botao || !painel) return;
    painel.classList.toggle('aberto', abrir);
    doc.classList.toggle('menu-aberto', abrir);
    botao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    painel.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    document.body.style.overflow = abrir ? 'hidden' : '';
    if (!abrir) quadro();
  }
  if (botao) botao.addEventListener('click', function () { menu(!painel.classList.contains('aberto')); });
  $$('.painel a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
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
