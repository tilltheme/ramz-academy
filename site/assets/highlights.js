// أكاديمية رمـز — التظليل والملاحظات: select any line, colour it, add a note; keep them on this device,
// see them in the reading page and in the book, list them in «تظليلاتي», and carry them to another device
// inside the «احفظ مكاني» link (packed into #hl=… — no account, no server).
// Anchoring is by the quoted text itself (exact + a little before and after), so a highlight made in the
// reading page also shows in the book wherever the same words appear. Storage failures never break the page.
window.Highlights = (function () {
  let cfg = null, key = '', list = [];
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const load = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } };
  const save = () => { try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {} if (cfg && cfg.onCount) cfg.onCount(list.length); countFab(); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COLORS = { o: 'برتقالي', y: 'أصفر' };
  const IC = {
    pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3"/>', note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', go: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>', send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>'
  };
  const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  // ---------- styles ----------
  const css = `
  mark.hl-mark{background:rgba(255,90,31,.28);color:inherit;border-radius:3px;padding:0 1px;cursor:pointer;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  mark.hl-mark.y{background:rgba(244,199,67,.55)}
  mark.hl-mark.has-note{border-bottom:2px solid #FF5A1F}
  mark.hl-mark.flash{animation:hlflash 1.4s ease}
  @keyframes hlflash{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 4px rgba(255,90,31,.45)}}
  .hl-ui{font-family:'Alan Sans';direction:rtl}
  .hl-bar{position:fixed;z-index:80;display:flex;align-items:center;gap:4px;padding:6px;border-radius:999px;background:#141413;color:#F2EFE8;box-shadow:0 16px 32px -12px rgba(0,0,0,.55);opacity:0;pointer-events:none;transform:translateY(6px);transition:opacity .15s,transform .15s}
  .hl-bar.on{opacity:1;pointer-events:auto;transform:none}
  .hl-bar button{display:inline-flex;align-items:center;gap:7px;border:0;cursor:pointer;background:transparent;color:#F2EFE8;font:800 14px/1 'Alan Sans';padding:9px 12px 10px;border-radius:999px}
  .hl-bar button:hover{background:#2E2E2B}
  .hl-bar button svg{color:#FF5A1F}
  .hl-dot{width:22px;height:22px;border-radius:50%;display:inline-block;box-shadow:inset 0 0 0 2px rgba(242,239,232,.25)}
  .hl-dot.o{background:#FF7A45}.hl-dot.y{background:#F4C743}
  .hl-back{position:fixed;inset:0;z-index:85;background:rgba(20,20,19,.45);display:flex;align-items:flex-end;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:opacity .2s}
  .hl-back.on{opacity:1;pointer-events:auto}
  .hl-sheet{width:min(560px,100%);max-height:min(78vh,720px);overflow:auto;background:#F2EFE8;color:#141413;border-radius:30px;padding:24px 24px 20px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}
  .hl-sheet h3{font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px;line-height:1.25}
  .hl-sheet h3 small{font-size:14px;font-weight:700;color:#78746B;margin-right:8px}
  .hl-sheet .x{background:none;border:0;cursor:pointer;color:#78746B;padding:6px}
  .hl-q{margin-top:14px;border-right:4px solid #FF5A1F;padding:4px 14px 4px 0;font-size:17px;font-weight:600;line-height:1.75}
  .hl-q.y{border-color:#F4C743}
  .hl-ta{width:100%;margin-top:14px;border:0;border-radius:18px;background:#E5DFD3;padding:14px 16px;font:500 16px/1.7 'Alan Sans';color:#141413;resize:vertical;min-height:96px;outline:none;direction:rtl}
  .hl-ta:focus{box-shadow:inset 0 0 0 2px #FF5A1F}
  .hl-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px}
  .hl-btn{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;padding:11px 18px 13px;border-radius:999px;font:800 15px/1 'Alan Sans';background:#E5DFD3;color:#141413;text-decoration:none}
  .hl-btn svg{color:#FF5A1F}
  .hl-btn.ink{background:#141413;color:#F2EFE8}
  .hl-btn.sig{background:#FF5A1F;color:#141413}.hl-btn.sig svg{color:#141413}
  .hl-btn.ghost{background:transparent;color:#78746B}
  .hl-pick{display:flex;gap:8px;margin-inline-start:auto}
  .hl-pick button{width:34px;height:34px;border-radius:50%;border:0;cursor:pointer}
  .hl-pick button.o{background:#FF7A45}.hl-pick button.y{background:#F4C743}
  .hl-pick button.on{box-shadow:0 0 0 3px #F2EFE8,0 0 0 5px #141413}
  .hl-item{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;background:#E5DFD3;border-radius:20px;padding:14px 16px;margin-top:10px}
  .hl-item .hl-iq{border-right:4px solid #FF5A1F;padding-right:10px;font-size:15.5px;font-weight:600;line-height:1.65}
  .hl-item.y .hl-iq{border-color:#F4C743}
  .hl-item .hl-in{grid-column:1/-1;font-size:14.5px;font-weight:700;color:#3B3A36;background:#F2EFE8;border-radius:12px;padding:8px 12px;line-height:1.6}
  .hl-item .gone{grid-column:1/-1;font-size:13px;color:#78746B;font-weight:700}
  .hl-empty{margin-top:14px;font-size:16px;color:#78746B;font-weight:600;line-height:1.8}
  .hl-fab{position:fixed;left:22px;bottom:84px;z-index:60;display:inline-flex;align-items:center;gap:10px;padding:12px 18px 14px;border-radius:999px;background:#F2EFE8;color:#141413;font:800 15px/1 'Alan Sans';border:0;cursor:pointer;box-shadow:0 14px 30px -14px rgba(0,0,0,.45),inset 0 0 0 2px rgba(20,20,19,.12);direction:rtl}
  .hl-fab b{background:#FF5A1F;color:#141413;border-radius:999px;padding:4px 8px 5px;font-size:13px}
  .hl-fab.hide{display:none}
  .hl-tip{position:fixed;left:0;right:0;margin:0 auto;width:fit-content;top:18px;transform:translateY(-20px);z-index:66;display:flex;align-items:center;gap:12px;padding:12px 14px 12px 20px;border-radius:999px;background:#141413;color:#F2EFE8;font:700 15px 'Alan Sans';direction:rtl;opacity:0;transition:opacity .3s,transform .3s;max-width:calc(100% - 32px);box-shadow:0 18px 36px -14px rgba(0,0,0,.55)}
  .hl-tip.on{opacity:1;transform:none}
  .hl-tip svg{color:#FF5A1F;flex:none}
  .hl-tip button{background:none;border:0;color:rgba(242,239,232,.6);cursor:pointer;padding:4px}
  @media (max-width:600px){.hl-fab{left:14px;bottom:76px}.hl-tip{border-radius:22px}}
  @media print{.hl-ui,.hl-fab,.hl-bar{display:none!important}}`;
  const style = () => { if ($('#hl-style')) return; const s = document.createElement('style'); s.id = 'hl-style'; s.textContent = css; document.head.appendChild(s); };

  // ---------- text anchoring ----------
  const SKIP = 'svg, textarea, input, button, select, script, style, .hl-ui';
  const textNodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const a = []; let n; while ((n = w.nextNode())) a.push(n); return a; };
  const fullText = (root) => textNodes(root).map((n) => n.data).join('');
  const offsetsOf = (root, range) => {
    const pre = document.createRange(); pre.setStart(root, 0); pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length; return { start, end: start + range.toString().length };
  };
  const find = (root, h) => {
    const text = fullText(root); let best = null, at = text.indexOf(h.exact);
    while (at !== -1) {
      const before = text.slice(Math.max(0, at - h.prefix.length), at), after = text.slice(at + h.exact.length, at + h.exact.length + h.suffix.length);
      let score = 0; for (let i = 1; i <= before.length && before[before.length - i] === h.prefix[h.prefix.length - i]; i++) score++;
      for (let i = 0; i < after.length && after[i] === h.suffix[i]; i++) score++;
      if (!best || score > best.score) best = { start: at, end: at + h.exact.length, score };
      at = text.indexOf(h.exact, at + 1);
    }
    return best;
  };
  const wrap = (root, start, end, h) => {
    const segs = []; let pos = 0;
    for (const n of textNodes(root)) {
      const a = pos, b = pos + n.data.length; pos = b;
      if (b <= start || a >= end) continue;
      if (n.parentElement && n.parentElement.closest(SKIP)) continue;
      const s = Math.max(start, a) - a, e = Math.min(end, b) - a;
      if (!n.data.slice(s, e).trim()) continue;          // never wrap layout whitespace (it would become a grid item)
      segs.push([n, s, e]);
    }
    segs.forEach(([n, s, e]) => {
      let node = n; if (s > 0) node = node.splitText(s); if (e - s < node.data.length) node.splitText(e - s);
      const m = document.createElement('mark'); m.className = 'hl-mark' + (h.color === 'y' ? ' y' : '') + (h.note ? ' has-note' : '');
      m.dataset.id = h.id; if (h.note) m.title = h.note;
      node.parentNode.insertBefore(m, node); m.appendChild(node);
    });
    return segs.length > 0;
  };
  const unwrapAll = (root) => { $$('mark.hl-mark', root).forEach((m) => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); }); root.normalize(); };
  const apply = () => {
    const scopes = cfg.scopes();
    scopes.forEach(unwrapAll);
    list.forEach((h) => { h.missing = true; for (const sc of scopes) { const r = find(sc, h); if (r && wrap(sc, r.start, r.end, h)) { h.missing = false; break; } } });
    if (cfg.onApplied) cfg.onApplied();
  };

  // ---------- the toolbar on a selection ----------
  let bar = null, pending = null;
  const hideBar = () => { if (bar) bar.classList.remove('on'); pending = null; };
  const makeBar = () => {
    bar = document.createElement('div'); bar.className = 'hl-ui hl-bar'; bar.setAttribute('role', 'toolbar');
    bar.innerHTML = `<button data-c="o" aria-label="ظلّل بالبرتقالي"><span class="hl-dot o"></span>ظلّل</button><button data-c="y" aria-label="ظلّل بالأصفر"><span class="hl-dot y"></span></button><button data-n>${icon('note')}ملاحظة</button>`;
    bar.addEventListener('mousedown', (e) => e.preventDefault());       // keep the selection while clicking
    bar.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => add(b.dataset.c)));
    bar.querySelector('[data-n]').addEventListener('click', () => { const h = add('o'); if (h) openNote(h.id); });
    document.body.appendChild(bar);
  };
  const check = () => {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return hideBar();
    const range = sel.getRangeAt(0), txt = range.toString();
    if (txt.trim().length < 2 || txt.length > 800) return hideBar();
    const anc = range.commonAncestorContainer, el = anc.nodeType === 1 ? anc : anc.parentElement;
    if (!el || el.closest(SKIP)) return hideBar();
    const scope = cfg.selScope(el); if (!scope || !scope.contains(range.startContainer) || !scope.contains(range.endContainer)) return hideBar();
    const { start, end } = offsetsOf(scope, range), text = fullText(scope);
    pending = { exact: text.slice(start, end), prefix: text.slice(Math.max(0, start - 32), start), suffix: text.slice(end, end + 32) };
    const r = range.getBoundingClientRect(); bar.classList.add('on');
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    let top = r.top - bh - 10; if (top < 10) top = r.bottom + 10;
    bar.style.top = Math.round(top) + 'px'; bar.style.left = Math.round(Math.min(innerWidth - bw - 10, Math.max(10, r.left + r.width / 2 - bw / 2))) + 'px';
  };
  const add = (color) => {
    if (!pending) return null;
    const h = { id: uid(), ...pending, color, note: '', t: Date.now() };
    list.push(h); save(); getSelection().removeAllRanges(); hideBar(); apply(); return h;
  };

  // ---------- sheets: a note, the list ----------
  let back = null;
  const sheet = (html) => {
    if (!back) { back = document.createElement('div'); back.className = 'hl-ui hl-back'; back.innerHTML = '<div class="hl-sheet" role="dialog" aria-modal="true"></div>';
      back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); }); document.body.appendChild(back);
      addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); }); }
    back.firstChild.innerHTML = html; back.classList.add('on');
    const x = back.querySelector('.x'); if (x) x.addEventListener('click', closeSheet);
    return back.firstChild;
  };
  const closeSheet = () => { if (back) back.classList.remove('on'); };
  const short = (t, n = 160) => { t = t.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
  const openNote = (id) => {
    const h = list.find((x) => x.id === id); if (!h) return;
    const s = sheet(`<h3>${h.note ? 'ملاحظتك' : 'أضف ملاحظة'}<button class="x" aria-label="إغلاق">${icon('x', 22)}</button></h3>
      <div class="hl-q ${h.color === 'y' ? 'y' : ''}">${esc(short(h.exact, 300))}</div>
      <textarea class="hl-ta" placeholder="اكتب ملاحظتك على هذا السطر…">${esc(h.note || '')}</textarea>
      <div class="hl-row"><button class="hl-btn ink" data-save>${icon('pen')}احفظ</button><button class="hl-btn ghost" data-del>${icon('trash')}احذف التظليل</button>
        <div class="hl-pick"><button class="o ${h.color !== 'y' ? 'on' : ''}" data-c="o" aria-label="برتقالي"></button><button class="y ${h.color === 'y' ? 'on' : ''}" data-c="y" aria-label="أصفر"></button></div></div>`);
    const ta = s.querySelector('textarea'); setTimeout(() => ta.focus(), 60);
    s.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { h.color = b.dataset.c; s.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); s.querySelector('.hl-q').classList.toggle('y', h.color === 'y'); save(); apply(); }));
    s.querySelector('[data-save]').addEventListener('click', () => { h.note = ta.value.trim(); save(); apply(); closeSheet(); });
    s.querySelector('[data-del]').addEventListener('click', () => { list = list.filter((x) => x !== h); save(); apply(); closeSheet(); });
  };
  const openList = () => {
    const items = list.slice().sort((a, b) => a.t - b.t);
    const s = sheet(`<h3><span>تظليلاتي<small>${items.length ? items.length + (items.length === 1 ? ' تظليل' : ' تظليلات') : ''}</small></span><button class="x" aria-label="إغلاق">${icon('x', 22)}</button></h3>
      ${items.length ? items.map((h) => `<div class="hl-item ${h.color === 'y' ? 'y' : ''}" data-id="${h.id}"><div class="hl-iq">${esc(short(h.exact))}</div>
        <div style="display:flex;gap:4px">${h.missing ? '' : `<button class="hl-btn" data-go="${h.id}" style="padding:9px 14px 11px">${icon('go')}اذهب</button>`}<button class="hl-btn ghost" data-note="${h.id}" aria-label="ملاحظة" style="padding:9px">${icon('note')}</button></div>
        ${h.note ? `<div class="hl-in">${esc(h.note)}</div>` : ''}${h.missing ? '<div class="gone">هذا السطر مو موجود في هذه النسخة</div>' : ''}</div>`).join('')
        : `<p class="hl-empty">حدّد أي سطر في المذكرة واختر «ظلّل»، أو أضف عليه ملاحظة. تنحفظ هنا على جهازك.</p>`}
      ${items.length && cfg.share ? `<div class="hl-row"><button class="hl-btn sig" data-share>${icon('send')}انقلها لجهاز ثاني</button><span style="font-size:14px;color:#78746B;font-weight:600">تنتقل مع رابط مكانك</span></div>` : ''}`);
    s.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { closeSheet(); goTo(b.dataset.go); }));
    s.querySelectorAll('[data-note]').forEach((b) => b.addEventListener('click', () => openNote(b.dataset.note)));
    const sh = s.querySelector('[data-share]'); if (sh) sh.addEventListener('click', () => { closeSheet(); cfg.share(); });
  };
  const flash = (id) => setTimeout(() => $$(`mark.hl-mark[data-id="${id}"]`).forEach((m) => { m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }), 80);
  const goTo = (id) => {
    if (cfg.goTo) { cfg.goTo(id); flash(id); return; }
    const m = $(`mark.hl-mark[data-id="${id}"]`); if (!m) return;
    scrollTo({ top: m.getBoundingClientRect().top + scrollY - innerHeight / 3, behavior: 'smooth' }); flash(id);
  };

  // ---------- carry them to another device: #hl=… ----------
  const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (t) => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; const s = atob(t); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
  const pack = async (obj) => {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) { try { const st = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate')); return 'z' + b64u(new Uint8Array(await new Response(st).arrayBuffer())); } catch (_) {} }
    return 'j' + b64u(raw);
  };
  const unpack = async (t) => {
    const bytes = unb64u(t.slice(1));
    if (t[0] === 'z') { const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')); return JSON.parse(new TextDecoder().decode(await new Response(st).arrayBuffer())); }
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  const hash = async () => list.length ? '#hl=' + await pack(list.map((h) => [h.exact, h.prefix, h.suffix, h.color, h.note || ''])) : '';
  const importFromHash = async () => {
    const m = location.hash.match(/(?:^#|&)hl=([^&]+)/); if (!m) return 0;
    let n = 0;
    try {
      const rows = await unpack(m[1]);
      rows.forEach(([exact, prefix, suffix, color, note]) => {
        const old = list.find((h) => h.exact === exact && h.prefix === prefix);
        if (old) { if (note && !old.note) old.note = note; return; }
        list.push({ id: uid(), exact, prefix, suffix, color: color === 'y' ? 'y' : 'o', note: note || '', t: Date.now() + n }); n++;
      });
    } catch (_) { tip('ما قدرنا نقرأ التظليلات من الرابط. افتحه من متصفح أحدث.'); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    if (n) { save(); tip(`وصلتك ${n === 1 ? 'تظليلة' : n + ' تظليلات'} من رابطك`, true); }
    return n;
  };

  // ---------- a short message at the top ----------
  const tip = (text, list_) => {
    style(); const t = document.createElement('div'); t.className = 'hl-ui hl-tip';
    t.innerHTML = `${icon('pen', 20)}<span>${text}</span>${list_ ? '<button class="hl-btn sig" style="padding:8px 14px 10px;color:#141413">تظليلاتي</button>' : ''}<button aria-label="إغلاق">${icon('x', 18)}</button>`;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('on'));
    const close = () => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); };
    t.querySelector('button:last-child').addEventListener('click', close);
    if (list_) t.querySelector('.hl-btn').addEventListener('click', () => { close(); openList(); });
    setTimeout(close, 9000);
  };

  // ---------- «تظليلاتي» floating button (reading page) ----------
  let fab = null;
  const countFab = () => { if (!fab) return; fab.classList.toggle('hide', !list.length); fab.querySelector('b').textContent = list.length; };

  // ---------- start ----------
  const init = async (opts) => {
    cfg = opts; key = 'ramz-academy:hl:' + opts.key; style(); list = load(); makeBar();
    document.addEventListener('selectionchange', () => { clearTimeout(init.t); init.t = setTimeout(check, 220); });
    addEventListener('scroll', () => { if (bar.classList.contains('on')) hideBar(); }, { passive: true });
    // a click on a highlight opens its note (and must not turn the book's page)
    document.addEventListener('click', (e) => { const m = e.target.closest && e.target.closest('mark.hl-mark'); if (m && !String(getSelection()).trim()) { e.stopPropagation(); e.preventDefault(); openNote(m.dataset.id); } }, true);
    if (opts.fab) { fab = document.createElement('button'); fab.className = 'hl-ui hl-fab hide'; fab.innerHTML = `${icon('list')}تظليلاتي<b>0</b>`; fab.addEventListener('click', openList); document.body.appendChild(fab); }
    await importFromHash();
    apply(); save();
    if (!list.length) { let seen = false; try { seen = !!localStorage.getItem('ramz-academy:hl-tip'); localStorage.setItem('ramz-academy:hl-tip', '1'); } catch (_) {} if (!seen) setTimeout(() => tip('حدّد أي سطر عشان تظلّله أو تضيف عليه ملاحظة'), 2500); }
  };
  return { init, apply, openList, hash, count: () => list.length, all: () => list.slice() };
})();
