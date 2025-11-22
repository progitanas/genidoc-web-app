const { chromium } = require('playwright');
(async () => {
  try {
    const url = 'http://localhost:3000/index.html';
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });

    // Wait for either banner or timeout
    let bannerExists = false;
    try {
      await page.waitForSelector(
        '#gd-cookie-banner, #gd-cookie-modal, #gd-reopen-btn',
        { timeout: 6000 }
      );
      bannerExists = true;
    } catch (e) {
      bannerExists = false;
    }

    const bannerVisible =
      bannerExists &&
      (await page.evaluate(() => {
        const el = document.getElementById('gd-cookie-banner');
        return (
          !!el &&
          window.getComputedStyle(el).display !== 'none' &&
          el.offsetParent !== null
        );
      }));

    console.log('BANNER_EXISTS:', bannerExists);
    console.log('BANNER_VISIBLE:', bannerVisible);

    if (bannerVisible) {
      // Try clicking Tout autoriser if present
      const accept = await page.$('#gd-accept');
      if (accept) {
        await accept.click();
        // wait a moment for localStorage update
        await page.waitForTimeout(500);
      }
      const consent = await page.evaluate(() => {
        try {
          return localStorage.getItem('gd_cookie_consent');
        } catch (e) {
          return null;
        }
      });
      console.log('LOCALSTORAGE_gd_cookie_consent:', consent);
    } else {
      console.log('Banner not visible — skipping interaction.');
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('TEST_ERROR', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
