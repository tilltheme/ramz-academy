// RAMZ ACADEMY — check «كمّل من حيث وقفت» end to end, the way a reader uses it, and keep screenshots.
// Usage: node ramz-academy/scripts/check-resume.js [out dir]   (default ramz-academy/exports/resume)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const SITE = path.resolve(__dirname, '..', 'site');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out', 'resume'));
const u = (p) => 'file://' + path.join(SITE, p);
const PART = 'memos/automation-from-zero/part-1/';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ready = () => p.waitForFunction(() => document.body.dataset.ready === '1');
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const noSmooth = () => p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  // 1) reading: stop at «مكونات سير العمل»
  await p.goto(u(PART + 'index.html')); await ready(); await noSmooth();
  await p.evaluate(() => { const e = document.getElementById('t3'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 40); }); await p.waitForTimeout(700);
  let s = await p.evaluate(() => JSON.parse(localStorage.getItem('ramz-academy:resume') || 'null'));
  ok(s && s.href.endsWith('?at=t3') && s.label === 'مكونات سير العمل', 'reading place remembered: ' + (s && s.label));
  // «احفظ مكاني»
  await p.click('.rz-fab'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, '1-save-sheet.png') });
  const dl = p.waitForEvent('download'); await p.click('.rz-sheet [data-r="tomorrow"]'); const d = await dl;
  const ics = fs.readFileSync(await d.path(), 'utf8');
  ok(/BEGIN:VEVENT/.test(ics) && ics.includes('part-1/index.html?at=t3') && /TRIGGER:PT0M/.test(ics), 'calendar reminder carries the resume link (' + d.suggestedFilename() + ')');
  fs.writeFileSync(path.join(OUT, 'reminder-sample.ics'), ics);
  await p.keyboard.press('Escape');

  // 2) back later, on the home page: «كمّل من حيث وقفت»
  await p.goto(u('index.html')); await ready(); await p.waitForTimeout(300);
  ok(await p.isVisible('.rz-banner'), 'home shows «كمّل من حيث وقفت»');
  await p.screenshot({ path: path.join(OUT, '2-home-banner.png'), clip: { x: 0, y: 0, width: 1440, height: 420 } });
  await p.click('.rz-banner .rz-btn'); await p.waitForURL(/part-1\/index\.html\?at=t3/); await ready(); await p.waitForTimeout(400);
  const near = await p.evaluate(() => Math.abs(document.getElementById('t3').getBoundingClientRect().top));
  ok(near < 120, 'the resume link opens right at the place (' + Math.round(near) + 'px from the top)');
  await p.screenshot({ path: path.join(OUT, '3-opened-at-place.png') });

  // 3) opening the part from its start: a gentle «كمّل؟»
  await p.goto(u(PART + 'index.html')); await ready(); await p.waitForTimeout(500);
  ok(await p.isVisible('.rz-toast'), 'the part offers to continue');
  await p.screenshot({ path: path.join(OUT, '4-part-toast.png') });

  // 4) the book remembers its page too
  await p.goto(u(PART + 'book.html')); await ready();
  for (let i = 0; i < 4; i++) { await p.click('#next'); await p.waitForTimeout(1000); }
  s = await p.evaluate(() => JSON.parse(localStorage.getItem('ramz-academy:resume') || 'null'));
  ok(s && /book\.html\?p=\d+/.test(s.href), 'book page remembered: ' + (s && s.label));
  await p.goto(u(PART + 'book.html')); await ready(); await p.waitForTimeout(500);
  ok(await p.isVisible('.rz-toast'), 'the book offers to continue');
  await p.screenshot({ path: path.join(OUT, '5-book-toast.png') });
  await p.click('#saveBtn'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, '6-book-save-sheet.png') });

  ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs : ''));
  await b.close();
})();
