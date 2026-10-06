/* ===========================================================================
   /api/lead -- recebe do assistente do site (chat-dpr.js) o WhatsApp da
   pessoa e as dez respostas, e avisa a DPR na hora. Nao guarda nada: so
   confere e repassa. Roda como funcao na Vercel (pasta api/, sem build).

   PARA ONDE AVISA: variaveis de ambiente do projeto na Vercel (Settings >
   Environment Variables). Nenhuma chave fica neste arquivo.

     LEAD_WHATSAPP_DESTINO   numero que recebe o aviso, com 55 e DDD.
                             Se faltar, usa 5511959943705 (pedido dela, 06/10/2026).
     CALLMEBOT_APIKEY        chave do CallMeBot DO NUMERO DE DESTINO. Com ela, o
                             aviso chega como mensagem de WhatsApp, sozinho.
                             Como obter: o numero de destino manda, pelo WhatsApp,
                             a frase "I allow callmebot to send me messages" para
                             +34 644 51 95 23 e recebe a chave na resposta.
     LEAD_WEBHOOK_URL        um webhook (n8n, Make, Zapier, Sheets...) que recebe o
                             lead em JSON e faz o que quiser com ele.
     LEAD_WEBHOOK_SEGREDO    opcional: vai no cabecalho x-lead-segredo do webhook,
                             para o n8n (Header Auth) so aceitar o que vem daqui.

   Pode configurar um canal ou os dois. Sem nenhum, responde { ok: false } e o
   chat cai no caminho manual (abre o WhatsApp para a pessoa enviar).

   O QUE RECEBE (POST, JSON): { telefone, respostas: [{ resumo, valor }],
   pagina, duracaoSegundos }. Telefone so e aceito no formato brasileiro
   (55 + DDD + 8 ou 9 digitos); conversa com menos de 8 segundos e recusada,
   porque pessoa nenhuma responde dez perguntas nesse tempo.
   =========================================================================== */
'use strict';

const DESTINO_PADRAO = '5511959943705';
const TEMPO_LIMITE = 8000;

function somenteDigitos(s) { return String(s || '').replace(/\D/g, ''); }
function formatar(tel) {
  const d = tel.slice(2);
  return d.length === 11
    ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7)
    : '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
}
function agoraEmBrasilia() {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
}
function montarMensagem(lead) {
  const linhas = [
    'Novo contato pelo assistente do site da DPR',
    'WhatsApp: ' + lead.telefoneFormatado + ' (' + lead.whatsapp + ')',
    '',
    'Respostas:'
  ];
  lead.respostas.forEach((r, k) => linhas.push((k + 1) + ') ' + r.resumo + ': ' + r.valor));
  linhas.push('');
  if (lead.pagina) linhas.push('Pagina: ' + lead.pagina);
  linhas.push('Enviado em ' + lead.enviadoEm + ' (Brasilia)');
  return linhas.join('\n');
}
function sinalDeTempo() {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TEMPO_LIMITE) : undefined;
}

/* o CallMeBot manda a mensagem para o WhatsApp do destino; responde um HTML
   com "Message queued" quando aceita */
async function porCallMeBot(destino, mensagem, apikey) {
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + destino + '&apikey=' + encodeURIComponent(apikey) + '&text=' + encodeURIComponent(mensagem);
  const r = await fetch(url, { signal: sinalDeTempo() });
  const corpo = (await r.text()).slice(0, 300);
  const ok = r.ok && /queued|sent/i.test(corpo);
  return { canal: 'callmebot', ok, status: r.status, detalhe: ok ? undefined : corpo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) };
}

/* o webhook recebe o lead inteiro em JSON */
async function porWebhook(url, segredo, lead) {
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (segredo) cabecalhos['x-lead-segredo'] = segredo;
  const r = await fetch(url, { method: 'POST', headers: cabecalhos, body: JSON.stringify(lead), signal: sinalDeTempo() });
  return { canal: 'webhook', ok: r.ok, status: r.status };
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, motivo: 'metodo' });
  }

  let corpo = req.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch (e) { corpo = null; } }
  if (!corpo || typeof corpo !== 'object') return res.status(400).json({ ok: false, motivo: 'corpo' });

  const telefone = somenteDigitos(corpo.telefone);
  if (!/^55[1-9][1-9](9\d{8}|\d{8})$/.test(telefone)) return res.status(400).json({ ok: false, motivo: 'telefone' });

  const respostas = Array.isArray(corpo.respostas)
    ? corpo.respostas.slice(0, 12)
        .map((r) => ({ resumo: String((r && r.resumo) || '').slice(0, 80), valor: String((r && r.valor) || '').slice(0, 40) }))
        .filter((r) => r.resumo && r.valor)
    : [];
  if (!respostas.length) return res.status(400).json({ ok: false, motivo: 'respostas' });

  const duracao = Number(corpo.duracaoSegundos);
  if (Number.isFinite(duracao) && duracao < 8) return res.status(429).json({ ok: false, motivo: 'rapido' });

  const lead = {
    origem: 'site-dpr',
    telefone,
    telefoneFormatado: formatar(telefone),
    whatsapp: 'https://wa.me/' + telefone,
    respostas,
    pagina: String(corpo.pagina || '').slice(0, 300),
    enviadoEm: agoraEmBrasilia()
  };
  lead.mensagem = montarMensagem(lead);

  const destino = somenteDigitos(process.env.LEAD_WHATSAPP_DESTINO) || DESTINO_PADRAO;
  const envios = [];
  if (process.env.CALLMEBOT_APIKEY) envios.push(porCallMeBot(destino, lead.mensagem, process.env.CALLMEBOT_APIKEY));
  if (process.env.LEAD_WEBHOOK_URL) envios.push(porWebhook(process.env.LEAD_WEBHOOK_URL, process.env.LEAD_WEBHOOK_SEGREDO, lead));
  if (!envios.length) return res.status(200).json({ ok: false, motivo: 'sem destino configurado' });

  const resultados = await Promise.allSettled(envios);
  const feitos = [];
  const falhas = [];
  resultados.forEach((r) => {
    if (r.status === 'fulfilled' && r.value && r.value.ok) feitos.push(r.value.canal);
    else falhas.push(r.status === 'fulfilled' ? r.value : { canal: '?', erro: String((r.reason && r.reason.message) || r.reason).slice(0, 160) });
  });
  if (falhas.length) console.error('lead: falha no envio', JSON.stringify(falhas));
  return res.status(200).json({ ok: feitos.length > 0, enviados: feitos });
};

/* para os testes */
module.exports.montarMensagem = montarMensagem;
module.exports.formatar = formatar;
