import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import readline from 'readline';
import fs from 'fs';
import { placeOrderViaApi } from './component/order/orderComponent.js';

dotenv.config();

(async () => {
  const browser = await chromium.launchPersistentContext('./user-data-dir', {
    headless: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  let latestHostSessionId = null;
  page.on('request', request => {
    const headers = request.headers();
    if (headers['host-session-id'] && headers['host-session-id'] !== latestHostSessionId) {
      latestHostSessionId = headers['host-session-id'];
      console.log('New host-session-id:', latestHostSessionId);
    }
  });

  try {
    const targetUrl = process.env.TARGETURL;
    const loginUrl = process.env.LOGINURL;

    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    const redirectedUrl = page.url();
    console.log('Redirected to:', redirectedUrl);

    if (redirectedUrl.startsWith(loginUrl)) {
      console.log('You need to login first');
      await page.screenshot({ path: 'login_page.png' });
      console.log('Login page screenshot saved as login_page.png');

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

      const username = process.env.USER;
      const password = process.env.PASSWORD;

      await page.waitForSelector('input[placeholder="Client Code/ User Name"]', { timeout: 5000 });
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });

      await page.fill('input[placeholder="Client Code/ User Name"]', '');
      console.log('username form env:', username);
      await page.fill('input[placeholder="Client Code/ User Name"]', username);
      await page.fill('input[type="password"]', password);

      await page.fill('#captchaEnter', captchaValue);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('input[type="submit"][value="Login"]')
      ]);

      if (page.url() !== targetUrl) {
        console.log('Navigating to target URl after login....');
        await page.goto(targetUrl, { waitUntil: 'networkidle' });
      }
    }

    // Wait for requests to capture host-session-id
    await page.waitForTimeout(2000);

    await page.waitForSelector('label.xtoggler-btn-wrapper', { timeout: 5000 });
    const toggles = await page.$$('label.xtoggler-btn-wrapper');
    if (toggles.length >= 3) {
      const box = await toggles[2].boundingBox();
      await page.mouse.click(
        box.x + box.width / 2,
        box.y + box.height / 2
      );
    } else {
      console.log('Less than 3 toggles found.');
    }

    const symbols = JSON.parse(fs.readFileSync('./symbols.json', 'utf-8'));
    const { symbol: symbolToEnter, qty, securityId, clientId, clientMemberCode, notsUniqueClientCode } = symbols[0];

    await page.waitForSelector('input[formcontrolname="symbol"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="symbol"]', symbolToEnter);

    const dropdownSelector = `.dropdown-item span strong:text-is("${symbolToEnter}")`;
    await page.waitForSelector(dropdownSelector, { timeout: 5000 });
    await page.click(dropdownSelector);

    await page.waitForSelector('input[formcontrolname="quantity"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="quantity"]', qty.toString());

    const preCloseLabel = page.locator('label.order__form--label', { hasText: 'Pre Close' }).first();
    if (await preCloseLabel.isVisible()) {
      const preCloseDiv = preCloseLabel.locator('..');
      const priceElement = preCloseDiv.locator('b').first();
      const preClosePriceText = await priceElement.textContent();
      const preClosePrice = parseFloat(preClosePriceText.trim().replace(/,/g, ''));
      const pricePlus10Percent = (preClosePrice * 1.1).toFixed(2);

      console.log('Pre Close Price:', preClosePrice);
      console.log('Price + 10%:', pricePlus10Percent);

      const priceOneDecimal = pricePlus10Percent.includes('.')
        ? pricePlus10Percent.split('.')[0] + '.' + pricePlus10Percent.split('.')[1][0]
        : pricePlus10Percent;
      await page.fill('input[formcontrolname="price"]', priceOneDecimal);
      console.log('buying started.........................................');

      let apiResult;
      let attempt = 0;

      while (true) {
        try {
          // Check if page is closed
          if (page.isClosed()) {
            console.error('Page is closed. Exiting loop.');
            break;
          }

          attempt++;
          apiResult = await placeOrderViaApi(page, {
            symbolToEnter,
            qty,
            priceOneDecimal,
            securityId,
            clientId,
            clientMemberCode,
            notsUniqueClientCode,
            hostSessionId: latestHostSessionId
          });

          console.log(`Attempt ${attempt}:`, apiResult);

          if (apiResult.status === 200) {
            console.log('Trade successful!');
            break;
          }

          // Always wait 500ms between attempts
          await page.waitForTimeout(500);

          // If network/server error, wait longer
          if (apiResult.error && (
            apiResult.error.includes('502 Bad Gateway') ||
            apiResult.error.includes('socket hang up')
          )) {
            console.warn('Network/server error. Waiting 2 seconds before retry...');
            await page.waitForTimeout(500);
          }
        } catch (err) {
          console.error('Error in loop:', err);
          await page.waitForTimeout(2000);
          // Optionally, break if too many consecutive errors
        }
      }

      if (apiResult.status !== 200) {
        console.error('Trade not successful after max attempts.');
      }
    } else {
      console.log('Pre Close label not found.');
    }

    await page.waitForTimeout(5000);
    console.log('Redirected to:', page.url());
    await browser.close();
    console.log('Browser closed.');
  } catch (err) {
    console.error('Error during order placement:', err);
    await browser.close();
  }
})();