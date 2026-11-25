// RAMZ ACADEMY — record a visitor's walk through the site and the book, as a video.
// Usage: node ramz-academy/scripts/record-tour.js [out.mp4]   (default ramz-academy/exports/tour.mp4)
// A drawn cursor and short captions are added on top of the page, only for the recording.
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), SITE = 'file://' + path.join(ROOT, 'site', 'index.html');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'out', 'tour.mp4'));
const TMP = path.join(path.dirname(OUT), '.tour-raw');
const W = 1440, H = 900;

// cursor + caption layer, injected into every page
const OVERLAY = () => {
  const add = () => {
    document.documentElement.style.scrollBehavior = 'auto';
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = `#__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:none}
      #__cur svg{display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
      #__ring{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #FF5A1F;z-index:2147483646;pointer-events:none;opacity:0}
      #__ring.on{animation:__r .55s ease-out}@keyframes __r{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.4)}}
      #__cap{position:fixed;left:50%;bottom:30px;transform:translate(-50%,20px);z-index:2147483645;pointer-events:none;opacity:0;transition:opacity .35s,transform .35s;
        display:flex;align-items:center;gap:12px;padding:14px 24px 16px;border-radius:999px;background:#141413;color:#F2EFE8;font-family:'Alan Sans';font-weight:800;font-size:21px;direction:rtl;white-space:nowrap;box-shadow:0 18px 40px -16px rgba(0,0,0,.55)}
      #__cap i{width:10px;height:10px;border-radius:50%;background:#FF5A1F;display:block}
      #__cap.on{opacity:1;transform:translate(-50%,0)}#__cap.top{bottom:auto;top:84px}`;
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2l18 9.5-7.6 2.1L10 21z" fill="#fff" stroke="#141413" stroke-width="2" stroke-linejoin="round"/></svg>';
    const r = document.createElement('div'); r.id = '__ring';
    const cap = document.createElement('div'); cap.id = '__cap'; cap.innerHTML = '<i></i><span></span>';
    document.body.append(c, r, cap);
    addEventListener('mousemove', (e) => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true);
    addEventListener('mousedown', (e) => { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.classList.remove('on'); void r.offsetWidth; r.classList.add('on'); }, true);
  };
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
  window.__caption = (t, top) => { const cap = document.getElementById('__cap'); if (!cap) return; if (!t) { cap.classList.remove('on'); return; } cap.lastChild.textContent = t; cap.classList.toggle('top', !!top); cap.classList.add('on'); };
};

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: TMP, size: { width: W, height: H } } });
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage();
  const wait = (ms) => p.waitForTimeout(ms);
  let mx = W / 2, my = H / 2;
  const cap = async (t, top) => { await p.evaluate(([t, top]) => window.__caption(t, top), [t, !!top]); };
  const move = async (x, y, steps = 28) => { await p.mouse.move(x, y, { steps }); mx = x; my = y; };
  const box = async (sel) => { const e = await p.$(sel); const r = await e.boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const scrollTo = async (yOrSel, ms = 1600, offset = 90) => {
    await p.evaluate(async ([t, ms, off]) => {
      const to = typeof t === 'number' ? t : document.querySelector(t).getBoundingClientRect().top + scrollY - off;
      const from = scrollY, max = document.documentElement.scrollHeight - innerHeight, end = Math.max(0, Math.min(max, to)), t0 = performance.now();
      await new Promise((res) => { const step = (now) => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; scrollTo(0, from + (end - from) * e); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
    }, [yOrSel, ms, offset]);
  };
  const click = async (sel, pause = 500) => { const c = await box(sel); await move(c.x, c.y); await wait(180); await p.mouse.down(); await p.mouse.up(); await wait(pause); };
  const hover = async (sel, pause = 600) => { const c = await box(sel); await move(c.x, c.y); await wait(pause); };

  // ---------------- the site ----------------
  // ---- the academy's home page ----
  await p.goto(SITE);
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, H / 2, 1); await wait(900);
  await cap('أكاديمية رمـز — الصفحة الرئيسية'); await wait(1600);
  await cap('أحدث مذكرة');
  await hover('.home-hero .cover-card', 1300);
  await hover('.home-hero .btn.ink', 800);
  await move(1000, 760); await wait(900);

  await cap('عن الأكاديمية');
  await scrollTo('#about', 1600, 60); await wait(1800);
  await scrollTo('.pillars', 1000, 260); await wait(1600);

  await cap('أحدث المذكرات');
  await scrollTo('#latest', 1700, 40); await wait(1600);

  await cap('كلمات تختصر الطريق');
  await scrollTo('#quotes', 1600, 60); await wait(1800);
  await click('#qNext', 1800);
  await click('#qNext', 1800);
  await move(700, 640); await wait(900);

  await cap('طريقتنا');
  await scrollTo('#method', 1600, 60); await wait(1500);
  await scrollTo('.stages', 1000, 220); await wait(1500);

  await cap('من يقف خلف الأكاديمية؟');
  await scrollTo('#team', 1600, 60); await wait(1600);
  await scrollTo(1e6, 1200); await wait(1200);

  // ---- the memos page ----
  await cap('كل المذكرات');
  await scrollTo(0, 1600); await wait(300);
  await click('.nav a[href="memos/index.html"]', 200);
  await p.waitForURL(/memos\/index\.html$/);
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, 400, 1); await wait(1400);

  // ---- the article's own page ----
  await cap('صفحة المذكرة');
  await click('.arow .btn.signal', 200);
  await p.waitForURL(/automation-from-zero\/index\.html$/);
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, 400, 1); await wait(1500);
  await hover('.art-hero .byline', 1000);
  await cap('عن المذكرة');
  await scrollTo('.art-about', 1500, 80); await wait(1500);
  await cap('أجزاء المذكرة — اقرأ، تصفّح، أو حمّل');
  await scrollTo('#parts', 1400, 60); await wait(700);
  await hover('.prow .btn.line[download]', 700);
  await hover('.prow .btn.line[href$="book.html"]', 700);
  await scrollTo('.prow.off', 900, 300); await wait(1100);

  // ---- into part one ----
  await cap('نقرأ الجزء الأول');
  await scrollTo('#parts', 900, 60); await wait(300);
  await click('.prow .btn.ink', 200);
  await p.waitForURL(/part-1\/index\.html$/);
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, 300, 1); await wait(700);
  await cap('أتمتة الأعمال من الصفر — الجزء الأول'); await wait(1300);
  await hover('.crumbs b', 900);
  await hover('.hero .byline', 1300);
  await move(1000, 600); await wait(400);

  await cap('الإهداء ودليل التعلّم');
  await scrollTo('.ded', 1500, 120); await wait(1500);
  await scrollTo('#guide', 1500, 60); await wait(1600);
  await scrollTo('.stages', 1000, 200); await wait(1500);

  await cap('أجزاء المذكرة');
  await scrollTo('#map', 1600, 40); await wait(1800);

  await cap('الفصل الأول');
  await scrollTo('#ch1', 1700, 30); await wait(2000);

  await cap('الموضوع الأول — ويتسجّل تقدّمك');
  await scrollTo('#t1', 1500, 40); await wait(1400);

  // ---- highlight a line, then add a note ----
  const select = async (sel, words) => {
    const r = await p.evaluate(([sel, words]) => {
      const el = document.querySelector(sel), w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const i = n.data.indexOf(words); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + words.length); const b = r.getBoundingClientRect(); return { r: [b.left, b.top, b.width, b.height], ok: true }; } }
      return null;
    }, [sel, words]);
    const [x, y, w, h] = r.r;
    await move(x + w - 4, y + h / 2); await p.mouse.down(); await move(x + 4, y + h / 2, 30); await p.mouse.up();
    await p.evaluate(([sel, words]) => {              // make the selection exact, as a careful reader would
      const el = document.querySelector(sel), w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const i = n.data.indexOf(words); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + words.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return; } }
    }, [sel, words]);
    await p.waitForSelector('.hl-bar.on'); await wait(700);
  };
  await cap('ظلّل أي سطر يعجبك');
  await scrollTo('#t1 h2 + p + p', 1000, 300); await wait(500);
  await select('#t1', 'حين انتقل دور التقنية من تسهيل العمل إلى إنجاز خطواته نيابةً عن الإنسان.');
  await click('.hl-bar [data-c="o"]', 1400);
  await scrollTo('#t1 .keyline', 1300, 300); await wait(500);
  await cap('أو أضف عليه ملاحظة');
  await select('#t1 .keyline', 'الأتمتة لا تعني إلغاء دور الإنسان');
  await click('.hl-bar [data-n]', 700);
  await click('.hl-ta', 200); await p.keyboard.type('أشاركها مع الفريق', { delay: 70 }); await wait(500);
  await click('.hl-sheet [data-save]', 1300);

  await scrollTo('#t1 .done-btn', 1300, 520); await wait(500);
  await click('#t1 .done-btn', 1500);

  await cap('اسأل نفسك خمسة أسئلة');
  await scrollTo('#t2', 1500, 40); await wait(2200);

  await cap('مثال تقني — المخطط يتفاعل مع الخطوات');
  await scrollTo('.tech', 1700, 70); await wait(800);
  await click('#tsteps button[data-i="0"]', 1000);
  await click('#tsteps button[data-i="2"]', 1100);
  await click('#avail button[data-v="0"]', 1500);
  await click('#avail button[data-v="1"]', 800);
  await click('#tsteps button[data-i="4"]', 1500);

  await cap('حصيلة الفصل في صفحة');
  await scrollTo('#end', 1800, 40); await wait(2200);

  await cap('تظليلاتي — كلها في مكان واحد');
  await click('.hl-fab', 2200);
  await click('.hl-sheet .x', 600);

  // ---------------- «احفظ مكاني» and come back later ----------------
  await cap('وقفت هنا؟ احفظ مكانك');
  await scrollTo('#t4', 1600, 40); await wait(1000);
  await click('.rz-fab', 1700);
  await hover('.rz-sheet [data-a="copy"]', 800);
  await hover('.rz-sheet [data-r="tomorrow"]', 1100);
  await click('.rz-sheet h3 button', 600);
  await cap('بعدين… نرجع للأكاديمية');
  await p.goto(SITE); await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, 400, 1); await wait(900);
  await cap('«كمّل من حيث وقفت» تنتظرك');
  await hover('.rz-banner .rz-btn', 1600);
  await p.mouse.down(); await p.mouse.up();
  await p.waitForURL(/part-1\/index\.html\?at=/); await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, 400, 1);
  await cap('ورجعت لنفس المكان بالضبط'); await wait(2400);

  // ---------------- to the book ----------------
  await cap('ونرجع فوق… ونفتح الجزء الأول كتاب');
  await scrollTo(0, 2200); await wait(500);
  await click('.hero .btn.line', 200);
  await p.waitForURL(/book\.html/);
  await p.waitForFunction(() => document.body.dataset.ready === '1');
  await move(W / 2, H / 2, 1); await wait(900);
  await cap('الجزء الأول كتاب — يُقلب من اليمين مثل الكتب العربية', true); await wait(1500);
  await hover('#slotL .byline', 1500);
  for (let i = 0; i < 5; i++) await click('#next', 1250);
  await cap('اختبر الانتقال لأي صفحة', true);
  const r = await (await p.$('#jump')).boundingBox();
  await move(r.x + r.width * 0.55, r.y + r.height / 2); await p.mouse.down();
  await move(r.x + r.width * 0.38, r.y + r.height / 2, 30); await p.mouse.up(); await wait(1400);
  await click('#next', 1300);
  await click('#next', 1300);
  await click('#prev', 1400);

  // ---------------- print / PDF ----------------
  await cap('اطبع أو احفظه PDF', true);
  await hover('a[download]', 1100);
  await hover('#print', 900);
  await p.evaluate(() => { window.print = () => {}; });
  await p.mouse.down(); await p.mouse.up(); await wait(400);
  await cap('');
  await p.emulateMedia({ media: 'print' });
  await p.evaluate(() => { document.body.style.background = '#525659'; const s = document.getElementById('store'); s.style.cssText += ';display:flex;flex-direction:column;align-items:center;gap:22px;padding:30px 0'; });
  await p.evaluate(() => window.__caption('معاينة الطباعة — صفحات A4 جاهزة للحفظ PDF', true));
  await wait(1500);
  for (let y = 0; y < 5; y++) { await scrollTo(400 + y * 1150, 1200); await wait(700); }
  await wait(800);
  await cap(''); await wait(600);

  await p.close(); const video = await p.video().path(); await ctx.close(); await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', OUT]);
  fs.unlinkSync(video);
  console.log('video:', OUT);
})();
