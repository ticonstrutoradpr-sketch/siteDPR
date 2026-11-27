/* Pagina Sobre a DPR: topo com fundo ao rolar, arco em paralaxe, manifesto preenchido palavra a palavra,
   palavra que gira na resposta, paineis dos pilares, linha do metodo que se desenha. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var limita = function (v) { return Math.max(0, Math.min(1, v)); };
  var topo = $('.topo'), abre = $('.sb-abre'), man = $('.sb-manifesto'), met = $('.sb-metodo');
  var palavras = $$('.sb-manifesto-txt span'), etapas = $$('.sb-etapa'), linha = $('.sb-linha');
  var yAntes = window.scrollY, pedido = false;

  function prog(sec) { var H = window.innerHeight; return limita(-sec.getBoundingClientRect().top / Math.max(1, sec.offsetHeight - H)); }
  function quadro() {
    pedido = false;
    var y = window.scrollY, H = window.innerHeight;
    /* topo: veu marfim depois da abertura, some ao descer e volta ao subir */
    if (topo && !document.documentElement.classList.contains('menu-aberto')) {
      var passou = y > H * .6;
      topo.classList.toggle('fundo', passou);
      if (!passou || y < yAntes - 4) topo.classList.remove('fora');
      else if (y > yAntes + 6) topo.classList.add('fora');
    }
    yAntes = y;
    if (calmo) return;
    if (abre) abre.style.setProperty('--sy', Math.min(y, H) + 'px');
    if (man) {
      var p = prog(man), n = palavras.length;
      palavras.forEach(function (w, i) { w.classList.toggle('acesa', p * 1.15 > (i + 1) / n); });
      man.style.setProperty('--fim', limita((p - .78) / .18).toFixed(3));
    }
    if (met && window.innerWidth >= 900) {
      var q = prog(met);
      linha.style.setProperty('--lp', limita(q * 1.15).toFixed(3));
      etapas.forEach(function (e, i) { e.classList.toggle('acesa', q * 1.15 >= i / etapas.length + .02); });
    }
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', quadro);
  quadro();

  /* resposta: a palavra troca sozinha, subindo */
  var gira = $$('.sb-gira > span'), g = 0;
  if (gira.length) {
    gira[0].classList.add('vez');
    if (!calmo) setInterval(function () {
      var velha = gira[g]; g = (g + 1) % gira.length;
      velha.classList.remove('vez'); velha.classList.add('foi');
      gira[g].classList.remove('foi'); gira[g].classList.add('vez');
      setTimeout(function () { velha.classList.remove('foi'); }, 900);
    }, 2300);
  }

  /* pilares: o painel abre com o mouse, o foco ou o toque */
  var paineis = $$('.sb-painel');
  function ativa(p) { paineis.forEach(function (x) { x.classList.toggle('ativo', x === p); x.setAttribute('aria-expanded', x === p ? 'true' : 'false'); }); }
  paineis.forEach(function (p) {
    p.addEventListener('mouseenter', function () { if (window.innerWidth >= 900) ativa(p); });
    p.addEventListener('focus', function () { ativa(p); });
    p.addEventListener('click', function () { ativa(p); });
  });
})();
