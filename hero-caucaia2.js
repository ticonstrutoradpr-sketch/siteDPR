/* Abertura da home (20/09): Villagio Caucaia II, a planta que vira 3D.
   Todo o movimento e CSS (hero-caucaia2.css), disparado pela classe .is-ativa do quadro. Este script so
   troca o quadro ativo a cada alguns segundos, tirando e pondo a classe para a animacao recomecar, e
   pausa quando a aba nao esta visivel. Com prefers-reduced-motion, fica no primeiro quadro, parado. */
(function () {
  'use strict';
  var hero = document.getElementById('heroCc2');
  if (!hero) return;
  var quadros = hero.querySelectorAll('.cc2h-quadro');
  var pontos = hero.querySelectorAll('.cc2h-pontos span');
  if (quadros.length < 2) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var INTERVALO_MS = 8000;
  var atual = 0;
  var timer = null;

  function ativar(n) {
    for (var k = 0; k < quadros.length; k++) quadros[k].classList.toggle('is-ativa', k === n);
    for (var j = 0; j < pontos.length; j++) pontos[j].classList.toggle('is-ativa', j === n);
  }

  function proximo() {
    var n = (atual + 1) % quadros.length;
    // tira a classe e forca o navegador a perceber, para a animacao do quadro recomecar do zero
    quadros[n].classList.remove('is-ativa');
    void quadros[n].offsetWidth;
    atual = n;
    ativar(n);
  }

  function ligar() { if (!timer) timer = window.setInterval(proximo, INTERVALO_MS); }
  function desligar() { if (timer) { window.clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) desligar(); else ligar();
  });
  ligar();
})();
