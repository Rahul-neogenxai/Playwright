import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const browser = await chromium.launchPersistentContext('d:/Self/Playwright/user-data-dir',{ 
  headless: false,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
});
const page = await browser.newPage();

const targetUrl = 'https://tms49.nepsetms.com.np/tms/me/memberclientorderentry';
const loginUrl = 'https://tms49.nepsetms.com.np/login';

await page.goto(targetUrl, { waitUntil: 'networkidle' });

const redirectedUrl = page.url();
console.log('Redirected to:', redirectedUrl);

if (redirectedUrl.startsWith(loginUrl)) {
  console.log('You need to login first');

  // Take screenshot of the login page (including captcha)
  await page.screenshot({ path: 'login_page.png' });
  console.log('Login page screenshot saved as login_page.png');

  // Ask user to view screenshot and enter captcha
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askCaptcha = () => {
    return new Promise(resolve => {
      rl.question('Please view login_page.png and enter the captcha: ', answer => {
        rl.close();
        resolve(answer);
      });
    });
  };

  const captchaValue = await askCaptcha();

  // Fill username and password from .env
  const username = process.env.USER;
  const password = process.env.PASSWORD;

  // Wait for username and password fields
  await page.waitForSelector('input[placeholder="Client Code/ User Name"]', { timeout: 5000 });
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });

  await page.fill('input[placeholder="Client Code/ User Name"]', '');
  console.log('username form env:', username);
  await page.fill('input[placeholder="Client Code/ User Name"]', username);
  await page.fill('input[type="password"]', password);

  // Fill captcha and submit
  await page.fill('#captchaEnter', captchaValue); 
  // await page.click('input[type="submit"][value="Login"]');
  // Click login and wait for navigation at the same time
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('input[type="submit"][value="Login"]')
  ]);

  // if not on targetUrl, navigate there
  if (page.url() !== targetUrl){
    console.log('Navigating to target URl after login....');
    await page.goto(targetUrl, {waitUntil: 'networkidle'});
  }
}

await page.screenshot({ path: 'example.png' });
await page.waitForTimeout(5000);
console.log('Redirected to:', page.url());
await browser.close();
console.log('Screenshot saved as example.png');