const express = require('express');
const { sendToAll } = require('../services/broadcast');
const { getWppGroups } = require('../services/whatsapp');
const { getTelegramChats } = require('../services/telegram');
const { downloadImageToBuffer, toWppMessageMedia } = require('../lib/media');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    whatsappGroups: getWppGroups().length,
    telegramChats: getTelegramChats().length,
    uptimeSec: Math.floor(process.uptime()),
  });
});

router.post('/send-to-all', async (req, res) => {
  try {
    const { message, imageUrl } = req.body || {};
    if (!message && !imageUrl) {
      return res.status(400).json({ success: false, error: 'Mensagem ou imageUrl obrigatória.' });
    }

    let wppMedia = null;
    let tgBuffer = null;
    let tgMime = null;

    if (imageUrl) {
      const downloaded = await downloadImageToBuffer(imageUrl);
      if (!downloaded) {
        return res.status(400).json({ success: false, error: 'Falha ao baixar imagem.' });
      }
      tgBuffer = downloaded.buffer;
      tgMime = downloaded.mime;
      wppMedia = toWppMessageMedia(downloaded.buffer, downloaded.mime);
    }

    const wpp = req.app.locals.wpp || null;
    const telegramBot = req.app.locals.telegramBot || null;
    const wppGroups = getWppGroups();
    const tgChats = getTelegramChats();

    const result = await sendToAll({
      text: message || '📣 Nova mensagem!',
      wppMedia,
      tgBuffer,
      tgMime,
      telegramBot,
      wppGroups,
      tgChats,
      wpp
    });

    return res.json(result);
  } catch (err) {
    console.error('Erro em /send-to-all:', err);
    return res.status(500).json({ success: false, error: 'Erro interno no envio.' });
  }
});

module.exports = router;
