import { chromium } from 'playwright';

(async () => {
  // Use persistent context with your user data directory
  const browser = await chromium.launchPersistentContext('./user-data-dir', { headless: false });
  const page = await browser.newPage();

  // Go to your target page (replace with your URL)
  await page.goto('https://tms48.nepsetms.com.np/tms/me/memberclientorderentry', { waitUntil: 'networkidle' });

  // Wait for you to manually trigger the toast (e.g., submit a form)
  console.log('Please manually trigger the toast in the browser...');
  // Wait up to 30 seconds for the toast to appear
  try {
    const toast = await page.waitForSelector('span[class*="toast-title"]', { timeout: 30000 });
    const toastText = await toast.textContent();
    const toastClass = await toast.getAttribute('class');
    console.log('Toast text:', toastText);
    console.log('Toast class:', toastClass);
  } catch {
    console.log('Toast not found within 30 seconds.');
  }

  await browser.close();
})();