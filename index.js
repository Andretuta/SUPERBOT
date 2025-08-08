require('dotenv').config();
const express = require('express');
const { wpp, getWppGroups } = require('./services/whatsapp');
const { initTelegram, getTelegramChats } = require('./services/telegram');
const apiRoutes = require('./routes/api');
const { logNS } = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicia o Telegram
const telegramBot = initTelegram(process.env.TELEGRAM_TOKEN);

// Compartilha os bots entre os módulos via app.locals
app.locals.telegramBot = telegramBot;
app.locals.wpp = wpp;

// Middlewares
app.use(express.json());
app.use('/api', apiRoutes);

// Inicia o servidor Express
app.listen(PORT, () => {
  logNS('SERVER', `🚀 Servidor rodando na porta ${PORT}`);
});

// Inicia o bot do WhatsApp
wpp.initialize();
