/* Vitrine das obras: a secao fica presa na tela e cada tela de rolagem troca o empreendimento.
   O fundo muda de cor, o nome gira num cilindro de letras gigantes atras do cartao, a fita 3D com as fotos
   (assets/vitrine3d.js) se torce entre um cartao e o outro, e a barra de baixo mostra o nome, a lista e a seta
   que abre as fotos (a mesma galeria do resto do site, pelo atributo data-galeria). */
(function () {
  var sec = document.querySelector('.vitrine');
  if (!sec) return;
  var fixo = sec.querySelector('.vit-fixo'), anel = sec.querySelector('.vit-anel'), giro = sec.querySelector('.vit-anel-giro');
  var nomeTxt = sec.querySelector('.vit-nome-txt'), info = sec.querySelector('.vit-info'), ver = sec.querySelector('.vit-ver');
  var marca = sec.querySelector('.vit-progresso span'), conta = sec.querySelector('.vit-conta');
  var listaBt = sec.querySelector('.vit-lista-bt'), lista = sec.querySelector('.vit-lista'), cartao = sec.querySelector('.vit-cartao');
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var itens = [].map.call(sec.querySelectorAll('.vit-dados li'), function (li) {
    return { nome: li.getAttribute('data-nome'), info: li.getAttribute('data-info'), galeria: li.getAttribute('data-galeria'), foto: li.getAttribute('data-foto'),
      fundo: li.getAttribute('data-fundo'), anel: li.getAttribute('data-anel'), tinta: li.getAttribute('data-tinta') };
  });
  var N = itens.length;
  if (!N) return;
  var estado = { s: 0, mx: 0, my: 0, visivel: false, itens: itens };

  var limita = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var suave = function (v) { v = limita(v, 0, 1); return v * v * (3 - 2 * v); };
  var rgb = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var mistura = function (a, b, t) { var x = rgb(a), y = rgb(b); return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')'; };

  /* letreiro em cilindro: cada letra vai numa posicao do anel; o nome se repete ate fechar a volta */
  var medidor = document.createElement('canvas').getContext('2d');
  var raio = 0;
  function montaAnel(nome) {
    var cs = getComputedStyle(anel), tam = parseFloat(cs.fontSize);
    medidor.font = cs.fontWeight + ' ' + tam + 'px ' + cs.fontFamily;
    var alvo = window.innerWidth < 900 ? window.innerWidth * .75 : Math.max(window.innerWidth * 1.05, 620);
    var txt = nome.toUpperCase() + '  ', larg = function (c) { return medidor.measureText(c).width + tam * .02; };
    var umaVez = txt.split('').reduce(function (s, c) { return s + larg(c); }, 0);
    /* o nome se repete um numero inteiro de vezes e o raio se ajusta para fechar a volta exata: sem vao e sem letra encavalada */
    var rep = Math.max(2, Math.round(2 * Math.PI * alvo / umaVez));
    raio = rep * umaVez / (2 * Math.PI);
    var folga = 0, letras = [], fimRep = [];
    for (var r = 0; r < rep; r++) { letras = letras.concat(txt.split('')); fimRep.push(letras.length - 1); }
    var ws = letras.map(larg), acc = 0, html = '';
    letras.forEach(function (c, i) {
      var a = (acc + ws[i] / 2) / raio; acc += ws[i] + (fimRep.indexOf(i) >= 0 ? folga : 0);
      html += '<span style="transform:rotateY(' + a.toFixed(4) + 'rad) translateZ(' + raio.toFixed(1) + 'px) translate(-50%,-50%)">' + (c === ' ' ? '&nbsp;' : c) + '</span>';
    });
    giro.innerHTML = html;
  }

  var atual = -1;
  function mostra(i) {
    if (i === atual) return;
    var primeiro = atual < 0; atual = i;
    var it = itens[i];
    var troca = function () {
      montaAnel(it.nome);
      nomeTxt.textContent = it.nome; info.textContent = it.info;
      ver.setAttribute('data-galeria', it.galeria);
      ver.setAttribute('aria-label', 'Ver fotos do ' + it.nome);
      if (cartao) { cartao.src = it.foto; cartao.alt = it.nome; }
      if (conta) conta.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      [].forEach.call(lista.querySelectorAll('button'), function (b, j) { b.classList.toggle('atual', j === i); });
      anel.classList.remove('some');
      nomeTxt.parentNode.classList.remove('troca'); void nomeTxt.offsetWidth; nomeTxt.parentNode.classList.add('troca');
    };
    if (primeiro || calmo) troca();
    else { anel.classList.add('some'); setTimeout(troca, 220); }
  }

  /* rolagem: cada item ocupa uma tela; o movimento "assenta" em cada cartao */
  var pedido = false, t0 = performance.now();
  function quadro() {
    pedido = false;
    var H = window.innerHeight, total = sec.offsetHeight - H;
    var bruto = limita((window.scrollY - sec.offsetTop) / Math.max(1, total), 0, 1) * (N - 1);
    var i0 = Math.floor(bruto), f = bruto - i0;
    if (i0 >= N - 1) { i0 = N - 1; f = 0; }
    var s = i0 + suave((f - .22) / .56);
    estado.s = s;
    var a = Math.floor(s), b = Math.min(N - 1, a + 1), t = s - a;
    fixo.style.setProperty('--vit-fundo', mistura(itens[a].fundo, itens[b].fundo, t));
    fixo.style.setProperty('--vit-anel-cor', t < .5 ? itens[a].anel : itens[b].anel);
    fixo.style.setProperty('--vit-tinta', t < .5 ? itens[a].tinta : itens[b].tinta);
    if (marca) marca.style.transform = 'translateY(' + (s / Math.max(1, N - 1) * 100 * 7).toFixed(1) + '%)';
    mostra(Math.round(s));
    /* com a vitrine ocupando a tela, o cartao flutuante e o botao do WhatsApp saem do caminho da barra */
    var rr = sec.getBoundingClientRect();
    document.body.classList.toggle('na-vitrine', rr.top <= 4 && rr.bottom >= H - 4);
  }
  function gira(agora) {
    if (estado.visivel && !calmo) giro.style.transform = 'rotateX(-6deg) rotateZ(-2.5deg) translateZ(' + (-raio).toFixed(1) + 'px) rotateY(' + (-(estado.s * 70 + (agora - t0) / 1000 * 5)).toFixed(2) + 'deg)';
    requestAnimationFrame(gira);
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', function () { var i = atual; atual = -1; mostra(i < 0 ? 0 : i); quadro(); });
  fixo.addEventListener('mousemove', function (e) { estado.mx = (e.clientX / window.innerWidth) * 2 - 1; estado.my = (e.clientY / window.innerHeight) * 2 - 1; });
  quadro(); mostra(Math.round(estado.s));
  giro.style.transform = 'rotateX(-6deg) rotateZ(-2.5deg) translateZ(' + (-raio).toFixed(1) + 'px)';
  /* a medida das letras so vale com a fonte carregada: remonta o anel quando ela chega */
  if (document.fonts && document.fonts.load) document.fonts.load('600 100px Poppins').then(function () { var i = atual; atual = -1; mostra(i < 0 ? 0 : i); }).catch(function () {});
  requestAnimationFrame(gira);

  /* lista: o botao de pontos abre os nomes; clicar leva ate o empreendimento */
  function abreLista(sim) { lista.hidden = !sim; listaBt.setAttribute('aria-expanded', sim ? 'true' : 'false'); }
  listaBt.addEventListener('click', function () { abreLista(lista.hidden); });
  [].forEach.call(lista.querySelectorAll('button'), function (b, j) {
    b.addEventListener('click', function () {
      abreLista(false);
      var H = window.innerHeight, total = sec.offsetHeight - H;
      window.scrollTo({ top: sec.offsetTop + total * j / Math.max(1, N - 1) + 2, behavior: calmo ? 'auto' : 'smooth' });
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lista.hidden) { abreLista(false); listaBt.focus(); } });
  document.addEventListener('click', function (e) { if (!lista.hidden && !lista.contains(e.target) && !listaBt.contains(e.target)) abreLista(false); });

  /* fita 3D: carrega quando a secao chega perto; o cartao parado fica de reserva */
  var carregou = false;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      estado.visivel = e.isIntersecting;
      if (e.isIntersecting && !carregou && !calmo) {
        carregou = true;
        import('/assets/vitrine3d.js').then(function (m) { m.inicia(fixo, estado); }).catch(function () {});
      }
    });
  }, { rootMargin: '60% 0px' }).observe(sec);
})();
