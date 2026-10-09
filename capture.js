const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  
  await page.goto('http://localhost:3000');
  
  // Wait for load
  await page.waitForTimeout(1000);
  
  const element = await page.locator('#brand-story');
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  
  await element.screenshot({ path: 'C:\\Users\\a\\.gemini\\antigravity-ide\\brain\\ac18a124-edb8-46d1-890e-487626103839\\scratch\\brand_story_desktop.png' });
  
  await browser.close();
})();
