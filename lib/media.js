const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

async function downloadImageToBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxContentLength: 20 * 1024 * 1024,
    });
    return {
      buffer: Buffer.from(res.data),
      mime: res.headers['content-type'],
    };
  } catch {
    return null;
  }
}

function toWppMessageMedia(buffer, mime, filename = 'image') {
  const base64 = buffer.toString('base64');
  return new MessageMedia(mime, base64, filename);
}

module.exports = { downloadImageToBuffer, toWppMessageMedia };
