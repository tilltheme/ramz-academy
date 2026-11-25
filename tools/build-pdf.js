// RAMZ ACADEMY — the memo as a book: check every sheet, print the PDF, and screenshot the flip-book.
// Usage: node ramz-academy/scripts/render-book.js [out dir]   (default ramz-academy/exports)
// Fails if a glyph is not Alan Sans, an image does not load, or any sheet's content overflows its page.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), PART = path.join(ROOT, 'site', 'memos', 'automation-from-zero', 'part-1'), PAGE = 'file://' + path.join(PART, 'book.html');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'out'));
(async () => {
  fs.mkdirSync(path.join(OUT, 'book'), { recursive: true });
  const b = await chromium.launch(); let bad = false;
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto(PAGE);
  await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });

  // 1) overflow: the content of every sheet must fit its page
  const over = await p.evaluate(() => [...document.querySelectorAll('#store .page')].map((pg, i) => {
    const b = pg.querySelector('.pbody') || pg; return b.scrollHeight - b.clientHeight > 1 ? `${i + 1} (+${b.scrollHeight - b.clientHeight}px)` : null; }).filter(Boolean));
  console.log(over.length ? 'OVERFLOW on pages ' + over.join(', ') : 'all pages fit');
  if (over.length) bad = true;

  // 2) fonts and images (the store holds every sheet)
  const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'body *' });
  const used = {};
  for (const nodeId of nodeIds) { try { const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); for (const f of fonts) used[f.familyName] = (used[f.familyName] || 0) + f.glyphCount; } catch (_) {} }
  const broken = await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src.slice(0, 80)));
  const other = Object.keys(used).filter((f) => !/^Alan Sans/.test(f));
  console.log(JSON.stringify(used), other.length ? 'FALLBACK ' + other : 'fonts OK', broken.length ? 'BROKEN IMG ' + broken : 'images OK');
  if (other.length || broken.length) bad = true;

  // 3) every sheet as a picture, then the spreads and a page mid-turn
  const n = await p.evaluate(() => document.querySelectorAll('#store .page').length);
  await p.screenshot({ path: path.join(OUT, 'book-closed.png') });
  await p.click('#next'); await p.waitForTimeout(1000);
  await p.screenshot({ path: path.join(OUT, 'book-spread-1.png') });
  await p.click('#next'); await p.waitForTimeout(450);
  await p.screenshot({ path: path.join(OUT, 'book-turning.png') });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const r = document.getElementById('jump'); r.value = 4; r.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(200); await p.screenshot({ path: path.join(OUT, 'book-spread-chapter.png') });
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ph.goto(PAGE + '?p=8'); await ph.waitForFunction(() => document.body.dataset.ready === '1');
  await ph.screenshot({ path: path.join(OUT, 'book-phone.png') });

  // 4) the PDF, exactly what «اطبع / احفظ PDF» gives
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(OUT, 'ramz-academy-part1.pdf'), preferCSSPageSize: true, printBackground: true });
  console.log('pdf written,', n, 'pages');
  // title and author in the PDF's properties (read from the page's <title> and <meta name="author">)
  const meta = await p.evaluate(() => ({ t: document.title, a: (document.querySelector('meta[name=author]') || {}).content || '' }));
  try { require('child_process').execFileSync('python3', ['-c', 'import sys\nfrom pypdf import PdfReader, PdfWriter\nr=PdfReader(sys.argv[1]); w=PdfWriter(clone_from=r)\nw.add_metadata({"/Title": sys.argv[2], "/Author": sys.argv[3]})\nw.write(sys.argv[1])', path.join(OUT, 'ramz-academy-part1.pdf'), meta.t, meta.a]); console.log('pdf metadata:', meta.a); }
  catch (e) { console.log('pypdf not available: PDF metadata skipped'); }
  // every sheet as a picture, taken from the PDF itself (page-01.png …)
  try { require('child_process').execFileSync('pdftoppm', ['-png', '-r', '96', path.join(OUT, 'ramz-academy-part1.pdf'), path.join(OUT, 'book', 'page')]); }
  catch (e) { console.log('pdftoppm not available: page pictures skipped'); }
  // the site serves its own copies: the PDF next to the part, the cover next to the article
  fs.copyFileSync(path.join(OUT, 'ramz-academy-part1.pdf'), path.join(PART, 'automation-from-zero-part-1.pdf'));
  if (fs.existsSync(path.join(OUT, 'book', 'page-01.png'))) fs.copyFileSync(path.join(OUT, 'book', 'page-01.png'), path.join(PART, '..', 'cover.png'));
  console.log('copied into the site: part-1 PDF, article cover');
  await b.close();
  if (bad) process.exit(1);
})();
