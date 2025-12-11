import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import readline from 'readline';
import fs from 'fs';

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

// After ensuring you are on the target page
// Wait for the toggle to be visible
await page.waitForSelector('label.xtoggler-btn-wrapper', { timeout: 5000 });

// Get all toggle elements
const toggles = await page.$$('label.xtoggler-btn-wrapper');

// Click the third toggle (index 2)
if (toggles.length >= 3) {
  const box = await toggles[2].boundingBox();
  await page.mouse.click(
    box.x + box.width / 2,
    box.y + box.height / 2
  );
} else {
  console.log('Less than 3 toggles found.');
}

// Read symbols from JSON
const symbols = JSON.parse(fs.readFileSync('d:/Self/Playwright/symbols.json', 'utf-8'));

// Use the first symbol and qty
const { symbol: symbolToEnter, qty } = symbols[0];

// Fill symbol (name)
await page.waitForSelector('input[formcontrolname="symbol"]', { timeout: 5000 });
await page.fill('input[formcontrolname="symbol"]', symbolToEnter);

// Wait for the dropdown option matching the symbol to appear and click it
const dropdownSelector = `.dropdown-item span strong:text-is("${symbolToEnter}")`;
await page.waitForSelector(dropdownSelector, { timeout: 5000 });
await page.click(dropdownSelector);

// Fill quantity
await page.waitForSelector('input[formcontrolname="quantity"]', { timeout: 5000 });
await page.fill('input[formcontrolname="quantity"]', qty.toString());

// Get the Pre Close price robustly
const preCloseLabel = page.locator('label.order__form--label', { hasText: 'Pre Close' }).first();
if (await preCloseLabel.isVisible()) {
  // Get the parent div
  const preCloseDiv = preCloseLabel.locator('..');
  // Get the <b> element inside the same div
  const priceElement = preCloseDiv.locator('b').first();
  const preClosePriceText = await priceElement.textContent();
  const preClosePrice = parseFloat(preClosePriceText.trim());
  const pricePlus10Percent = (preClosePrice * 1.1).toFixed(2);

  console.log('Pre Close Price:', preClosePrice);
  console.log('Price + 10%:', pricePlus10Percent);

  // Fill the price input with only the integer part
  const priceOneDecimal = pricePlus10Percent.includes('.')
    ? pricePlus10Percent.split('.')[0] + '.' + pricePlus10Percent.split('.')[1][0]
    : pricePlus10Percent;
  await page.fill('input[formcontrolname="price"]', priceOneDecimal);

  console.log('Pressing Enter repeatedly until trade is executed...', priceOneDecimal);
  let tradeExecuted = false;
  let i=0;
  while (!tradeExecuted) {
    await page.keyboard.press('Enter');
    i++;
    console.log(i);
    try {
      await page.waitForSelector('.trade-success-message, .order-confirmation', { timeout: 500 });
      tradeExecuted = true;
      console.log('Trade executed!');
    } catch {
      // Not found yet, keep pressing
    }
  }
} else {
  console.log('Pre Close label not found.');
}

await page.waitForTimeout(5000);
console.log('Redirected to:', page.url());
await browser.close();
console.log('Screenshot saved as example.png');