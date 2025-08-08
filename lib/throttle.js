const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendWithThrottle(items, worker, { concurrency = 1, gapMs = 300 }) {
  const queue = [...items];
  const running = new Set();

  async function run() {
    while (queue.length) {
      while (running.size < concurrency && queue.length) {
        const item = queue.shift();
        const p = (async () => {
          try {
            await worker(item);
          } finally {
            await delay(gapMs);
            running.delete(p);
          }
        })();
        running.add(p);
      }
      await Promise.race(running);
    }
    await Promise.all(running);
  }

  return run();
}

module.exports = { sendWithThrottle, delay };
