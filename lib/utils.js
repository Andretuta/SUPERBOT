const fs = require('fs');
const { ADMINS_FILE } = require('../config/paths');

function readJsonSafe(file, defaultValue = []) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeJsonSafe(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

function getAdmins() {
  try {
    const data = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
    return Array.isArray(data.admins) ? data.admins : [];
  } catch {
    return [];
  }
}


/**
 * Executa uma função assíncrona com tentativas e atraso exponencial.
 * @param {Function} fn Função assíncrona a ser executada
 * @param {Object} options
 * @param {number} options.tries Número de tentativas
 * @param {number} options.baseMs Tempo base de espera em ms
 */
async function withRetry(fn, { tries = 3, baseMs = 500 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) {
        await new Promise(res => setTimeout(res, baseMs * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}

module.exports = { readJsonSafe, writeJsonSafe, getAdmins, withRetry };
