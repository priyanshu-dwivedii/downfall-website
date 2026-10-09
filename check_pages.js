const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const urls = [
    'http://localhost:3000/collections/all',
    'http://localhost:3000/collections/basics',
    'http://localhost:3000/collections/formal',
    'http://localhost:3000/collections/luxury'
  ];
  
  for (const url of urls) {
    console.log(`Checking ${url}...`);
    await page.goto(url);
    await page.waitForTimeout(500);
    
    const menuBtn = page.locator('button[aria-label*="navigation menu"]');
    if (await menuBtn.count() === 0) {
      console.error(`Menu button not found on ${url}`);
      process.exit(1);
    }
    
    // Click menu
    await menuBtn.click();
    await page.waitForTimeout(500);
    const menuPanel = page.locator('ul');
    if (await menuPanel.count() === 0) {
      console.error(`Menu panel did not open on ${url}`);
      process.exit(1);
    }
    
    const cartBtn = page.locator('a[aria-label*="View Cart"]');
    if (await cartBtn.count() === 0) {
      console.error(`Cart button not found on ${url}`);
      process.exit(1);
    }
    console.log(`✓ ${url} verified`);
  }
  
  await browser.close();
})();
