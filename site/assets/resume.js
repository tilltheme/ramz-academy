// أكاديمية رمـز — «كمّل من حيث وقفت»: pick up a memo where you left it, here or on another device.
//  · the reading page and the book remember the reader's place on this device, automatically;
//  · every page of the site then offers «كمّل القراءة» right under the header;
//  · «احفظ مكاني» gives a link that opens straight at that place (copy it, send it to yourself, or e-mail it),
//    and a calendar reminder (.ics) that carries the same link, for tonight, tomorrow or next week.
// Self-contained (its own styles), so the book page can use it too. Storage failures never break the page.
window.Resume = (function () {
  const KEY = 'ramz-academy:resume';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
  const set = (s) => { try { localStorage.setItem(KEY, JSON.stringify({ ...s, time: Date.now() })); } catch (_) {} };
  const abs = (root, href) => new URL(root + href, location.href).href;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IC = {
    bookmark: '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>', arrow: '<path d="M20 12H5M11 6l-6 6 6 6"/>', link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', device: '<rect x="2.5" y="4" width="13" height="10" rx="2"/><rect x="15" y="8" width="6.5" height="12" rx="1.6"/><path d="M6 18h6"/>'
  };
  const icon = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  // ---------- styles ----------
  const css = `
  .rz-banner{display:flex;align-items:center;gap:16px;background:#E5DFD3;border-radius:24px;padding:14px 16px 14px 20px;margin:0 0 22px;font-family:'Alan Sans';direction:rtl}
  .rz-banner .ic{width:44px;height:44px;border-radius:14px;background:#141413;color:#FF5A1F;display:grid;place-items:center;flex:none}
  .rz-banner .tx{flex:1;min-width:0;line-height:1.45}
  .rz-banner .tx b{display:block;font-size:16px;font-weight:800;color:#141413}
  .rz-banner .tx span{font-size:14.5px;font-weight:600;color:#78746B}
  .rz-btn{display:inline-flex;align-items:center;gap:9px;padding:11px 18px 13px;border-radius:999px;font:800 15px/1 'Alan Sans';border:0;cursor:pointer;text-decoration:none;white-space:nowrap}
  .rz-btn.ink{background:#141413;color:#F2EFE8}.rz-btn.ink svg{color:#FF5A1F}
  .rz-btn.sig{background:#FF5A1F;color:#141413}
  .rz-btn.ghost{background:transparent;color:#78746B;padding:10px}
  .rz-fab{position:fixed;left:22px;bottom:22px;z-index:60;display:inline-flex;align-items:center;gap:10px;padding:13px 20px 15px;border-radius:999px;background:#141413;color:#F2EFE8;font:800 15px/1 'Alan Sans';border:0;cursor:pointer;box-shadow:0 18px 36px -14px rgba(0,0,0,.55);transition:transform .2s,opacity .3s}
  .rz-fab svg{color:#FF5A1F}.rz-fab:hover{transform:translateY(-2px)}.rz-fab.hide{opacity:0;pointer-events:none;transform:translateY(10px)}
  .rz-back{position:fixed;inset:0;z-index:70;background:rgba(20,20,19,.45);display:flex;align-items:flex-end;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:opacity .25s}
  .rz-back.on{opacity:1;pointer-events:auto}
  .rz-sheet{width:min(540px,100%);background:#F2EFE8;border-radius:30px;padding:26px 26px 22px;font-family:'Alan Sans';direction:rtl;color:#141413;transform:translateY(20px);transition:transform .25s;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}
  .rz-back.on .rz-sheet{transform:none}
  .rz-sheet h3{font-size:26px;font-weight:800;line-height:1.25;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .rz-sheet h3 button{background:none;border:0;cursor:pointer;color:#78746B;padding:6px}
  .rz-at{background:#141413;color:#F2EFE8;border-radius:20px;padding:14px 18px;margin-top:14px;line-height:1.5}
  .rz-at small{display:block;font-size:12.5px;font-weight:800;color:#FF5A1F}
  .rz-at b{font-size:18px;font-weight:800}
  .rz-at span{display:block;font-size:14px;font-weight:600;color:rgba(242,239,232,.62)}
  .rz-ok{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;color:#78746B;margin-top:12px}
  .rz-ok svg{color:#FF5A1F}
  .rz-h{font-size:14px;font-weight:800;color:#78746B;margin:18px 0 8px}
  .rz-row{display:flex;flex-wrap:wrap;gap:8px}
  .rz-row .rz-btn{background:#E5DFD3;color:#141413}.rz-row .rz-btn svg{color:#FF5A1F}
  .rz-row .rz-btn.done{background:#FF5A1F}.rz-row .rz-btn.done svg{color:#141413}
  .rz-toast{position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:22px;transform:translateY(30px);z-index:65;display:flex;align-items:center;gap:14px;padding:12px 14px 12px 20px;border-radius:999px;background:#141413;color:#F2EFE8;font:700 15px 'Alan Sans';direction:rtl;box-shadow:0 18px 36px -14px rgba(0,0,0,.55);opacity:0;transition:opacity .3s,transform .3s;max-width:calc(100% - 32px)}
  .rz-toast.on{opacity:1;transform:none}
  .rz-toast b{color:#FF5A1F;font-weight:800}
  .rz-toast .rz-btn.ghost{color:rgba(242,239,232,.6)}
  @media (max-width:600px){.rz-banner{flex-wrap:wrap}.rz-banner .rz-btn{width:100%;justify-content:center}.rz-fab{left:14px;bottom:14px}.rz-toast{border-radius:22px;flex-wrap:wrap}}`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };

  // ---------- «كمّل القراءة» under the header of any page ----------
  const banner = (afterEl, root) => {
    const s = get(); if (!s) return; style();
    const b = document.createElement('div'); b.className = 'rz-banner';
    b.innerHTML = `<span class="ic">${icon('bookmark', 22)}</span><div class="tx"><b>كمّل من حيث وقفت</b><span>${esc(s.label)} · ${esc(s.partName)} · مذكرة «${esc(s.memoTitle)}»</span></div>
      <a class="rz-btn ink" href="${esc(root + s.href)}">كمّل القراءة${icon('arrow', 18)}</a>`;
    afterEl.insertAdjacentElement('afterend', b);
  };

  // ---------- a small message at the bottom of the page ----------
  const toast = (html, actionLabel, onAction) => {
    style();
    const t = document.createElement('div'); t.className = 'rz-toast';
    t.innerHTML = `<span>${html}</span><button class="rz-btn sig">${actionLabel}</button><button class="rz-btn ghost" aria-label="إغلاق">${icon('x', 18)}</button>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('on'));
    const close = () => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); };
    t.children[1].addEventListener('click', () => { onAction(); close(); });
    t.children[2].addEventListener('click', close);
    setTimeout(close, 12000);
  };

  // ---------- a calendar reminder that carries the resume link ----------
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = (d, utc) => utc ? `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
                                : `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const icsText = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const when = (k) => { const d = new Date(); d.setSeconds(0, 0);
    if (k === 'tonight') { if (d.getHours() >= 20) d.setHours(d.getHours() + 1, 0); else d.setHours(21, 0); }
    else { d.setDate(d.getDate() + (k === 'tomorrow' ? 1 : 7)); d.setHours(21, 0); }
    return d; };
  const reminder = (s, link, k) => {
    const start = when(k), end = new Date(start.getTime() + 30 * 60000), title = `كمّل قراءة مذكرة «${s.memoTitle}»`;
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ramz Academy//Resume//AR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@ramz-academy`, `DTSTAMP:${stamp(new Date(), true)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(`وقفت عند: ${s.label} — ${s.partName}\n${link}`)}`, `URL:${link}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(title)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'ramz-academy-reminder.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    return start;
  };

  // ---------- «احفظ مكاني» ----------
  const mount = ({ root, state, fab = true, showAfter = null }) => {   // the link also carries this reader's highlights, when there are any
    style();
    const back = document.createElement('div'); back.className = 'rz-back';
    back.innerHTML = `<div class="rz-sheet" role="dialog" aria-modal="true" aria-label="احفظ مكانك"></div>`;
    document.body.appendChild(back);
    const sheet = back.firstChild;
    const close = () => back.classList.remove('on');
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    const open = async () => {
      const s = state(); set(s);
      const hl = window.Highlights ? Highlights.count() : 0;
      const link = abs(root, s.href) + (hl ? await Highlights.hash() : '');
      sheet.innerHTML = `<h3>احفظ مكانك<button aria-label="إغلاق">${icon('x', 22)}</button></h3>
        <div class="rz-at"><small>وقفت عند</small><b>${esc(s.label)}</b><span>${esc(s.partName)} · مذكرة «${esc(s.memoTitle)}»</span></div>
        <div class="rz-ok">${icon('check', 18)}حفظناه على هذا الجهاز، وأول ما ترجع للأكاديمية بنعرض لك «كمّل من حيث وقفت».</div>
        ${hl ? `<div class="rz-ok">${icon('check', 18)}الرابط يحمل معه تظليلاتك وملاحظاتك (${hl})، وتطلع لك كلها لما تفتحه من جهاز ثاني.</div>` : ''}
        <div class="rz-h">بتكمل من جهاز ثاني؟ خذ معك رابط مكانك</div>
        <div class="rz-row">
          <button class="rz-btn" data-a="copy">${icon('link', 18)}<span>انسخ الرابط</span></button>
          <button class="rz-btn" data-a="send">${icon('send', 18)}<span>أرسله لنفسك</span></button>
          <a class="rz-btn" data-a="mail" href="mailto:?subject=${encodeURIComponent(`كمّل قراءة مذكرة «${s.memoTitle}»`)}&body=${encodeURIComponent(`وقفت عند: ${s.label} — ${s.partName}\n${link}`)}">${icon('mail', 18)}<span>بالإيميل</span></a>
        </div>
        <div class="rz-h">ذكّرني أكمل (تنبيه في التقويم ومعه الرابط)</div>
        <div class="rz-row">
          <button class="rz-btn" data-r="tonight">${icon('bell', 18)}<span>الليلة</span></button>
          <button class="rz-btn" data-r="tomorrow">${icon('bell', 18)}<span>بكرة</span></button>
          <button class="rz-btn" data-r="week">${icon('bell', 18)}<span>بعد أسبوع</span></button>
        </div>`;
      sheet.querySelector('h3 button').addEventListener('click', close);
      const done = (btn, txt) => { btn.classList.add('done'); btn.lastChild.textContent = txt; };
      sheet.querySelector('[data-a="copy"]').addEventListener('click', async (e) => { const b = e.currentTarget;
        try { await navigator.clipboard.writeText(link); done(b, 'تم النسخ'); } catch (_) { done(b, 'انسخه من شريط العنوان'); } });
      sheet.querySelector('[data-a="send"]').addEventListener('click', async (e) => { const b = e.currentTarget, text = `كمّل قراءة مذكرة «${s.memoTitle}» — وقفت عند: ${s.label}`;
        if (navigator.share) { try { await navigator.share({ title: 'أكاديمية رمـز', text, url: link }); done(b, 'تم'); return; } catch (_) { return; } }
        open_(`https://wa.me/?text=${encodeURIComponent(text + '\n' + link)}`); done(b, 'فتحنا واتساب'); });
      sheet.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        const d = reminder(s, link, b.dataset.r); done(b, `${b.dataset.r === 'tonight' ? 'الليلة' : b.dataset.r === 'tomorrow' ? 'بكرة' : 'بعد أسبوع'} ${pad(d.getHours())}:${pad(d.getMinutes())}`); }));
      back.classList.add('on');
    };
    const open_ = (u) => window.open(u, '_blank', 'noopener');
    let btn = null;
    if (fab) {
      btn = document.createElement('button'); btn.className = 'rz-fab' + (showAfter ? ' hide' : ''); btn.innerHTML = `${icon('bookmark', 20)}احفظ مكاني`;
      btn.addEventListener('click', open); document.body.appendChild(btn);
      if (showAfter) { const io = new IntersectionObserver((es) => es.forEach((e) => btn.classList.toggle('hide', !(e.isIntersecting || e.boundingClientRect.top < 0)))); io.observe(showAfter); }
    }
    return { open, save: () => set(state()), button: btn };
  };

  return { get, set, banner, toast, mount, reminder };
})();
