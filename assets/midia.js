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
  var pedido = false, mxs = 0, mys = 0;
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
    /* depois da grade as letras somem e ficam so os videos */
    var some = suave(fase(p, .36, .46));
    for (var n = 0; n < copias.length; n++) {
      var q = copias[n], esp = fs * larg[q.i] * e * (.42 + .95 * c), x = q.j * esp + (q.i % 2 ? deriva : -deriva), y = (q.i - (LETRAS.length - 1) / 2) * passo + q.sobe * fs * .08 * c;
      var curva = (1 - c) * e, z = Math.min(700, x * x * .0011) * curva, ry = limita(-x * .03, -35, 35) * curva;
      var op = (q.j === 0 ? 1 : Math.min(1, e * 1.6)) * (1 - some);
      q.el.style.opacity = op;
      q.el.style.visibility = some > .99 ? 'hidden' : '';
      q.el.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
    }
    document.body.classList.toggle('na-midia', p > 0 && p < 1);
    /* videos na parede de uma sala circular em volta de quem olha: a rolagem gira a sala. O da frente e o foco;
       os dos lados vem curvando em direcao a pessoa e somem no fundo. O mouse inclina a sala de leve. */
    var cw = cards.length ? cards[0].offsetWidth : 400, raio = cel ? W * .92 : Math.max(760, W * .56);
    var passoA = (cw / raio) * (cel ? 1.12 : 1.2), andar = suave(fase(p, .4, .97));
    var giro = (-1.6 + andar * (cards.length - 1 + 1.6)) * passoA;
    mxs += (estado.mx - mxs) * .1; mys += (estado.my - mys) * .1;
    pilula.style.backgroundPosition = 'calc(50% - ' + (giro * raio * .22).toFixed(1) + 'px) 50%';
    cards.forEach(function (card, k) {
      var th = k * passoA - giro + mxs * .12, a = Math.abs(th);
      var x = Math.sin(th) * raio, z = -Math.cos(th) * raio + raio * (cel ? .72 : .8), y = mys * -24 + Math.sin(th) * mys * 30;
      var ry = -th * 180 / Math.PI, rx = mys * 4;
      var op = fase(p, .38, .44) * (1 - fase(a, 1.05, 1.35));
      var borrao = Math.max(0, a - .55) * 5, luz = 1 - Math.max(0, a - .4) * .35;
      card.style.opacity = op.toFixed(3);
      card.style.zIndex = String(Math.round(100 - a * 40));
      card.style.filter = borrao > .05 ? 'blur(' + borrao.toFixed(2) + 'px) brightness(' + luz.toFixed(3) + ')' : '';
      /* cortina: o video abre enquanto chega pela direita */
      card.style.setProperty('--rv', limita((1.05 - th) / .55, 0, 1).toFixed(3));
      card.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
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
  var estado = { mx: 0, my: 0 };
  if (!calmo) fixo.addEventListener('mousemove', function (ev) { estado.mx = (ev.clientX / window.innerWidth) * 2 - 1; estado.my = (ev.clientY / window.innerHeight) * 2 - 1; if (!pedido) { pedido = true; requestAnimationFrame(quadro); } });
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
