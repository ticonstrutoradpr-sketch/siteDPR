/* Vitrine das obras: a secao fica presa na tela e cada tela de rolagem troca o empreendimento.
   O fundo muda de cor, curvas de nivel tom sobre tom desenham o relevo de cada empreendimento atras do cartao, a fita 3D com as fotos
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
  var pilares = calmo ? null : document.querySelector('.entra-lado');
  var trilho = document.querySelector('.lat-trilho'), barraPil = document.querySelector('.lat-progresso span');
  /* altura da secao lateral = uma tela + o quanto o trilho precisa andar */
  function medeLateral() { var sl = document.querySelector('.lateral'); if (sl && trilho) sl.style.height = (window.innerHeight + Math.max(0, trilho.scrollWidth - window.innerWidth)) + 'px'; }
  medeLateral();
  window.addEventListener('resize', medeLateral);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medeLateral);
  if (calmo) { var pl = document.querySelector('.entra-lado'); if (pl) pl.classList.remove('entra-lado'); }
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

  /* fundo: curvas de nivel de um terreno, tom sobre tom. Cada empreendimento tem o seu relevo; na rolagem um relevo
     se transforma no outro e as linhas respiram devagar. A cada quatro linhas uma fica mais marcada, como nos mapas. */
  var curvas = document.createElement('canvas'); curvas.className = 'vit-curvas'; curvas.setAttribute('aria-hidden', 'true');
  anel.appendChild(curvas);
  var gc = curvas.getContext('2d'), CW = 0, CH = 0, PASSO = 18, NIVEIS = [];
  for (var nv = -2.1; nv <= 2.11; nv += .3) NIVEIS.push(nv);
  function medeCurvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    CW = fixo.clientWidth; CH = fixo.clientHeight;
    curvas.width = Math.round(CW * dpr); curvas.height = Math.round(CH * dpr);
    gc.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function relevo(x, y, t, sd) {
    var u = x / 300, w = y / 300;
    return Math.sin(u * 1.25 + sd * 1.7 + t * .16) * Math.cos(w * 1.05 - sd + t * .11)
      + .65 * Math.sin((u + w) * 1.7 + sd * 2.3 - t * .09)
      + .5 * Math.cos(Math.hypot(u - 2.4 - Math.sin(sd) * .8, w - 1.5 - Math.cos(sd) * .5) * 2.2 - t * .2)
      + .25 * Math.sin(u * 3.1 - w * 2.4 + sd * 4.1);
  }
  var grade = null, ultimo = 0;
  function desenhaCurvas(agora) {
    if (!CW) medeCurvas();
    var t = calmo ? 0 : (agora - t0) / 1000, s = estado.s, a = Math.floor(s), b = Math.min(N - 1, a + 1), m = suave(s - a);
    var sa = a * 1.9 + .7, sb = b * 1.9 + .7, ox = estado.mx * 18, oy = estado.my * 12;
    var cols = Math.ceil(CW / PASSO) + 1, rows = Math.ceil(CH / PASSO) + 1;
    if (!grade || grade.length !== cols * rows) grade = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var x = c * PASSO + ox, y = r * PASSO + oy;
      grade[r * cols + c] = relevo(x, y, t, sa) * (1 - m) + relevo(x, y, t, sb) * m;
    }
    gc.clearRect(0, 0, CW, CH);
    gc.strokeStyle = getComputedStyle(fixo).getPropertyValue('--vit-anel-cor').trim() || '#D3BC9C';
    NIVEIS.forEach(function (nivel, k) {
      gc.beginPath();
      for (var r = 0; r < rows - 1; r++) for (var c = 0; c < cols - 1; c++) {
        var i = r * cols + c, v0 = grade[i], v1 = grade[i + 1], v2 = grade[i + cols + 1], v3 = grade[i + cols];
        var caso = (v0 > nivel ? 1 : 0) | (v1 > nivel ? 2 : 0) | (v2 > nivel ? 4 : 0) | (v3 > nivel ? 8 : 0);
        if (caso === 0 || caso === 15) continue;
        var x0 = c * PASSO, y0 = r * PASSO, p = [];
        if ((caso & 1) !== ((caso & 2) >> 1)) p.push(x0 + PASSO * (nivel - v0) / (v1 - v0), y0);
        if (((caso & 2) >> 1) !== ((caso & 4) >> 2)) p.push(x0 + PASSO, y0 + PASSO * (nivel - v1) / (v2 - v1));
        if (((caso & 4) >> 2) !== ((caso & 8) >> 3)) p.push(x0 + PASSO * (nivel - v3) / (v2 - v3), y0 + PASSO);
        if (((caso & 8) >> 3) !== (caso & 1)) p.push(x0, y0 + PASSO * (nivel - v0) / (v3 - v0));
        if (p.length >= 4) { gc.moveTo(p[0], p[1]); gc.lineTo(p[2], p[3]); }
        if (p.length === 8) { gc.moveTo(p[4], p[5]); gc.lineTo(p[6], p[7]); }
      }
      var forte = k % 3 === 0;
      gc.globalAlpha = forte ? .9 : .5; gc.lineWidth = forte ? 1.4 : .8;
      gc.stroke();
    });
    gc.globalAlpha = 1;
  }
  function montaAnel() {}

  /* nome em duas linhas equilibradas */
  function quebraNome(nome) {
    var p = nome.split(' '), melhor = [nome], pior = 1e9;
    for (var k = 1; k < p.length; k++) { var a = p.slice(0, k).join(' '), b = p.slice(k).join(' '), m = Math.max(a.length, b.length); if (m < pior) { pior = m; melhor = [a, b]; } }
    return melhor;
  }
  estado.quebraNome = quebraNome;

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
      if (cartao) {
        var partes = it.info.split(' · ');
        cartao.querySelector('.vc-num').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
        cartao.querySelector('.vc-nome').innerHTML = quebraNome(it.nome).join('<br>');
        cartao.querySelector('.vc-local').textContent = partes.length > 1 ? partes[1] : '';
        cartao.querySelector('.vc-status').textContent = [partes[0]].concat(partes.slice(2)).join(' · ');
      }
      if (conta) conta.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      [].forEach.call(lista.querySelectorAll('button'), function (b, j) { b.classList.toggle('atual', j === i); });
      nomeTxt.parentNode.classList.remove('troca'); void nomeTxt.offsetWidth; nomeTxt.parentNode.classList.add('troca');
    };
    if (primeiro || calmo) troca();
    else setTimeout(troca, 120);
  }

  /* rolagem: cada item ocupa uma tela; o movimento "assenta" em cada cartao */
  var pedido = false, t0 = performance.now();
  function quadro() {
    pedido = false;
    /* a ultima tela da secao e da entrada dos pilares: a troca de empreendimentos usa as outras */
    var H = window.innerHeight, total = sec.offsetHeight - 2 * H;
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
    /* pilares: na ultima tela presa, deslizam da direita para a esquerda e ficam parados no alto ate cobrir tudo */
    if (pilares) {
      var p = limita((window.scrollY - (sec.offsetTop + total)) / H, 0, 1);
      /* como uma pagina deslizando: a vitrine sai pela esquerda e a secao entra pela direita. A secao nao sai do lugar
         (no celular isso alargaria a pagina): um recorte avanca da direita e o conteudo anda junto, colado na borda */
      var e = suave(p), dentro = pilares.firstElementChild;
      fixo.style.transform = p <= 0 ? '' : 'translate3d(' + (-e * 100).toFixed(2) + '%, 0, 0)';
      if (p >= 1) { pilares.style.transform = ''; pilares.style.clipPath = ''; dentro.style.transform = ''; }
      else {
        pilares.style.transform = 'translate3d(0, ' + (-(1 - p) * H).toFixed(1) + 'px, 0)';
        pilares.style.clipPath = 'inset(0 0 0 ' + ((1 - e) * 100).toFixed(2) + '%)';
        dentro.style.transform = 'translate3d(' + ((1 - e) * 100).toFixed(2) + '%, 0, 0)';
      }
      /* depois de assentar, a rolagem para baixo vira rolagem para o lado no trilho */
      var corre = Math.max(0, trilho.scrollWidth - window.innerWidth);
      var q = limita((window.scrollY - pilares.offsetTop) / Math.max(1, pilares.offsetHeight - H), 0, 1);
      trilho.style.transform = 'translate3d(' + (-q * corre).toFixed(1) + 'px, 0, 0)';
      if (barraPil) barraPil.style.transform = 'scaleX(' + q.toFixed(4) + ')';
    }
  }
  /* curvas a ~14 quadros por segundo (o movimento e lento), so com a secao na tela */
  function gira(agora) {
    if ((estado.visivel || !ultimo) && agora - ultimo > 70) { ultimo = agora; desenhaCurvas(agora); }
    requestAnimationFrame(gira);
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }, { passive: true });
  window.addEventListener('resize', function () { medeCurvas(); var i = atual; atual = -1; mostra(i < 0 ? 0 : i); quadro(); });
  fixo.addEventListener('mousemove', function (e) { estado.mx = (e.clientX / window.innerWidth) * 2 - 1; estado.my = (e.clientY / window.innerHeight) * 2 - 1; });
  quadro(); mostra(Math.round(estado.s));
  requestAnimationFrame(gira);

  /* lista: o botao de pontos abre os nomes; clicar leva ate o empreendimento */
  function abreLista(sim) { lista.hidden = !sim; listaBt.setAttribute('aria-expanded', sim ? 'true' : 'false'); }
  listaBt.addEventListener('click', function () { abreLista(lista.hidden); });
  [].forEach.call(lista.querySelectorAll('button'), function (b, j) {
    b.addEventListener('click', function () {
      abreLista(false);
      var H = window.innerHeight, total = sec.offsetHeight - 2 * H;
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
