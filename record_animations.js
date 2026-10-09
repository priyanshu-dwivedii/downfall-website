const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = 'C:\\Users\\a\\.gemini\\antigravity-ide\\brain\\ac18a124-edb8-46d1-890e-487626103839\\scratch';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Helper for smooth scrolling
  const smoothScroll = async (page, targetY, duration) => {
    await page.evaluate(async ({ targetY, duration }) => {
      const startY = window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();

      return new Promise(resolve => {
        const step = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease in-out cubic
          const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo(0, startY + distance * ease);

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    }, { targetY, duration });
  };

  // Record Desktop
  console.log('Recording Desktop...');
  const browser = await chromium.launch();
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: outDir,
      size: { width: 1440, height: 900 }
    }
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000');
  await desktopPage.evaluate(() => window.scrollTo(0, 0));
  await desktopPage.waitForTimeout(500);

  // Get offset of brand story
  const bsOffset = await desktopPage.evaluate(() => document.getElementById('brand-story').offsetTop);

  // Scroll down smoothly
  await smoothScroll(desktopPage, bsOffset + 400, 4000);
  await desktopPage.waitForTimeout(1000);
  // Scroll back up smoothly
  await smoothScroll(desktopPage, bsOffset - 200, 3000);
  await desktopPage.waitForTimeout(1000);

  const desktopVideoPath = await desktopPage.video().path();
  await desktopContext.close();

  const finalDesktopPath = path.join(outDir, 'desktop_scroll.webm');
  fs.renameSync(desktopVideoPath, finalDesktopPath);

  // Record Mobile
  console.log('Recording Mobile...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 800 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: outDir,
      size: { width: 375, height: 800 }
    }
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.evaluate(() => window.scrollTo(0, 0));
  await mobilePage.waitForTimeout(500);

  const bsMobileOffset = await mobilePage.evaluate(() => document.getElementById('brand-story').offsetTop);

  // Scroll down smoothly
  await smoothScroll(mobilePage, bsMobileOffset + 400, 4000);
  await mobilePage.waitForTimeout(1000);
  // Scroll back up smoothly
  await smoothScroll(mobilePage, bsMobileOffset - 200, 3000);
  await mobilePage.waitForTimeout(1000);

  const mobileVideoPath = await mobilePage.video().path();
  await mobileContext.close();

  const finalMobilePath = path.join(outDir, 'mobile_scroll.webm');
  fs.renameSync(mobileVideoPath, finalMobilePath);

  await browser.close();
  console.log('Done!');
})();
