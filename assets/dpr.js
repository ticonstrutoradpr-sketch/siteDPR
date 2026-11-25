/* DPR Construtora - animacoes do site novo, versao 3 (sem biblioteca). */
(function () {
  var doc = document.documentElement;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var limita = function (v) { return Math.min(1, Math.max(0, v)); };
  var suave = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var largo = function () { return window.innerWidth >= 900; };

  /* ---------- palavras que sobem (titulos) ---------- */
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
            var d = document.createElement('span'); d.textContent = t; d.style.transitionDelay = (i++ * 70) + 'ms';
            w.appendChild(d); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { anda(n); }
      });
    })(el);
  }
  $$('[data-palavras]').forEach(quebraPalavras);

  /* frase-guia: cada palavra acende com a rolagem */
  var manifesto = $('[data-acende]'), acesas = [];
  if (manifesto) {
    (function anda(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = 'acende'; s.textContent = t; acesas.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { anda(n); }
      });
    })(manifesto);
  }

  /* ---------- revelar ao entrar na tela ---------- */
  var alvos = $$('[data-revela], [data-palavras]');
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- empreendimentos: a janela em arco se abre ao entrar na tela ---------- */
  var emps = $$('.emp');
  if (calmo || !('IntersectionObserver' in window)) emps.forEach(function (e) { e.classList.add('aberto'); });
  else {
    var obsE = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('aberto'); obsE.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    emps.forEach(function (e) { obsE.observe(e); });
  }

  /* ---------- foto ampliada: galeria de cada empreendimento ---------- */
  var amp = $('.ampliada');
  var galerias = {};
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
      ampImg.alt = f.alt || f.nome;
      ampNome.textContent = f.nome;
      ampLeg.textContent = f.leg;
      ampNum.textContent = (idx + 1) + ' de ' + lista.length;
    };
    var abre = function (fotos, i) {
      lista = fotos; voltaFoco = document.activeElement; poe(i);
      amp.hidden = false; requestAnimationFrame(function () { amp.classList.add('aberta'); });
      document.body.style.overflow = 'hidden'; $('.amp-fechar', amp).focus();
    };
    var fecha = function () {
      amp.classList.remove('aberta'); document.body.style.overflow = '';
      setTimeout(function () { amp.hidden = true; }, 350);
      if (voltaFoco) voltaFoco.focus();
    };
    $$('[data-galeria]').forEach(function (b) {
      b.addEventListener('click', function () { var g = galerias[b.getAttribute('data-galeria')]; if (g && g.length) abre(g, 0); });
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

  /* ---------- abertura: slide de videos ---------- */
  var heroi = $('.heroi');
  if (heroi) {
    var cenas = $$('.cena', heroi), barras = $$('.barra', heroi), frase = $('.frase', heroi);
    var pausa = $('.heroi-pausa', heroi), guia = $('.arco-guia', heroi);
    var cel = !largo(), atual = -1, pausado = calmo, visivelHeroi = true, ultimoAvanco = Date.now(), ultimoTempo = -1;

    cenas.forEach(function (c) {
      var v = $('video', c);
      v.muted = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.poster = c.getAttribute(cel ? 'data-capa-cel' : 'data-capa-pc');
      v.addEventListener('ended', function () { if (cenas[atual] === c && !pausado) mostra((atual + 1) % cenas.length); });
    });
    var fonte = function (c) {
      var v = $('video', c);
      if (!v.getAttribute('src')) { v.src = c.getAttribute(cel ? 'data-cel' : 'data-pc'); v.preload = 'auto'; }
      return v;
    };

    /* frase: letra por letra; "|" marca onde comeca o italico */
    var escreve = function (texto) {
      frase.textContent = '';
      var partes = texto.split('|'), n = 0;
      partes.forEach(function (parte, k) {
        parte.trim().split(/\s+/).forEach(function (palavra) {
          if (!palavra) return;
          var w = document.createElement(k === 1 ? 'em' : 'span'); w.className = 'pal-f';
          palavra.split('').forEach(function (ch) {
            var le = document.createElement('span'); le.className = 'le';
            var s = document.createElement('span'); s.textContent = ch; s.style.transitionDelay = (n++ * 22) + 'ms';
            le.appendChild(s); w.appendChild(le);
          });
          frase.appendChild(w);
        });
      });
    };
    var trocaFrase = function (texto, primeira) {
      if (calmo) { escreve(texto); frase.classList.add('dentro'); return; }
      var entra = function () { escreve(texto); frase.classList.remove('fora'); void frase.offsetWidth; requestAnimationFrame(function () { frase.classList.add('dentro'); }); };
      if (primeira) { setTimeout(entra, 500); return; }
      frase.classList.remove('dentro'); frase.classList.add('fora');
      setTimeout(entra, 520);
    };

    var mostra = function (i) {
      if (i === atual) return;
      var nova = cenas[i], velha = atual >= 0 ? cenas[atual] : null, v = fonte(nova);
      fonte(cenas[(i + 1) % cenas.length]);
      cenas.forEach(function (c) { if (c !== velha) c.classList.remove('saindo'); });
      if (velha) { velha.classList.remove('ativa'); velha.classList.add('saindo'); }
      nova.classList.add('ativa');
      if (velha && !calmo && nova.animate) {
        var W = heroi.clientWidth, H = heroi.clientHeight;
        var aw = Math.min(W * 0.3, 340), ah = Math.min(aw * 1.4, H * 0.62), l = (W - aw) / 2, t = H - ah, r = aw / 2;
        nova.animate([
          { clipPath: 'inset(' + t + 'px ' + l + 'px 0px ' + l + 'px round ' + r + 'px ' + r + 'px 0px 0px)' },
          { clipPath: 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)' }
        ], { duration: 1500, easing: 'cubic-bezier(.7,0,.2,1)' });
        if (guia) { guia.classList.remove('vai'); void guia.offsetWidth; guia.classList.add('vai'); }
        setTimeout(function () { if (!velha.classList.contains('ativa')) { velha.classList.remove('saindo'); $('video', velha).pause(); } }, 1560);
      } else if (velha) { velha.classList.remove('saindo'); $('video', velha).pause(); }
      try { v.currentTime = 0; } catch (e) {}
      if (!pausado && visivelHeroi) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      barras.forEach(function (b, k) { b.classList.toggle('atual', k === i); b.classList.toggle('vista', k < i); b.style.setProperty('--prog', 0); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      trocaFrase(nova.getAttribute('data-frase'), atual < 0);
      atual = i; ultimoAvanco = Date.now(); ultimoTempo = -1;
    };

    /* barra da cena atual acompanha o video; se o video travar, passa para o proximo */
    var acompanha = function () {
      if (atual >= 0 && !pausado && visivelHeroi) {
        var v = $('video', cenas[atual]);
        if (v.duration && isFinite(v.duration)) barras[atual].style.setProperty('--prog', limita(v.currentTime / v.duration).toFixed(3));
        if (v.currentTime !== ultimoTempo) { ultimoTempo = v.currentTime; ultimoAvanco = Date.now(); }
        else if (Date.now() - ultimoAvanco > 9000) mostra((atual + 1) % cenas.length);
      } else { ultimoAvanco = Date.now(); }
      requestAnimationFrame(acompanha);
    };

    barras.forEach(function (b, k) { b.addEventListener('click', function () { mostra(k); }); });
    if (pausa) {
      pausa.addEventListener('click', function () {
        pausado = !pausado;
        pausa.setAttribute('aria-pressed', pausado ? 'true' : 'false');
        pausa.setAttribute('aria-label', pausado ? 'Tocar vídeos' : 'Pausar vídeos');
        var v = $('video', cenas[atual]);
        if (pausado) v.pause(); else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      });
      if (calmo) { pausa.setAttribute('aria-pressed', 'true'); pausa.setAttribute('aria-label', 'Tocar vídeos'); }
    }
    /* fora da tela, o video para (economiza bateria e dados) */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visivelHeroi = es[0].isIntersecting;
        var v = atual >= 0 && $('video', cenas[atual]);
        if (!v) return;
        if (!visivelHeroi) v.pause(); else if (!pausado) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      }, { threshold: 0.05 }).observe(heroi);
    }
    mostra(0);
    requestAnimationFrame(acompanha);
  }

  /* ---------- obra entregue: tour pela casa ---------- */
  var tour = $('.tour'), tourFotos = $$('.tour-fotos img'), tourItens = $$('.tour-item');
  var tourConta = $('.tour-conta'), tourTexto = $('.tour-texto'), tourAtual = -1;
  function mostraTour(i) {
    if (!tour || i === tourAtual || !tourFotos[i]) return;
    var velha = tourFotos[tourAtual];
    tourFotos.forEach(function (f) { if (f !== velha) f.classList.remove('saindo'); });
    if (velha) { velha.classList.remove('ativa'); velha.classList.add('saindo'); }
    tourFotos[i].classList.add('ativa');
    tourItens.forEach(function (b, k) { b.classList.toggle('ativo', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    if (tourConta) tourConta.textContent = '0' + (i + 1) + ' / 0' + tourFotos.length;
    if (tourTexto) tourTexto.setAttribute('data-atual', tourItens[i] ? tourItens[i].textContent.replace(/^\d+/, '') : '');
    tourAtual = i;
  }
  if (tour) {
    mostraTour(0);
    tourItens.forEach(function (b, k) {
      b.addEventListener('click', function () {
        if (calmo) { mostraTour(k); return; }
        /* rola ate o ponto da secao em que esta foto aparece */
        var alto = tour.offsetHeight - window.innerHeight;
        window.scrollTo({ top: tour.offsetTop + alto * (k + 0.5) / tourFotos.length, behavior: 'smooth' });
      });
    });
  }

  var topo = $('.topo'), zap = $('.zap'), cartas = $$('.carta'), portas = $('.portas'), portaT = $('.porta-terreno');
  var ultimoY = window.scrollY, pedido = false;
  var progresso = function (el, H) { var r = el.getBoundingClientRect(); return limita(-r.top / Math.max(1, r.height - H)); };

  function quadro() {
    pedido = false;
    var H = window.innerHeight, y = window.scrollY, r;

    var fimHeroi = heroi ? heroi.offsetHeight - 90 : 0;
    if (topo && !doc.classList.contains('menu-aberto')) {
      topo.classList.toggle('solido', y > fimHeroi);
      if (y > fimHeroi + H * 0.3 && y > ultimoY + 4) topo.classList.add('escondido');
      else if (y < ultimoY - 4 || y <= fimHeroi) topo.classList.remove('escondido');
    }
    if (zap) zap.classList.toggle('visivel', y > H * 0.9);
    ultimoY = y;
    if (calmo) return;

    if (heroi) heroi.style.setProperty('--sai', limita(y / heroi.offsetHeight).toFixed(3));

    if (manifesto && acesas.length) {
      r = manifesto.getBoundingClientRect();
      var pm = limita((H * 0.85 - r.top) / (H * 0.45 + r.height * 0.6));
      var n = Math.round(pm * acesas.length * 1.04);
      acesas.forEach(function (s, i) { s.classList.toggle('acesa', i < n); });
    }

    cartas.forEach(function (c, i) {
      r = c.getBoundingClientRect();
      c.style.setProperty('--entra-c', limita((H - r.top) / (H * 0.9)).toFixed(3));
      var prox = cartas[i + 1];
      if (prox) {
        var dist = prox.getBoundingClientRect().top - r.top;
        c.style.setProperty('--empurra', limita(1 - (dist - 20) / (H * 0.8)).toFixed(3));
      }
    });

    if (tour) {
      var pt = progresso(tour, H);
      tour.style.setProperty('--tour-p', pt.toFixed(3));
      mostraTour(Math.min(tourFotos.length - 1, Math.floor(pt * tourFotos.length)));
    }
    if (portas) portas.style.setProperty('--abre', suave(limita(progresso(portas, H) / 0.75)).toFixed(4));
    if (portaT) {
      var a = suave(limita(progresso(portaT, H) / 0.7));
      portaT.style.setProperty('--abre', a.toFixed(4));
      portaT.classList.toggle('aberta', a > 0.85);
    }
  }
  function pede() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
  function arruma() { quadro(); }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(arruma.t); arruma.t = setTimeout(arruma, 120); });
  window.addEventListener('load', arruma);
  arruma();

  /* ---------- menu do celular ---------- */
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

  /* ---------- cursor com o arco ---------- */
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
      cursor.classList.toggle('grande', !!e.target.closest('a, button, .tour-moldura, .carta'));
      if (!rodando) { rodando = true; requestAnimationFrame(anda); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('ligado'); });
  }
})();
