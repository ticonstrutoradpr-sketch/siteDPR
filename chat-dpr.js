/* ===========================================================================
   ASSISTENTE DPR -- o chat do site da DPR Construtora.

   Um balao fixo no canto inferior direito, em todas as paginas, abre uma
   janela de chat que conduz a pessoa por dez perguntas sobre a compra do
   primeiro imovel pelo Minha Casa, Minha Vida. A cada resposta (botoes),
   o assistente explica aquele ponto com o texto da DPR, palavra por
   palavra, e passa para a proxima. No fim, oferece continuar com um
   consultor no WhatsApp, ja com o resumo das respostas na mensagem.

   E um ROTEIRO, nao uma IA que inventa: nenhuma regra da Caixa e criada
   aqui. Os textos das dez respostas sao os que a DPR mandou em 06/10/2026
   e so ela muda (estao em ROTEIRO, abaixo). Sem chave de API, sem custo,
   sem servidor: um arquivo, incluido por <script src="chat-dpr.js" defer>
   antes do </body> de cada pagina.

   O que o arquivo faz, na ordem: injeta o CSS, monta o HTML, liga os
   botoes, conduz o roteiro. Com prefers-reduced-motion nao ha "digitando"
   nem espera entre as mensagens.
   =========================================================================== */
(function () {
  'use strict';
  if (document.getElementById('dprChat')) return;

  var WHATSAPP = '5511933085258';
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ESPERA = calmo ? 0 : 700;   // o tempo do "digitando" antes de cada fala do assistente

  /* ---- o roteiro: a pergunta, as opcoes de resposta e o texto da DPR ----
     "resumo" e como a resposta aparece na mensagem do WhatsApp. */
  var ROTEIRO = [
    {
      pergunta: 'Este será seu primeiro imóvel?',
      resumo: 'Primeiro imóvel',
      opcoes: ['Sim', 'Não'],
      resposta: [
        'Se sim, você está no lugar certo! Vamos ajudar você a entender melhor como funciona a compra do seu imóvel, desde o primeiro passo até o financiamento.',
        'Aqui na DPR Construtora, gostamos de explicar tudo de forma clara e simples, para que você saiba exatamente como funciona cada etapa.'
      ]
    },
    {
      pergunta: 'Você já sabe como funciona a compra de um imóvel na planta?',
      resumo: 'Sabe como funciona a compra na planta',
      opcoes: ['Sim', 'Não', 'Mais ou menos'],
      resposta: [
        'Comprar um imóvel na planta significa comprar a sua casa antes de ela estar pronta. A obra ainda está em construção e você acompanha o processo até a entrega.',
        'Nos empreendimentos do Minha Casa, Minha Vida, o financiamento é feito pela Caixa Econômica Federal, seguindo as regras do programa e as condições do banco.'
      ]
    },
    {
      pergunta: 'Você sabe como funciona o financiamento pela Caixa durante o período de obras?',
      resumo: 'Sabe como funciona o financiamento na obra',
      opcoes: ['Sim', 'Não', 'Mais ou menos'],
      resposta: [
        'O financiamento com a Caixa é realizado enquanto a obra ainda está em evolução. Durante esse período, existem algumas cobranças relacionadas ao financiamento, conforme o contrato.',
        'As parcelas do financiamento do imóvel começam depois da conclusão da obra e das etapas necessárias para a entrega, conforme as condições do contrato.'
      ]
    },
    {
      pergunta: 'Você sabe quais valores podem aparecer durante o processo de financiamento?',
      resumo: 'Sabe os valores do processo (ITBI e registro)',
      opcoes: ['Sim', 'Não', 'Mais ou menos'],
      resposta: [
        'Existem alguns custos que fazem parte do processo de financiamento e que são obrigatórios, como o ITBI e o registro do contrato no cartório.',
        'O ITBI é um imposto pago pelo comprador, e o registro é necessário para deixar o imóvel oficialmente registrado no cartório.',
        'Esses valores são pagos quando o contrato de financiamento é emitido pela Caixa e antes da assinatura.'
      ]
    },
    {
      pergunta: 'Você sabe o que é a comissão do corretor?',
      resumo: 'Sabe o que é a comissão do corretor',
      opcoes: ['Sim', 'Não', 'Mais ou menos'],
      resposta: [
        'O corretor é o profissional que ajuda você durante a compra do imóvel, desde o atendimento até a negociação.',
        'Quando existe comissão de corretagem, esse valor é referente ao trabalho do corretor pela venda e pelo atendimento realizado.',
        'Ou seja, a comissão do corretor não é a entrada do imóvel e não faz parte do valor que você está pagando pela casa à construtora.'
      ]
    },
    {
      pergunta: 'Você já fez alguma simulação de financiamento pela Caixa?',
      resumo: 'Já fez simulação na Caixa',
      opcoes: ['Sim', 'Ainda não'],
      resposta: [
        'A simulação é muito importante para você ter uma ideia de quanto poderá financiar, qual seria o valor aproximado das parcelas e como ficaria o seu financiamento.',
        'Mas é importante saber que a simulação é apenas uma estimativa. Os valores e as condições finais só serão confirmados quando a Caixa analisar sua documentação e aprovar o financiamento.'
      ],
      link: { texto: 'Abrir o simulador da Caixa', href: 'https://simuladorhabitacao.caixa.gov.br/home' }
    },
    {
      pergunta: 'Você pretende financiar sozinho ou vai compor renda com outra pessoa?',
      resumo: 'Vai financiar',
      opcoes: ['Sozinho', 'Com outra pessoa', 'Ainda não sei'],
      resposta: [
        'Se você precisar juntar sua renda com a de outra pessoa, é possível fazer a composição de renda, desde que esteja de acordo com as regras do banco para aprovação do crédito.',
        'Essa outra pessoa também passará pela análise da Caixa e precisará ser aprovada para participar do financiamento.'
      ]
    },
    {
      pergunta: 'Você possui algum financiamento imobiliário ou imóvel registrado em seu nome?',
      resumo: 'Tem financiamento ou imóvel no nome',
      opcoes: ['Sim', 'Não'],
      resposta: [
        'Essa informação é importante porque ter outro imóvel ou financiamento pode mudar as condições ou até mesmo o seu enquadramento para um novo financiamento.',
        'Por isso, precisamos saber dessa informação antes de avançar, para verificarmos, de acordo com as regras da Caixa, o que pode ser feito no seu caso.'
      ]
    },
    {
      pergunta: 'Você possui algum saldo de FGTS que pretende utilizar na compra?',
      resumo: 'Tem FGTS para usar',
      opcoes: ['Sim', 'Não', 'Não sei'],
      resposta: [
        'Se você tem dinheiro disponível no FGTS, pode ser possível utilizar esse valor para ajudar na compra do imóvel ou reduzir o valor que precisa financiar.',
        'Mas é importante que você esteja dentro das regras da Caixa para utilização do FGTS. Na análise do financiamento, será verificada essa possibilidade.'
      ]
    },
    {
      pergunta: 'Você possui alguma restrição no seu CPF?',
      resumo: 'Tem restrição no CPF',
      opcoes: ['Sim', 'Não', 'Não sei'],
      resposta: [
        'Se você possui alguma restrição no CPF, é importante resolver essa situação antes de ser convocado para o financiamento.',
        'A Caixa faz uma análise de crédito antes de aprovar o financiamento. Por isso, ter o CPF regularizado ajuda no processo e evita problemas durante a análise.'
      ]
    }
  ];

  var ABERTURA = [
    'Oi! Eu sou o assistente da DPR Construtora.',
    'Vou te fazer dez perguntas rápidas e, a cada uma, explicar como funciona a compra do seu imóvel pelo Minha Casa, Minha Vida: da planta ao financiamento pela Caixa. Pode ser?'
  ];
  var FECHO = [
    'Pronto: essas são as dez coisas que todo mundo precisa saber antes de financiar.',
    'Quer continuar com um consultor da DPR? Ele recebe as suas respostas e fala com você pelo WhatsApp.'
  ];

  /* ---- o CSS, injetado uma vez ---- */
  var css = '' +
    '.dprchat{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:9000;font-family:"Archivo","Helvetica Neue",Arial,sans-serif;color:#f4f4f4;--dpr-vermelho:#ff0000;--dpr-preto:#0b0b0e;--dpr-tinta:#15161a;--dpr-cinza:#a0a0a0;--dpr-linha:rgba(255,255,255,0.14)}' +
    '.dprchat *{box-sizing:border-box}' +
    '.dprchat-abrir{display:flex;align-items:center;gap:12px;padding:0;background:none;border:0;cursor:pointer;color:#f4f4f4;font:inherit}' +
    '.dprchat-abrir-rotulo{padding:12px 16px;background:var(--dpr-tinta);border:1px solid var(--dpr-linha);font-family:"Syncopate","Archivo",sans-serif;font-weight:700;font-size:0.56rem;letter-spacing:2px;text-transform:uppercase;line-height:1.5;clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%);box-shadow:0 10px 30px rgba(0,0,0,0.45);transition:opacity .3s,transform .3s}' +
    '.dprchat.aberto .dprchat-abrir-rotulo,.dprchat.ja-abriu .dprchat-abrir-rotulo{opacity:0;transform:translateX(10px);pointer-events:none}' +
    '.dprchat-abrir-bola{position:relative;display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:var(--dpr-vermelho);box-shadow:0 10px 30px rgba(255,0,0,0.35);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}' +
    '.dprchat-abrir:hover .dprchat-abrir-bola,.dprchat-abrir:focus-visible .dprchat-abrir-bola{transform:translateY(-2px) scale(1.04);box-shadow:0 14px 36px rgba(255,0,0,0.5)}' +
    '.dprchat-abrir:focus-visible{outline:none}.dprchat-abrir:focus-visible .dprchat-abrir-bola{outline:2px solid #fff;outline-offset:3px}' +
    '.dprchat-abrir-bola svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.dprchat-abrir-bola .fecha{display:none}.dprchat.aberto .dprchat-abrir-bola .abre{display:none}.dprchat.aberto .dprchat-abrir-bola .fecha{display:block}' +
    '.dprchat-ponto{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--dpr-vermelho)}.dprchat.ja-abriu .dprchat-ponto{display:none}' +
    '.dprchat-janela{position:absolute;right:0;bottom:76px;width:min(380px,calc(100vw - 32px));height:min(640px,calc(100vh - 110px));display:flex;flex-direction:column;background:var(--dpr-preto);border:1px solid var(--dpr-linha);box-shadow:0 30px 80px rgba(0,0,0,0.6);clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%);transform-origin:bottom right;transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1)}' +
    '.dprchat-janela[hidden]{display:none}' +
    '.dprchat-janela.entrando{opacity:0;transform:translateY(12px) scale(.98)}' +
    '.dprchat-cabeca{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid var(--dpr-linha);background:#050505}' +
    '.dprchat-cabeca::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--dpr-vermelho)}' +
    '.dprchat-avatar{display:grid;place-items:center;width:40px;height:40px;flex:none;background:var(--dpr-vermelho);font-family:"Syncopate","Archivo",sans-serif;font-weight:800;font-size:0.6rem;letter-spacing:1px;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)}' +
    '.dprchat-titulo{flex:1;min-width:0}' +
    '.dprchat-titulo b{display:block;font-family:"Syncopate","Archivo",sans-serif;font-weight:700;font-size:0.62rem;letter-spacing:3px;text-transform:uppercase}' +
    '.dprchat-titulo span{display:block;margin-top:4px;font-size:0.78rem;color:var(--dpr-cinza)}' +
    '.dprchat-fechar{width:44px;height:44px;flex:none;display:grid;place-items:center;background:none;border:0;color:#f4f4f4;cursor:pointer;border-radius:50%}' +
    '.dprchat-fechar:hover,.dprchat-fechar:focus-visible{background:rgba(255,255,255,0.08);outline:none}' +
    '.dprchat-fechar svg{width:20px;height:20px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round}' +
    '.dprchat-mensagens{flex:1;overflow-y:auto;padding:18px 16px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;overscroll-behavior:contain}' +
    '.dprchat-msg{max-width:88%;padding:12px 14px;font-size:0.92rem;line-height:1.55;animation:dprchat-surgir .35s cubic-bezier(.22,1,.36,1)}' +
    '.dprchat-msg p{margin:0}.dprchat-msg p+p{margin-top:10px}' +
    '.dprchat-msg--bot{align-self:flex-start;background:var(--dpr-tinta);border:1px solid var(--dpr-linha);clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}' +
    '.dprchat-msg--pergunta{font-weight:600;color:#fff}' +
    '.dprchat-msg--eu{align-self:flex-end;background:var(--dpr-vermelho);color:#fff;font-weight:600;clip-path:polygon(0 0,100% 0,100% 100%,10px 100%,0 calc(100% - 10px))}' +
    '.dprchat-msg a{color:#fff;text-decoration:underline;text-underline-offset:3px}' +
    '.dprchat-msg .dprchat-link{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:10px 14px;border:1px solid rgba(255,255,255,0.3);text-decoration:none;font-family:"Syncopate","Archivo",sans-serif;font-weight:700;font-size:0.52rem;letter-spacing:2px;text-transform:uppercase;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)}' +
    '.dprchat-msg .dprchat-link:hover{border-color:var(--dpr-vermelho);color:var(--dpr-vermelho)}' +
    '.dprchat-digitando{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:var(--dpr-tinta);border:1px solid var(--dpr-linha)}' +
    '.dprchat-digitando i{width:7px;height:7px;border-radius:50%;background:var(--dpr-cinza);animation:dprchat-pulsar 1s ease-in-out infinite}.dprchat-digitando i:nth-child(2){animation-delay:.15s}.dprchat-digitando i:nth-child(3){animation-delay:.3s}' +
    '.dprchat-rodape{padding:10px 16px 14px;border-top:1px solid var(--dpr-linha);background:#050505}' +
    '.dprchat-passo{display:block;margin-bottom:10px;font-family:"Syncopate","Archivo",sans-serif;font-weight:700;font-size:0.5rem;letter-spacing:2px;text-transform:uppercase;color:var(--dpr-cinza)}' +
    '.dprchat-passo:empty{display:none}' +
    '.dprchat-opcoes{display:flex;flex-wrap:wrap;gap:8px}' +
    '.dprchat-opcao{min-height:44px;padding:12px 18px;background:none;border:1px solid rgba(255,255,255,0.3);color:#f4f4f4;font-family:"Syncopate","Archivo",sans-serif;font-weight:700;font-size:0.56rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;clip-path:polygon(0 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%);transition:background .25s,border-color .25s,color .25s}' +
    '.dprchat-opcao:hover,.dprchat-opcao:focus-visible{background:var(--dpr-vermelho);border-color:var(--dpr-vermelho);color:#fff;outline:none}' +
    '.dprchat-opcao--cheia{background:var(--dpr-vermelho);border-color:var(--dpr-vermelho)}' +
    '.dprchat-opcao--cheia:hover,.dprchat-opcao--cheia:focus-visible{background:#c40000;border-color:#c40000}' +
    '.dprchat-humano{display:block;margin-top:10px;font-size:0.74rem;color:var(--dpr-cinza);text-align:center}.dprchat-humano a{color:#f4f4f4}' +
    '@keyframes dprchat-surgir{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '@keyframes dprchat-pulsar{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}' +
    '@media (max-width:600px){.dprchat-abrir-rotulo{display:none}.dprchat-janela{position:fixed;inset:0;width:auto;height:auto;bottom:0;clip-path:none;border:0;padding-bottom:env(safe-area-inset-bottom)}.dprchat.aberto .dprchat-abrir{display:none}.dprchat-msg{max-width:92%}}' +
    '@media (prefers-reduced-motion:reduce){.dprchat-msg,.dprchat-digitando i,.dprchat-janela{animation:none!important;transition:none!important}.dprchat-mensagens{scroll-behavior:auto}}';
  var estilo = document.createElement('style');
  estilo.id = 'dprChatEstilo';
  estilo.textContent = css;
  document.head.appendChild(estilo);

  /* ---- o HTML ---- */
  var raiz = document.createElement('div');
  raiz.className = 'dprchat';
  raiz.id = 'dprChat';
  raiz.innerHTML =
    '<section class="dprchat-janela entrando" id="dprChatJanela" role="dialog" aria-label="Assistente virtual da DPR Construtora" hidden>' +
      '<header class="dprchat-cabeca" style="position:relative">' +
        '<span class="dprchat-avatar" aria-hidden="true">DPR</span>' +
        '<div class="dprchat-titulo"><b>Assistente DPR</b><span>Tira-dúvidas do financiamento</span></div>' +
        '<button type="button" class="dprchat-fechar" id="dprChatFechar" aria-label="Fechar o chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</header>' +
      '<div class="dprchat-mensagens" id="dprChatMensagens" aria-live="polite"></div>' +
      '<div class="dprchat-rodape">' +
        '<span class="dprchat-passo" id="dprChatPasso"></span>' +
        '<div class="dprchat-opcoes" id="dprChatOpcoes"></div>' +
        '<span class="dprchat-humano">Prefere falar com uma pessoa? <a href="https://wa.me/' + WHATSAPP + '" target="_blank" rel="noopener">Chame no WhatsApp</a></span>' +
      '</div>' +
    '</section>' +
    '<button type="button" class="dprchat-abrir" id="dprChatAbrir" aria-expanded="false" aria-controls="dprChatJanela">' +
      '<span class="dprchat-abrir-rotulo">Dúvidas sobre<br>o financiamento?</span>' +
      '<span class="dprchat-abrir-bola" aria-hidden="true">' +
        '<svg class="abre" viewBox="0 0 24 24"><path d="M21 12c0 4.1-4 7.5-9 7.5-1.1 0-2.2-.2-3.2-.5L4 20.5l1.3-3.6C4.1 15.5 3 13.8 3 12c0-4.1 4-7.5 9-7.5s9 3.4 9 7.5z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>' +
        '<svg class="fecha" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '<span class="dprchat-ponto"></span>' +
      '</span>' +
      '<span class="dprchat-sr" style="position:absolute;left:-9999px">Abrir o assistente de dúvidas sobre o financiamento</span>' +
    '</button>';
  document.body.appendChild(raiz);

  var janela = document.getElementById('dprChatJanela');
  var abrir = document.getElementById('dprChatAbrir');
  var fechar = document.getElementById('dprChatFechar');
  var mensagens = document.getElementById('dprChatMensagens');
  var opcoes = document.getElementById('dprChatOpcoes');
  var passo = document.getElementById('dprChatPasso');

  /* ---- as falas ---- */
  function falar(paragrafos, classe, extra) {
    var el = document.createElement('div');
    el.className = 'dprchat-msg dprchat-msg--bot' + (classe ? ' ' + classe : '');
    paragrafos.forEach(function (t) { var p = document.createElement('p'); p.textContent = t; el.appendChild(p); });
    if (extra) el.appendChild(extra);
    mensagens.appendChild(el);
    rolar();
    return el;
  }
  function eu(texto) {
    var el = document.createElement('div');
    el.className = 'dprchat-msg dprchat-msg--eu';
    el.textContent = texto;
    mensagens.appendChild(el);
    rolar();
  }
  function rolar() { mensagens.scrollTop = mensagens.scrollHeight; }
  function digitando(fn) {
    if (!ESPERA) { fn(); return; }
    var d = document.createElement('div');
    d.className = 'dprchat-digitando';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<i></i><i></i><i></i>';
    mensagens.appendChild(d);
    rolar();
    window.setTimeout(function () { d.remove(); fn(); }, ESPERA);
  }
  function botoes(lista) {
    opcoes.innerHTML = '';
    lista.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dprchat-opcao' + (o.cheia ? ' dprchat-opcao--cheia' : '');
      b.textContent = o.texto;
      if (o.href) { var a = document.createElement('a'); a.className = b.className; a.href = o.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = o.texto; a.style.display = 'inline-flex'; a.style.alignItems = 'center'; a.style.textDecoration = 'none'; a.addEventListener('click', o.acao || function () {}); opcoes.appendChild(a); return; }
      b.addEventListener('click', o.acao);
      opcoes.appendChild(b);
    });
    var primeiro = opcoes.querySelector('button, a');
    if (primeiro && janela.contains(document.activeElement)) primeiro.focus();
  }

  /* ---- o roteiro ---- */
  var respostas = [];
  var indice = -1;
  var comecou = false;

  function comecar() {
    mensagens.innerHTML = '';
    respostas = [];
    indice = -1;
    passo.textContent = '';
    opcoes.innerHTML = '';
    digitando(function () {
      falar(ABERTURA);
      botoes([{ texto: 'Vamos lá', cheia: true, acao: function () { eu('Vamos lá'); proxima(); } }]);
    });
  }
  function proxima() {
    indice += 1;
    opcoes.innerHTML = '';
    if (indice >= ROTEIRO.length) { fechoFinal(); return; }
    var q = ROTEIRO[indice];
    passo.textContent = 'Pergunta ' + (indice + 1) + ' de ' + ROTEIRO.length;
    digitando(function () {
      falar([q.pergunta], 'dprchat-msg--pergunta');
      botoes(q.opcoes.map(function (op) { return { texto: op, acao: function () { responder(op); } }; }));
    });
  }
  function responder(op) {
    var q = ROTEIRO[indice];
    respostas.push({ resumo: q.resumo, valor: op });
    eu(op);
    opcoes.innerHTML = '';
    digitando(function () {
      var extra = null;
      if (q.link) {
        extra = document.createElement('a');
        extra.className = 'dprchat-link';
        extra.href = q.link.href;
        extra.target = '_blank';
        extra.rel = 'noopener';
        extra.textContent = q.link.texto;
      }
      falar(q.resposta, '', extra);
      var ultima = indice === ROTEIRO.length - 1;
      botoes([{ texto: ultima ? 'Terminar' : 'Próxima pergunta', cheia: true, acao: function () { proxima(); } }]);
    });
  }
  function textoWhats() {
    var linhas = ['Olá! Passei pelo assistente do site da DPR e quero falar com um consultor.', '', 'Minhas respostas:'];
    respostas.forEach(function (r, k) { linhas.push((k + 1) + ') ' + r.resumo + ': ' + r.valor); });
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(linhas.join('\n'));
  }
  function fechoFinal() {
    passo.textContent = 'Fim das perguntas';
    digitando(function () {
      falar(FECHO);
      botoes([
        { texto: 'Falar no WhatsApp', cheia: true, href: textoWhats() },
        { texto: 'Recomeçar', acao: function () { comecar(); } }
      ]);
    });
  }

  /* ---- abrir e fechar ---- */
  function abrirChat() {
    raiz.classList.add('aberto', 'ja-abriu');
    abrir.setAttribute('aria-expanded', 'true');
    janela.hidden = false;
    void janela.offsetWidth;
    janela.classList.remove('entrando');
    fechar.focus();
    if (!comecou) { comecou = true; comecar(); }
  }
  function fecharChat() {
    raiz.classList.remove('aberto');
    abrir.setAttribute('aria-expanded', 'false');
    janela.classList.add('entrando');
    janela.hidden = true;
    abrir.focus();
  }
  abrir.addEventListener('click', function () { if (janela.hidden) abrirChat(); else fecharChat(); });
  fechar.addEventListener('click', fecharChat);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !janela.hidden) fecharChat(); });

  /* para quem precisar (testes, outras paginas): abre o chat por fora */
  window.DPR_CHAT = { abrir: abrirChat, fechar: fecharChat, roteiro: ROTEIRO, whatsapp: WHATSAPP };
})();
