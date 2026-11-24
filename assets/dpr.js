/* DPR Construtora - animacoes do site novo (sem biblioteca). */
(function () {
  var doc = document.documentElement;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var limita = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v)); };
  var suave = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var largo = function () { return window.innerWidth >= 900; };

  /* palavras: cada palavra dentro de uma mascara, para subir */
  function quebraPalavras(el) {
    var i = 0;
    (function anda(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var w = document.createElement('span'); w.className = 'pal';
            var d = document.createElement('span'); d.textContent = t;
            d.style.transitionDelay = (i++ * 75) + 'ms';
            w.appendChild(d); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { anda(n); }
      });
    })(el);
  }
  $$('[data-palavras]').forEach(quebraPalavras);

  /* manifesto: palavras que acendem */
  var manifesto = $('[data-acende]');
  var acesas = [];
  if (manifesto) {
    (function anda(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = 'acende'; s.textContent = t;
            acesas.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { anda(n); }
      });
    })(manifesto);
  }

  /* revelar ao entrar na tela.
     Alguns itens se revelam em grupo, pelo pai: a "cortina" esconde o proprio item com um recorte
     (o navegador nao o ve entrar), e no celular as fotos da obra ficam fora da tela, na faixa de lado. */
  var emGrupo = function (el) {
    if (el.getAttribute('data-revela') === 'cortina') return el.parentElement;
    if (!largo() && el.classList.contains('arco-card')) return el.parentElement;
    return null;
  };
  var alvos = $$('[data-revela], [data-palavras]').filter(function (el) { return !el.closest('.abertura'); });
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var grupos = [];
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var g = grupos.filter(function (x) { return x.pai === e.target; })[0];
        (g ? g.filhos : [e.target]).forEach(function (el) { el.classList.add('visivel'); });
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    alvos.forEach(function (el) {
      var pai = emGrupo(el);
      if (!pai) { obs.observe(el); return; }
      var g = grupos.filter(function (x) { return x.pai === pai; })[0];
      if (g) { g.filhos.push(el); return; }
      grupos.push({ pai: pai, filhos: [el] }); obs.observe(pai);
    });
  }

  /* abertura */
  var ab = $('.abertura'), porta = $('.porta'), textoAb = $('.abertura-texto');
  var tituloAb = ab && $('h1', ab);
  if (tituloAb) setTimeout(function () { tituloAb.classList.add('visivel'); }, calmo ? 0 : 950);

  function arrumaPorta() {
    if (!ab || !porta) return;
    var palco = porta.parentNode, W = palco.clientWidth, H = palco.clientHeight;
    var t0, aw, ah, cx, b0;
    if (largo()) {
      ah = H * 0.66; aw = ah * 0.72; cx = W * 0.73; b0 = H * 0.12; t0 = H - b0 - ah;
    } else {
      var bts = $('.abertura-bts', ab);
      var fim = bts ? bts.offsetTop + bts.offsetHeight + bts.offsetParent.offsetTop : H * 0.6;
      t0 = fim + 32; b0 = 22; ah = H - t0 - b0;
      aw = Math.min(ah * 0.74, W - 2 * 28);
      if (ah < 150) { aw = Math.min(220, W - 56); t0 = H - 130; b0 = 0; }
      cx = W / 2;
    }
    var s = porta.style;
    s.setProperty('--t0', t0 + 'px'); s.setProperty('--b0', b0 + 'px');
    s.setProperty('--l0', (cx - aw / 2) + 'px'); s.setProperty('--r0', (W - cx - aw / 2) + 'px');
    s.setProperty('--rr', (aw / 2) + 'px');
    var meioArco = b0 === 0 ? t0 + 65 : t0 + ah / 2;
    s.setProperty('--dx', (cx - W / 2) + 'px'); s.setProperty('--dy', (meioArco - H / 2) + 'px');
    porta.classList.add('pronta');
  }

  /* obras: altura da secao para o trilho andar de lado */
  var obras = $('.obras'), trilho = $('.obras-trilho');
  var obrasAnda = 0;
  function arrumaObras() {
    if (!obras || !trilho) return;
    if (largo() && !calmo) {
      obrasAnda = Math.max(0, trilho.scrollWidth - window.innerWidth);
      obras.style.height = (window.innerHeight + obrasAnda) + 'px';
    } else { obrasAnda = 0; obras.style.height = ''; trilho.style.transform = ''; }
  }

  var topo = $('.topo'), zap = $('.zap'), lista = $('.etapas-lista'), etapas = $$('.etapa');
  var faixa = $('.faixa-linha'), terreno = $('.terreno');
  var ultimoY = window.scrollY, pedido = false;

  function quadro() {
    pedido = false;
    var H = window.innerHeight, y = window.scrollY, r;

    if (ab && !calmo) {
      r = ab.getBoundingClientRect();
      var p = limita(-r.top / Math.max(1, r.height - H));
      ab.style.setProperty('--p', p.toFixed(4));
      if (porta) porta.style.setProperty('--e', suave(limita(p / 0.72)).toFixed(4));
      ab.classList.toggle('passou', p > 0.3);
    }
    /* enquanto o logo grande da abertura esta na tela, o do topo fica escondido */
    if (ab && topo) {
      var pAb = calmo ? (y < H * 0.5 ? 0 : 1) : limita(-ab.getBoundingClientRect().top / Math.max(1, ab.offsetHeight - H));
      topo.classList.toggle('no-inicio', pAb < 0.22);
    }

    var fimAb = ab ? ab.offsetTop + ab.offsetHeight - 90 : 0;
    if (topo && !doc.classList.contains('menu-aberto')) {
      topo.classList.toggle('solido', y > fimAb);
      if (y > fimAb + H * 0.4 && y > ultimoY + 4) topo.classList.add('escondido');
      else if (y < ultimoY - 4 || y <= fimAb) topo.classList.remove('escondido');
    }
    if (zap) zap.classList.toggle('visivel', y > H * 0.9);
    ultimoY = y;

    if (calmo) return;

    if (manifesto && acesas.length) {
      r = manifesto.getBoundingClientRect();
      var pm = limita((H * 0.86 - r.top) / (H * 0.5 + r.height * 0.5));
      var n = Math.round(pm * acesas.length * 1.05);
      acesas.forEach(function (s, i) { s.classList.toggle('acesa', i < n); });
    }

    if (lista) {
      r = lista.getBoundingClientRect();
      var pl = limita((H * 0.62 - r.top) / r.height);
      lista.style.setProperty('--prog', pl.toFixed(4));
      var ponto = pl * r.height;
      etapas.forEach(function (et) { et.classList.toggle('ativa', et.offsetTop + 38 <= ponto + 1); });
    }

    if (obras && obrasAnda > 0) {
      r = obras.getBoundingClientRect();
      var po = limita(-r.top / Math.max(1, r.height - H));
      trilho.style.transform = 'translate3d(' + (-po * obrasAnda).toFixed(1) + 'px,0,0)';
    }

    if (faixa) {
      r = faixa.getBoundingClientRect();
      if (r.bottom > -100 && r.top < H + 100) {
        var meio = faixa.scrollWidth / 2;
        var desl = ((H - r.top) * 0.45) % meio;
        faixa.style.transform = 'translate3d(' + (-desl).toFixed(1) + 'px,0,0)';
      }
    }

    if (terreno) {
      r = terreno.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H) {
        var pt = (r.top + r.height / 2 - H / 2) / H;
        terreno.style.setProperty('--par', (pt * -9).toFixed(2) + '%');
      }
    }
  }
  function pede() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }

  function arruma() { arrumaPorta(); arrumaObras(); quadro(); }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(arruma.t); arruma.t = setTimeout(arruma, 120); });
  window.addEventListener('load', arruma);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(arruma);
  arruma();

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

  /* cursor com o arco */
  var cursor = $('.cursor');
  if (cursor && !calmo && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mx = 0, my = 0, cx = 0, cy = 0, rodando = false;
    var anda = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(anda); else rodando = false;
    };
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; cursor.classList.add('ligado');
      cursor.classList.toggle('grande', !!e.target.closest('a, button, .arco-card, .proj'));
      if (!rodando) { rodando = true; requestAnimationFrame(anda); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('ligado'); });
  }
})();
