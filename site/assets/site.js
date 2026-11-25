// أكاديمية رمـز — shared page parts: header, footer, icons, the dark shape, memo/part cards, quotes.
// A page sets <body data-root="…"> (its path back to the site root) and calls what it needs, then Site.ready().
window.Site = (function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const root = () => document.body.dataset.root || '';
  const mark = () => root() + '../assets/brand/ramz-mark-orange.png';
  const C = () => window.CATALOG || { memos: [] };
  const pad = (n) => String(n).padStart(2, '0');
  const lat = (t) => t.replace(/([A-Za-z][A-Za-z0-9 ]*[A-Za-z0-9])/g, '<span class="latin">$1</span>');

  // ---------- icons (strokes, coloured by the parent) ----------
  const P = {
    book: '<path d="M12 6.5C10.5 5 8.2 4.5 4 4.6v13.6c4.2-.1 6.5.4 8 1.9 1.5-1.5 3.8-2 8-1.9V4.6c-4.2-.1-6.5.4-8 1.9zM12 6.5v13.6"/>',
    arrow: '<path d="M20 12H5M11 6l-6 6 6 6"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/>',
    bulb: '<path d="M9 17.5h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    life: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/>', code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13.5 5l-3 14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M10 2.5v3M14 2.5v3M10 18.5v3M14 18.5v3M2.5 10h3M2.5 14h3M18.5 10h3M18.5 14h3"/><circle cx="12" cy="12" r="2"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>', layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>', nodes: '<circle cx="12" cy="5.5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M12 8v4M12 12l-5 4.2M12 12l5 4.2"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none"/>', list: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>'
  };
  const icon = (n, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const icons = (r = document) => $$('i[data-ic]', r).forEach((i) => { i.outerHTML = icon(i.dataset.ic, i.closest('.ic') ? 24 : i.closest('.byline') ? 16 : 20); });

  // ---------- header and footer ----------
  const pub = (a) => a.parts.filter((p) => p.read);
  const latest = () => { const a = C().memos[0]; const ps = a ? pub(a) : []; return ps[ps.length - 1]; };
  const header = (el, active) => {
    const R = root(), l = latest(), items = [['home', 'الرئيسية', R + 'index.html'], ['about', 'عن الأكاديمية', R + 'index.html#about'], ['memos', 'المذكرات', R + 'memos/index.html'], ['team', 'من نحن', R + 'index.html#team']];
    el.className = 'top';
    el.innerHTML = `<a class="brand" href="${R}index.html" id="top"><span class="mark"><img src="${mark()}" alt="رمـز"></span><span class="ar">أكاديمية رمـز</span></a>
      <nav class="nav">${items.map(([k, t, h]) => `<a href="${h}"${k === active ? ' class="cur"' : ''}>${t}</a>`).join('')}
      ${l ? `<a class="btn ink" href="${R + l.read}" style="font-size:15px;padding:11px 18px 12px">ابدأ القراءة<i data-ic="arrow"></i></a>` : ''}</nav>`;
    if (window.Resume) Resume.banner(el, R);   // «كمّل من حيث وقفت» when this device remembers a place
  };
  const footer = (el) => {
    const R = root();
    const L = C().links || {}, follow = [['social', 'منصات التواصل الاجتماعي'], ['community', 'مجتمعاتنا'], ['ramzNews', 'رمـز لأتمتة الأعمال']].filter(([k]) => L[k]).map(([k, t]) => `<a href="${L[k]}" target="_blank" rel="noopener">${t}</a>`).join('');
    el.className = 'shape site-foot' + (follow ? '' : ' no-follow'); el.dataset.pocket = 'none';
    el.innerHTML = `<div class="fgrid on-dark">
        <div class="fcol fbrand"><a class="brand" href="${R}index.html"><span class="mark"><img src="${mark()}" alt="رمـز"></span><span class="ar">أكاديمية رمـز</span></a>
          <p>مبادرة تعليمية من رمـز لأتمتة الأعمال، نتعلّم فيها الأتمتة من الصفر بأسلوب بسيط وعملي.</p></div>
        <div class="fcol"><h4>الأكاديمية</h4><a href="${R}index.html#about">عن الأكاديمية</a><a href="${R}index.html#method">طريقتنا</a><a href="${R}index.html#team">من نحن</a></div>
        <div class="fcol"><h4>المذكرات</h4><a href="${R}memos/index.html">كل المذكرات</a>${C().memos.map((a) => `<a href="${R}memos/${a.slug}/index.html">${a.title} ${a.titleHl}</a>`).join('')}</div>${follow ? `
        <div class="fcol"><h4>تابعنا</h4>${follow}</div>` : ''}
      </div>
      <div class="fbottom on-dark"><span>© أكاديمية رمـز</span><span>مبادرة تعليمية من رمـز لأتمتة الأعمال</span></div>`;
  };

  // ---------- memo and part cards ----------
  const cover = (a, href, cls = '') => `<a class="cover-card ${cls}" href="${href}" style="background-image:url('${root() + a.cover}')" aria-label="${a.title} ${a.titleHl}"><span class="tape"></span></a>`;
  const partsWord = (n) => n === 1 ? 'جزء واحد' : n === 2 ? 'جزآن' : n + ' أجزاء';
  const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];
  const memoRow = (a) => {
    const R = root(), first = pub(a)[0], url = `${R}memos/${a.slug}/index.html`;
    return `<div class="shape arow" data-pocket="none"><div class="memo-grid on-dark">
      ${cover(a, url)}
      <div class="memo-info">
        <span class="badge" style="background:var(--ink-3)">${a.kind}</span>
        <h3><a href="${url}">${a.title} <span class="hl">${a.titleHl}</span></a></h3>
        <p class="lead">${a.sub}</p>
        <div class="byline"><i data-ic="pen"></i>بقلم <b>${a.author}</b></div>
        <div class="chips"><span>${a.level}</span><span>${partsWord(a.parts.length)}</span></div>
        <div class="memo-cta">
          <a class="btn signal" href="${url}">افتح المذكرة<i data-ic="arrow"></i></a>
          ${first ? `<a class="btn line-d" href="${R + first.read}">ابدأ القراءة<i data-ic="book"></i></a>` : ''}
        </div>
      </div></div></div>`;
  };
  const partRow = (a, p) => {
    const R = root();
    if (!p.read) return `<div class="prow off"><div class="pnum"><span class="num">${pad(p.n)}</span><small>الجزء</small></div>
      <div class="pinfo"><b>${p.name}</b></div><div class="pact"><span class="soon-tag">قريبًا</span></div></div>`;
    return `<div class="prow">
      <div class="pnum"><span class="num">${pad(p.n)}</span><small>الجزء</small></div>
      <div class="pinfo"><b>${p.name}</b><span>${p.chapters.map((c, i) => `الفصل ${ORD[i] || i + 1}: ${c}`).join(' · ')}</span>
        <div class="pmeta"><span>${p.pages} صفحة</span></div></div>
      <div class="pact">
        <a class="btn ink" href="${R + p.read}">اقرأ<i data-ic="arrow"></i></a>
        <a class="btn line" href="${R + p.book}">كتاب<i data-ic="book"></i></a>
        <a class="btn line" href="${R + p.pdf}" download>PDF<i data-ic="down"></i></a>
      </div></div>`;
  };

  // ---------- the dark shape around the paper pocket ----------
  let uid = 0;
  const paint = (host) => {
    const W = host.clientWidth, H = host.clientHeight; if (!W || !H) return;
    let svg = host.querySelector(':scope > svg.shape-bg');
    if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'shape-bg'); host.prepend(svg); svg.dataset.id = 's' + (++uid); }
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    const id = svg.dataset.id, hr = host.getBoundingClientRect(), mode = host.dataset.pocket;
    const O = Math.max(46, Math.min(150, W * 0.11)), I = O * 0.72, pk = host.querySelector('.pocket');
    let pts;
    if (mode === 'none' || !pk) pts = [[0, 0, O], [W, 0, O], [W, H, O], [0, H, O]];
    else {
      const r = pk.getBoundingClientRect(), ph = r.bottom - hr.top, x = mode === 'tr' ? r.left - hr.left : r.right - hr.left;
      const full = mode === 'tr' ? x < W * 0.22 : x > W * 0.78;
      if (full) pts = [[0, ph, O], [W, ph, O], [W, H, O], [0, H, O]];
      else if (mode === 'tr') pts = [[0, 0, O], [x, 0, O * .8], [x, ph, I], [W, ph, O * .8], [W, H, O], [0, H, O * 1.15]];
      else pts = [[x, 0, O * .8], [W, 0, O], [W, H, O * 1.15], [0, H, O], [0, ph, O * .8], [x, ph, I]];
    }
    const d = window.RamzOrganic.smoothPoly(pts, 0.4);
    svg.innerHTML = `<defs><linearGradient id="g${id}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#262624"/><stop offset="1" stop-color="#141413"/></linearGradient>
      <clipPath id="c${id}"><path d="${d}"/></clipPath>
      <filter id="n${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs>
      <path d="${d}" fill="url(#g${id})"/><rect width="${W}" height="${H}" filter="url(#n${id})" opacity=".09" clip-path="url(#c${id})" style="mix-blend-mode:overlay"/>`;
  };

  // ---------- quotes: short lines from the memos, each naming its memo ----------
  const quotes = () => {
    if (!$('#qMain')) return;
    const QT = [];
    C().memos.forEach((m) => (m.quotes || []).forEach(([t, h, where]) => QT.push({ t, h, where, m })));
    if (!QT.length) return;
    let qi = 0, qTimer = null;
    $('#qOf').textContent = 'من ' + pad(QT.length);
    $('#qDots').innerHTML = QT.map((_, i) => `<button aria-label="اقتباس ${i + 1}"></button>`).join('');
    const setQ = (i, anim = true) => {
      qi = (i + QT.length) % QT.length;
      const { t, h, where, m } = QT[qi], main = $('#qMain');
      const put = () => { const tx = $('#qText'); tx.textContent = ''; const at = t.indexOf(h);
        tx.append(t.slice(0, at)); const sp = document.createElement('span'); sp.className = 'hl'; sp.textContent = h; tx.append(sp, t.slice(at + h.length));
        const src = $('#qSrc'); src.innerHTML = `<a class="q-memo" href="${root()}memos/${m.slug}/index.html"><i data-ic="book"></i>من مذكرة «${m.title} ${m.titleHl}»</a><span class="q-where">${where}</span>`; icons(src);
        $('#qNum').textContent = pad(qi + 1);
        $$('#qDots button').forEach((d, j) => d.classList.toggle('on', j === qi)); main.classList.remove('out'); };
      if (!anim) return put();
      main.classList.add('out'); setTimeout(put, 300);
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = () => { clearInterval(qTimer); if (!reduce) qTimer = setInterval(() => setQ(qi + 1), 7000); };
    $('#qNext').addEventListener('click', () => { setQ(qi + 1); auto(); });
    $('#qPrev').addEventListener('click', () => { setQ(qi - 1); auto(); });
    $$('#qDots button').forEach((d, j) => d.addEventListener('click', () => { setQ(j); auto(); }));
    const qs = $('#quotes'); qs.addEventListener('mouseenter', () => clearInterval(qTimer)); qs.addEventListener('mouseleave', auto);
    $('#qCopy').addEventListener('click', async () => { const lbl = $('#qCopy span'), q = QT[qi], txt = `«${q.t}» — من مذكرة «${q.m.title} ${q.m.titleHl}»، أكاديمية رمـز`;
      try { await navigator.clipboard.writeText(txt); lbl.textContent = 'تم النسخ'; } catch (_) { lbl.textContent = 'ما قدرت أنسخ'; }
      setTimeout(() => lbl.textContent = 'انسخ الاقتباس', 1800); });
    setQ(0, false); auto();
  };

  // ---------- go: icons, quotes, then paint the shapes once fonts and pictures are in ----------
  const ready = () => {
    icons(); quotes();
    // buttons tied to a link in the catalogue: shown only once the link is filled in
    const L = C().links || {};
    $$('a[data-link]').forEach((a) => { const u = L[a.dataset.link]; if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } else a.remove(); });
    $$('.links').forEach((g) => { if (!g.querySelector('a')) g.remove(); });
    const imgs = $$('img').map((im) => im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; }));
    Promise.all([document.fonts.ready, ...imgs]).then(() => { const go = () => $$('.shape').forEach(paint); go(); new ResizeObserver(go).observe(document.body); document.body.dataset.ready = '1'; });
  };
  return { $, $$, C, root, mark, pad, pub, partsWord, icon, icons, header, footer, cover, memoRow, partRow, paint, ready };
})();
