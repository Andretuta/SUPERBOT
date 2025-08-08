const { logNS } = require('../lib/logger');
const { sendWithThrottle, delay } = require('../lib/throttle');
const { withRetry } = require('../lib/utils');

async function sendToAll({ text, wppMedia = null, tgBuffer = null, tgMime = null, telegramBot = null, wppGroups = [], tgChats = [], wpp = null }) {
  const start = Date.now();
  let wppSuccess = 0;
  let tgSuccess = 0;

  if (wpp) {
    await sendWithThrottle(wppGroups, async id => {
      await withRetry(() => {
        return wppMedia
          ? wpp.sendMessage(id, wppMedia, { caption: text || undefined })
          : wpp.sendMessage(id, text || '📣 Nova mensagem!');
      }, { tries: 3, baseMs: 800 });
      logNS('WPP', '✅ Enviado:', id);
      wppSuccess++;
    }, { concurrency: 1, gapMs: 500 });
  } else if (wppGroups.length > 0) {
    logNS('WPP', '❌ Objeto wpp não fornecido, não foi possível enviar para grupos WhatsApp.');
  }

  if (telegramBot) {
    await sendWithThrottle(tgChats, async id => {
      await withRetry(() => {
        return tgBuffer
          ? telegramBot.sendPhoto(id, tgBuffer, { caption: text || undefined })
          : telegramBot.sendMessage(id, text || '📣 Nova mensagem!');
      }, { tries: 4, baseMs: 500 });
      logNS('TG', '✅ Enviado:', id);
      tgSuccess++;
    }, { concurrency: 8, gapMs: 80 });
  }

  const ms = Date.now() - start;
  logNS('BCAST', `Resumo: WPP=${wppSuccess}/${wppGroups.length} | TG=${tgSuccess}/${tgChats.length} | tempo=${ms}ms`);

  return {
    success: true,
    summary: {
      whatsapp: { total: wppGroups.length, sent: wppSuccess },
      telegram: { total: tgChats.length, sent: tgSuccess },
      durationMs: ms,
    },
  };
}

module.exports = { sendToAll };
