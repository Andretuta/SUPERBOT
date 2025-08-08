const fs = require('fs');
const { LOG_FILE } = require('../config/paths');

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function logNS(namespace, ...msg) {
  const line = `[${new Date().toISOString()}] [${namespace}] ${msg.join(' ')}\n`;
  logStream.write(line);
  console.log(`[${namespace}]`, ...msg);
}

module.exports = { logNS };
