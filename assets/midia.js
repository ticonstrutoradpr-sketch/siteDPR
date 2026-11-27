/* Na midia: a palavra MIDIA empilhada numa pilula sobre a grade. Ao rolar, a pilula abre ate a tela inteira,
   cada letra se multiplica numa fileira curva em 3D que depois se endireita numa grade de letras gigantes,
   e os videos chegam do fundo em direcao a tela, um depois do outro, cada um com nome e codigo embaixo.
   Clicar num video abre ele grande, com som. Com "reduzir movimento" a secao vira uma lista simples. */
(function () {
  var sec = document.querySelector('.midia');
  if (!sec) return;
  var fixo = sec.querySelector('.mid-fixo'), pilula = sec.querySelector('.mid-pilula'), anel = sec.querySelector('.mid-anel');
  var palco = sec.querySelector('.mid-letras'), cards = [].slice.call(sec.querySelectorAll('.mid-card'));
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var limita = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var fase = function (p, a, b) { return limita((p - a) / (b - a), 0, 1); };
  var suave = function (v) { v = limita(v, 0, 1); return v * v * (3 - 2 * v); };
  if (calmo) { sec.classList.add('mid-calmo'); }

  /* letras: 5 fileiras (M I D I A) de 25 copias cada; a do meio e a que aparece na pilula */
  var LETRAS = palco.getAttribute('data-palavra').split(''), NC = 25, meio = (NC - 1) / 2, copias = [];
  var acaso = (function () { var s = 11; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  LETRAS.forEach(function (l, i) {
    for (var k = 0; k < NC; k++) {
      var s = document.createElement('span');
      s.className = 'mid-l' + (k === meio ? ' centro' : ''); s.textContent = l; s.setAttribute('aria-hidden', 'true');
      palco.appendChild(s);
      copias.push({ el: s, i: i, j: k - meio, gira: (acaso() - .5) * 7, sobe: (acaso() - .5) });
    }
  });
  cards.forEach(function (c) { palco.appendChild(c); });

  /* largura de cada letra (em em) para a fileira ter o espacamento da propria letra */
  var larg = LETRAS.map(function () { return .45; });
  function medeLetras() { var g = document.createElement('canvas').getContext('2d'); g.font = '200 100px Poppins'; larg = LETRAS.map(function (l) { return Math.max(.3, g.measureText(l).width / 100); }); }
  medeLetras();
  var POS = [[-.24, -.15, 8], [.25, .12, -7], [-.2, .14, 5], [.22, -.16, -6], [-.26, .06, 7], [.18, .16, -5], [0, -.04, 3]];
  var pedido = false;
  function quadro() {
    pedido = false;
    if (calmo) return;
    var H = window.innerHeight, W = window.innerWidth, cel = W < 900;
    var total = sec.offsetHeight - H, p = limita((window.scrollY - sec.offsetTop) / Math.max(1, total), 0, 1);
    var a = suave(fase(p, 0, .1)), e = suave(fase(p, .06, .24)), c = suave(fase(p, .2, .36));
    /* pilula abre ate a tela inteira */
    var H0 = H * .84, W0 = Math.min(H0 * .43, W * .62);
    var pw = W0 + (W - W0) * a, ph = H0 + (H - H0) * a, r = (W0 / 2) * (1 - a);
    pilula.style.width = pw + 'px'; pilula.style.height = ph + 'px'; pilula.style.borderRadius = r + 'px';
    anel.style.width = (W0 + 44) + 'px'; anel.style.height = (H0 + 44) + 'px'; anel.style.borderRadius = (W0 / 2 + 22) + 'px';
    anel.style.opacity = 1 - a * 1.4;
    /* letras */
    var fs0 = H0 * .158, fs1 = H * (cel ? .17 : .205), fs = fs0 + (fs1 - fs0) * c, passo = fs * (.92 + .12 * c);
    palco.style.fontSize = fs + 'px';
    var deriva = c * (p - .2) * fs * 3;
    for (var n = 0; n < copias.length; n++) {
      var q = copias[n], esp = fs * larg[q.i] * e * (.42 + .95 * c), x = q.j * esp + (q.i % 2 ? deriva : -deriva), y = (q.i - (LETRAS.length - 1) / 2) * passo + q.sobe * fs * .08 * c;
      var curva = (1 - c) * e, z = Math.min(700, x * x * .0011) * curva, ry = limita(-x * .03, -35, 35) * curva;
      var op = q.j === 0 ? 1 : Math.min(1, e * 1.6);
      q.el.style.opacity = op;
      q.el.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
    }
    document.body.classList.toggle('na-midia', p > 0 && p < 1);
    /* videos: cada um vem do fundo ate perto da tela e some */
    cards.forEach(function (card, k) {
      var ini = .3 + k * .085, t = fase(p, ini, ini + .26), pos = POS[k % POS.length];
      var op = fase(t, 0, .12) * (1 - fase(t, .84, 1));
      var z = -1100 + t * (cel ? 1300 : 1500), x = pos[0] * W * (cel ? .45 : 1), y = pos[1] * H;
      card.style.opacity = op.toFixed(3);
      card.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + (pos[2] * (1 - t)).toFixed(2) + 'deg)';
      card.style.pointerEvents = op > .4 ? 'auto' : 'none';
      var v = card.querySelector('video');
      if (op > .03) {
        if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
        if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else if (!v.paused) v.pause();
    });
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', quadro);
  if (document.fonts && document.fonts.load) document.fonts.load('200 100px Poppins').then(function () { medeLetras(); quadro(); }).catch(function () {});
  quadro();

  /* video grande, com som */
  var modal = sec.querySelector('.mid-modal'), mv = modal.querySelector('video'), volta = null;
  function abre(card) {
    volta = card;
    mv.src = card.querySelector('video').getAttribute('data-src');
    modal.hidden = false; requestAnimationFrame(function () { modal.classList.add('aberto'); });
    document.body.style.overflow = 'hidden';
    var pr = mv.play(); if (pr && pr.catch) pr.catch(function () {});
    modal.querySelector('.mid-fechar').focus();
  }
  function fecha() {
    modal.classList.remove('aberto'); mv.pause(); document.body.style.overflow = '';
    setTimeout(function () { modal.hidden = true; mv.removeAttribute('src'); mv.load(); }, 300);
    if (volta) volta.focus();
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () { abre(card); });
    card.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abre(card); } });
  });
  modal.querySelector('.mid-fechar').addEventListener('click', fecha);
  modal.addEventListener('click', function (ev) { if (ev.target === modal) fecha(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !modal.hidden) fecha(); });
})();
