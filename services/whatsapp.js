const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { logNS } = require('../lib/logger');
const { readJsonSafe, writeJsonSafe, getAdmins } = require('../lib/utils');
const { WHATSAPP_GROUPS_DB } = require('../config/paths');
const { sendToAll } = require('./broadcast');
const { downloadImageToBuffer, toWppMessageMedia } = require('../lib/media');

const wppGroups = new Set(readJsonSafe(WHATSAPP_GROUPS_DB));
function persistGroups() {
  writeJsonSafe(WHATSAPP_GROUPS_DB, Array.from(wppGroups));
}

const wpp = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

wpp.on('qr', qr => {
  logNS('WPP', 'QR gerado. Escaneie para autenticar.');
  qrcode.generate(qr, { small: true });
});

wpp.on('ready', async () => {
  logNS('WPP', '✅ WhatsApp pronto!');
  const chats = await wpp.getChats();
  const groups = chats.filter(c => c.isGroup).map(c => c.id._serialized);
  groups.forEach(id => wppGroups.add(id));
  persistGroups();
  logNS('WPP', `Grupos sincronizados: ${wppGroups.size}`);
});

wpp.on('group_join', notif => {
  if (!wppGroups.has(notif.chatId)) {
    wppGroups.add(notif.chatId);
    persistGroups();
    logNS('WPP', '🟢 Entrou em grupo:', notif.chatId);
  }
});

wpp.on('group_leave', notif => {
  if (wppGroups.delete(notif.chatId)) {
    persistGroups();
    logNS('WPP', '🔴 Saiu de grupo:', notif.chatId);
  }
});

wpp.on('message', async msg => {
  const sender = msg.from.replace('@c.us', '');
  const admins = getAdmins();
  if (!admins.includes(sender)) {
    logNS('SEC', '⛔ Comando não autorizado de:', sender);
    return;
  }

  const body = msg.body.trim();
  if (body.toLowerCase() === 'status') {
    await msg.reply(`📊 *Status do Bot:*\nWhatsApp: ${wppGroups.size}`);
    return;
  }

  let text = body;
  let media = null;

  if (msg.hasMedia) {
    const m = await msg.downloadMedia();
    media = new MessageMedia(m.mimetype, m.data, m.filename || 'media');
  } else if (/https?:\/\/\S+\.(jpg|jpeg|png|gif)/i.test(body)) {
    const { buffer, mime } = await downloadImageToBuffer(body);
    media = toWppMessageMedia(buffer, mime);
    text = '';
  }

  if (wppGroups.size === 0) {
    await msg.reply('❌ Nenhum grupo registrado.');
    return;
  }

  await sendToAll({
    text: text || '📣 Nova mensagem!',
    wppMedia: media,
    wpp,
    wppGroups: Array.from(wppGroups)
  });
  await msg.reply('✅ Enviado para todos!');
});

function getWppGroups() {
  return Array.from(wppGroups);
}

module.exports = { wpp, getWppGroups };
