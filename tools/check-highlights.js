// RAMZ ACADEMY — check التظليل والملاحظات end to end: highlight + note on a laptop, see it in the book,
// carry it to a «phone» (a fresh browser with empty storage) through the «احفظ مكاني» link. Keeps screenshots.
// Usage: node ramz-academy/scripts/check-highlights.js [out dir]   (default ramz-academy/exports/highlights)
const path = require('path'), fs = require('fs');
const { chromium, devices } = require('playwright');
const SITE = path.resolve(__dirname, '..', 'site'), PART = 'memos/automation-from-zero/part-1/';
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out', 'highlights'));
const u = (p) => 'file://' + path.join(SITE, p);
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

// select the given words inside the first element matching `sel`, then let the toolbar appear
const selectWords = (p, sel, words) => p.evaluate(([sel, words]) => {
  const el = document.querySelector(sel), w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const i = n.data.indexOf(words); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + words.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); r.startContainer.parentElement.scrollIntoView({ block: 'center' }); return true; } }
  return false;
}, [sel, words]);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const lap = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await lap.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ready = (pg) => pg.waitForFunction(() => document.body.dataset.ready === '1');

  // 1) laptop: highlight a line, then highlight another and write a note on it
  await p.goto(u(PART + 'index.html')); await ready(p); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  ok(await selectWords(p, '#t1', 'حين انتقل دور التقنية من تسهيل العمل إلى إنجاز خطواته نيابةً عن الإنسان.'), 'selected a line in topic 01');
  await p.waitForSelector('.hl-bar.on'); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, '1-toolbar.png') });
  await p.click('.hl-bar [data-c="o"]'); await p.waitForTimeout(200);
  ok(await p.locator('#t1 mark.hl-mark').count() > 0, 'the line is highlighted');
  ok(await selectWords(p, '#t2', 'ليس الهدف أتمتة كل شيء، بل أتمتة ما يستحق.'), 'selected a line in topic 02');
  await p.waitForSelector('.hl-bar.on'); await p.click('.hl-bar [data-n]'); await p.waitForSelector('.hl-back.on');
  await p.fill('.hl-ta', 'أطبّقها على مهام التسجيل في شغلي'); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, '2-note.png') });
  await p.click('.hl-sheet [data-save]'); await p.waitForTimeout(200);
  ok(await p.locator('#t2 mark.hl-mark.has-note').count() > 0, 'the second line is highlighted with a note');
  await p.screenshot({ path: path.join(OUT, '3-highlighted.png') });

  // 2) they stay after a reload, and «تظليلاتي» lists them
  await p.reload(); await ready(p); await p.waitForTimeout(300);
  ok(await p.locator('mark.hl-mark').count() >= 2, 'highlights are still there after reopening');
  await p.click('.hl-fab'); await p.waitForSelector('.hl-back.on'); await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, '4-my-highlights.png') });
  ok(await p.locator('.hl-item').count() === 2, '«تظليلاتي» lists 2 highlights');
  await p.keyboard.press('Escape');

  // 3) the book shows the same highlights
  await p.goto(u(PART + 'book.html')); await ready(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('#store mark.hl-mark').length) >= 2, 'the book carries the same highlights');
  await p.click('#hlBtn'); await p.waitForSelector('.hl-back.on'); await p.click('.hl-item [data-go]'); await p.waitForTimeout(500);
  ok(await p.locator('#book mark.hl-mark').count() > 0, '«اذهب» opens the book on the highlighted page');
  await p.screenshot({ path: path.join(OUT, '5-book.png') });

  // 4) the link from «احفظ مكاني» carries them
  await p.goto(u(PART + 'index.html?at=t2')); await ready(p); await p.waitForTimeout(300);
  await p.click('.rz-fab'); await p.waitForSelector('.rz-back.on'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, '6-save-sheet.png') });
  const link = await p.evaluate(async () => (await Highlights.hash()) && (location.href.split('#')[0] + await Highlights.hash()));
  ok(/#hl=/.test(link), `the link carries the highlights (${link.length} characters)`);

  // 5) «phone»: a fresh browser, nothing stored — open the link
  const phone = await b.newContext({ ...devices['iPhone 13'] });
  const q = await phone.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto(link); await ready(q); await q.waitForTimeout(700);
  ok(await q.locator('mark.hl-mark').count() >= 2, 'on the phone: both highlights are there');
  ok(await q.locator('mark.hl-mark.has-note').count() > 0, 'on the phone: the note came too');
  ok(await q.evaluate(() => Math.abs(document.getElementById('t2').getBoundingClientRect().top) < 200), 'on the phone: opened at the same place');
  await q.screenshot({ path: path.join(OUT, '7-phone.png') });
  await q.click('mark.hl-mark.has-note'); await q.waitForSelector('.hl-back.on'); await q.waitForTimeout(300);
  ok((await q.inputValue('.hl-ta')) === 'أطبّقها على مهام التسجيل في شغلي', 'on the phone: the note reads the same');
  await q.screenshot({ path: path.join(OUT, '8-phone-note.png') });

  ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs : ''));
  await b.close();
})();
