/* Destaque do Villagio Caucaia II na home (20/09): liga a rolagem ao progresso --p da cena 3D.
   p = 0 quando o topo da cena entra pela base da tela; p = 1 quando o centro da cena chega ao centro
   da tela. Todo o movimento e CSS (caucaia2-destaque.css) a partir de --p. Sem biblioteca.
   Com prefers-reduced-motion, a cena nasce montada e nada anima. */
(function () {
  'use strict';
  var cena = document.getElementById('cc2Cena');
  if (!cena) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cena.style.setProperty('--p', '1');
    return;
  }
  var ultimo = -1;
  var agendado = false;

  function progresso() {
    var r = cena.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 1;
    var inicio = vh;                    // topo da cena na base da tela
    var fim = vh / 2 - r.height / 2;    // centro da cena no centro da tela
    var faixa = inicio - fim;
    if (faixa <= 0) return 1;
    var p = (inicio - r.top) / faixa;
    return Math.max(0, Math.min(1, p));
  }

  function aplicar() {
    agendado = false;
    var p = progresso();
    if (Math.abs(p - ultimo) < 0.002) return;
    ultimo = p;
    cena.style.setProperty('--p', p.toFixed(3));
  }

  function pedir() {
    if (agendado) return;
    agendado = true;
    window.requestAnimationFrame(aplicar);
  }

  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  pedir();
})();
