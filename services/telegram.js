const TelegramBot = require('node-telegram-bot-api');
const { logNS } = require('../lib/logger');
const { readJsonSafe, writeJsonSafe } = require('../lib/utils');
const { TELEGRAM_CHATS_DB } = require('../config/paths');

const tgChats = new Set(readJsonSafe(TELEGRAM_CHATS_DB));
function persistChats() {
  writeJsonSafe(TELEGRAM_CHATS_DB, Array.from(tgChats));
}

let telegramBot = null;

function initTelegram(token) {
  if (!token) {
    logNS('TG', '⚠️ TELEGRAM_TOKEN não configurado.');
    return null;
  }

  telegramBot = new TelegramBot(token, { polling: true });
  logNS('TG', '✅ Telegram bot iniciado');

  telegramBot.on('my_chat_member', data => {
    const chat = data.chat;
    const status = data.new_chat_member?.status;
    if (['member', 'administrator'].includes(status)) {
      tgChats.add(chat.id);
      persistChats();
      logNS('TG', '🟢 Adicionado a chat:', chat.id);
    }
    if (['left', 'kicked'].includes(status)) {
      tgChats.delete(chat.id);
      persistChats();
      logNS('TG', '🔴 Removido de chat:', chat.id);
    }
  });

  telegramBot.on('message', msg => {
    if (!tgChats.has(msg.chat.id)) {
      tgChats.add(msg.chat.id);
      persistChats();
      telegramBot.sendMessage(msg.chat.id, '✅ Chat registrado com sucesso!');
    }
  });

  telegramBot.on('polling_error', e => {
    logNS('TG', 'polling_error:', e.code || e.message);
  });

  return telegramBot;
}

function getTelegramChats() {
  return Array.from(tgChats);
}

module.exports = { initTelegram, getTelegramChats };
