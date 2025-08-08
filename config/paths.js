const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const LOGS_DIR = path.join(ROOT, 'logs');

module.exports = {
  ROOT,
  DATA_DIR,
  LOGS_DIR,
  LOG_FILE: path.join(LOGS_DIR, 'bot.log'),
  WHATSAPP_GROUPS_DB: path.join(DATA_DIR, 'groups.json'),
  TELEGRAM_CHATS_DB: path.join(DATA_DIR, 'telegram_chats.json'),
  ADMINS_FILE: path.join(DATA_DIR, 'bot_admins.json'),
};
