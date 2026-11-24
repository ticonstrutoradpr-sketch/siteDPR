/* DPR Construtora - animacoes do site novo, caminho "Galeria de arcos" (sem biblioteca). */
(function () {
  var doc = document.documentElement;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var limita = function (v) { return Math.min(1, Math.max(0, v)); };
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
            d.style.transitionDelay = (i++ * 60) + 'ms';
            w.appendChild(d); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { anda(n); }
      });
    })(el);
  }
  $$('[data-palavras]').forEach(quebraPalavras);

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

  /* abertura: titulo depois do arco */
  var tituloAb = $('.abertura h1');
  if (tituloAb) setTimeout(function () { tituloAb.classList.add('visivel'); }, calmo ? 0 : 700);

  /* galeria em arco: troca a foto com uma cortina de baixo para cima */
  var galeria = $('.galeria');
  if (galeria) {
    var slides = $$('.slide', galeria), atual = 0, relogio = null;
    var numero = $('.contador b'), legFoto = $('.legenda-foto'), barra = $('.progresso i');
    var corre = function () { if (!barra) return; barra.classList.remove('corre'); void barra.offsetWidth; barra.classList.add('corre'); };
    var mostra = function (i) {
      if (i === atual) return;
      var velha = slides[atual], nova = slides[i];
      velha.classList.remove('entrando'); velha.classList.add('saindo');
      nova.classList.remove('saindo'); nova.classList.add('ativa', 'entrando');
      setTimeout(function () { velha.classList.remove('ativa', 'saindo'); nova.classList.remove('entrando'); }, 1350);
      atual = i;
      if (numero) numero.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      if (legFoto) { legFoto.style.opacity = 0; setTimeout(function () { legFoto.textContent = nova.getAttribute('data-legenda'); legFoto.style.opacity = 1; }, 380); }
      corre();
    };
    var proxima = function () { if (!document.hidden) mostra((atual + 1) % slides.length); };
    if (!calmo && slides.length > 1) {
      setTimeout(function () { corre(); relogio = setInterval(proxima, 5200); }, 1600);
      galeria.addEventListener('click', function () { clearInterval(relogio); proxima(); relogio = setInterval(proxima, 5200); });
    }
  }

  /* no pc, o arco acompanha o mouse de leve */
  var moldura = $('.galeria-moldura');
  if (moldura && mouse && !calmo) {
    document.addEventListener('mousemove', function (e) {
      if (window.scrollY > window.innerHeight) return;
      moldura.style.setProperty('--mx', ((e.clientX / window.innerWidth) - .5).toFixed(3) * 2);
      moldura.style.setProperty('--my', ((e.clientY / window.innerHeight) - .5).toFixed(3) * 2);
    }, { passive: true });
  }

  /* o caminho: a foto em arco segue o mouse sobre cada etapa */
  var previa = $('.previa');
  if (previa && mouse && !calmo) {
    var fotos = $$('img', previa), px = 0, py = 0, tx = 0, ty = 0, rodaPrevia = false;
    fotos.forEach(function (f) { f.src = f.getAttribute('data-src'); });
    var andaPrevia = function () {
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      previa.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
      if (Math.abs(tx - px) + Math.abs(ty - py) > 0.3) requestAnimationFrame(andaPrevia); else rodaPrevia = false;
    };
    var alvo = function (e) { tx = e.clientX + 70; ty = e.clientY - 125; };
    $$('.passo').forEach(function (li) {
      li.addEventListener('mouseenter', function (e) {
        alvo(e); if (!previa.classList.contains('ligada')) { px = tx; py = ty; previa.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)'; }
        var n = li.getAttribute('data-foto');
        fotos.forEach(function (f) { f.classList.toggle('ativa', f.getAttribute('data-i') === n); });
        previa.classList.add('ligada');
      });
      li.addEventListener('mousemove', function (e) { alvo(e); if (!rodaPrevia) { rodaPrevia = true; requestAnimationFrame(andaPrevia); } });
      li.addEventListener('mouseleave', function () { previa.classList.remove('ligada'); });
    });
  }

  /* obras: altura da secao para o trilho andar de lado */
  var obras = $('.obras'), trilho = $('.obras-trilho'), obrasAnda = 0;
  function arrumaObras() {
    if (!obras || !trilho) return;
    if (largo() && !calmo) {
      obrasAnda = Math.max(0, trilho.scrollWidth - window.innerWidth);
      obras.style.height = (window.innerHeight + obrasAnda) + 'px';
    } else { obrasAnda = 0; obras.style.height = ''; trilho.style.transform = ''; }
  }

  var topo = $('.topo'), zap = $('.zap'), paralaxe = $$('[data-par]');
  var ultimoY = window.scrollY, pedido = false;

  function quadro() {
    pedido = false;
    var H = window.innerHeight, y = window.scrollY, r;

    if (topo && !doc.classList.contains('menu-aberto')) {
      topo.classList.toggle('solido', y > 20);
      if (y > H * 0.6 && y > ultimoY + 4) topo.classList.add('escondido');
      else if (y < ultimoY - 4 || y <= H * 0.6) topo.classList.remove('escondido');
    }
    if (zap) zap.classList.toggle('visivel', y > H * 0.8);
    ultimoY = y;
    if (calmo) return;

    if (obras && obrasAnda > 0) {
      r = obras.getBoundingClientRect();
      var po = limita(-r.top / Math.max(1, r.height - H));
      trilho.style.transform = 'translate3d(' + (-po * obrasAnda).toFixed(1) + 'px,0,0)';
    }

    paralaxe.forEach(function (el) {
      r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > H + 100) return;
      var v = parseFloat(el.getAttribute('data-par')) || 0.08;
      el.style.setProperty('--par', ((r.top + r.height / 2 - H / 2) * -v).toFixed(1) + 'px');
    });
  }
  function pede() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
  function arruma() { arrumaObras(); quadro(); }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(arruma.t); arruma.t = setTimeout(arruma, 120); });
  window.addEventListener('load', arruma);
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
  if (cursor && !calmo && mouse) {
    var mx = 0, my = 0, cx = 0, cy = 0, rodando = false;
    var anda = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(anda); else rodando = false;
    };
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; cursor.classList.add('ligado');
      cursor.classList.toggle('grande', !!e.target.closest('a, button, .arco-card, .proj, .galeria'));
      if (!rodando) { rodando = true; requestAnimationFrame(anda); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('ligado'); });
  }
})();
