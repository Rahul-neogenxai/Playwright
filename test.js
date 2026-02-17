import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launchPersistentContext('./user-data-dir', {
    headless: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  let lastSessionId = null;
  // Listen for all outgoing requests
  page.on('request', request => {
    const headers = request.headers();
    if (headers['host-session-id'] && headers['host-session-id'] !== lastSessionId) {
      lastSessionId = headers['host-session-id'];
      console.log('New host-session-id:', lastSessionId);
    }
  });

  await page.goto('https://tms48.nepsetms.com.np/');

  // Try to extract host-session-id from all loaded scripts
  const hostSessionId = await page.evaluate(async () => {
    const scripts = Array.from(document.scripts).filter(s => s.src);
    console.log('Loaded script URLs:', scripts.map(s => s.src)); // For debugging

    for (const script of scripts) {
      try {
        const res = await fetch(script.src);
        const text = await res.text();
        // Try multiple patterns
        let match = text.match(/host-session-id["']?\s*[:=]\s*["']([^"']+)["']/);
        if (!match) {
          match = text.match(/host-session-id.*?([A-Za-z0-9\-=]{20,})/);
        }
        if (match) return match[1];
      } catch (e) {
        // Ignore fetch errors
      }
    }
    return null;
  });

  console.log('host-session-id:', hostSessionId);

  await browser.close();
})();