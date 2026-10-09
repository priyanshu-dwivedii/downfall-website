const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });
  
  // Wait for localhost:3000 to respond
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Save to the artifacts scratch directory
  const path = 'C:/Users/a/.gemini/antigravity-ide/brain/c5c44f52-ba77-4f84-b88f-9dd9141677af/scratch/hero_screenshot.png';
  await page.screenshot({ path: path, fullPage: false });
  console.log('Saved screenshot to', path);
  
  await browser.close();
}

run().catch(console.error);
