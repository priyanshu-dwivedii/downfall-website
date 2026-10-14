const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1080 });

    // 1. Authenticate via API and set session cookie
    console.log('Authenticating via /api/admin/auth/login...');
    const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Pratyaksh',
        password: '5sJ54iyUckeeSpTxpED6hbmCAiSq8dJG',
      }),
    });

    const setCookieHeader = loginRes.headers.get('set-cookie');
    console.log(`Set-Cookie header: ${setCookieHeader}`);
    if (setCookieHeader) {
      const match = setCookieHeader.match(/([^=]+)=([^;]+)/);
      if (match) {
        await page.setCookie({
          name: match[1].trim(),
          value: match[2].trim(),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        });
      }
    }

    console.log('Navigating to preview page...');
    await page.goto('http://localhost:3000/products/beige-wide-leg-joggers?preview=true', { waitUntil: 'networkidle2' });

    // Wait for product details to render
    await page.waitForSelector('h1', { timeout: 10000 });

    const screenshotPath = 'C:\\Users\\a\\.gemini\\antigravity-ide\\brain\\b747cecf-51cc-48bb-9f0a-cae9c9496b77\\beige_joggers_preview.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot successfully saved to: ${screenshotPath}`);

    // Verify DOM elements on the live rendered page
    const title = await page.$eval('h1', (el) => el.innerText);
    console.log(`Page Title: ${title}`);

    const priceText = await page.evaluate(() => {
      const el = document.querySelector('p[class*="productPrice"]');
      return el ? el.innerText : '';
    });
    console.log(`Price text: ${priceText}`);

    const buttonText = await page.evaluate(() => {
      const btn = document.querySelector('button[class*="addToCartButton"]');
      return btn ? btn.innerText : '';
    });
    console.log(`CTA Button: ${buttonText}`);

    const thumbs = await page.$$eval('div[class*="thumbnailList"] button', (els) => els.length);
    console.log(`Thumbnails count: ${thumbs}`);

    const desc = await page.evaluate(() => {
      const el = document.querySelector('p[class*="productDescription"]');
      return el ? el.innerText : '';
    });
    console.log(`Description preview:\n${desc}`);

  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Puppeteer capture failed:', err);
  process.exit(1);
});
