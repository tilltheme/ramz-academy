// أكاديمية رمـز — redraw the share preview (site/assets/brand/share.png, 1200×630) after editing tools/share-card.html.
const path = require('path'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.join(__dirname, 'share-card.html'));
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await p.screenshot({ path: path.join(__dirname, '..', 'site', 'assets', 'brand', 'share.png') });
  await b.close(); console.log('share.png updated');
})();
