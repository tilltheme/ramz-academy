// أكاديمية رمـز — check site/ the way a host serves it: over HTTP, from the folder alone.
// Usage: npm run check   (or: node tools/check-site.js)
// Every page: ready, no script errors, every glyph Alan Sans, every image loads, every request answered,
// nothing requested from outside the site, every internal link answers 200. Plus the PDF, the icon, the preview.
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium, devices } = require('playwright');
const DIST = path.resolve(__dirname, '..', 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(DIST, '404.html'))); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const PAGES = ['/', '/memos/', '/memos/automation-from-zero/', '/memos/automation-from-zero/part-1/', '/memos/automation-from-zero/part-1/book.html'];
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };

server.listen(0, async () => {
  const B = `http://localhost:${server.address().port}`;
  const b = await chromium.launch();
  for (const [name, ctxOpts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await b.newContext(ctxOpts);
    for (const pg of PAGES) {
      const p = await ctx.newPage(), errs = [], failed = [], outside = [];
      p.on('pageerror', (e) => errs.push(e.message));
      p.on('requestfailed', (r) => failed.push(r.url()));
      p.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
      p.on('request', (r) => { const u = r.url(); if (!u.startsWith(B) && !u.startsWith('data:') && !u.startsWith('blob:')) outside.push(u); });
      await p.goto(B + pg); await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });
      const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'body *' });
      const fonts = new Set(); for (const nodeId of nodeIds) { try { (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts.forEach((f) => fonts.add(f.familyName)); } catch (_) {} }
      const broken = await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
      const hscroll = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const other = [...fonts].filter((f) => !/^Alan Sans/.test(f));
      ok(!errs.length && !failed.length && !outside.length && !other.length && !broken.length && hscroll <= 0,
        `${name} ${pg}` + (errs.length ? ' JS:' + errs : '') + (failed.length ? ' FAILED:' + failed : '') + (outside.length ? ' OUTSIDE:' + outside : '') + (other.length ? ' FONT:' + other : '') + (broken.length ? ' IMG:' + broken : '') + (hscroll > 0 ? ' HSCROLL' : ''));
      if (name === 'desktop') {
        const links = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => h.startsWith(location.origin)).map((h) => h.split('#')[0]))]);
        for (const l of links) { const r = await ctx.request.get(l); if (r.status() !== 200) ok(false, `link ${l} → ${r.status()}`); }
        const head = await p.evaluate(() => ({ icon: !!document.querySelector('link[rel=icon]'), og: (document.querySelector('meta[property="og:image"]') || {}).content }));
        if (!head.icon || !head.og) ok(false, `${pg} misses the icon or the share preview`);
      }
      await p.close();
    }
    await ctx.close();
  }
  const r404 = await (await b.newContext()).request.get(B + '/no-such-page');
  ok(r404.status() === 404 && (await r404.text()).includes('الصفحة مو موجودة'), 'unknown address shows the academy 404 page');
  for (const f of ['/assets/brand/share.png', '/assets/brand/icon-512.png', '/memos/automation-from-zero/part-1/automation-from-zero-part-1.pdf', '/robots.txt']) {
    const r = await (await b.newContext()).request.get(B + f); ok(r.status() === 200, `${f} served`);
  }
  await b.close(); server.close();
  console.log(bad ? `${bad} problem(s)` : 'site is ready to publish');
  process.exit(bad ? 1 : 0);
});
