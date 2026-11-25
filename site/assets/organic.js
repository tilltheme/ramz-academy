// RAMZ WEEKLY — «المسار» v2: the flowing shape from the client's second sketch.
// A narrow column at the top right, a soft diagonal shoulder that widens to the left,
// a round wide base, and a gentle waist on the right that opens a small pocket at the bottom-right.
window.RamzOrganic = {
  layout(W, H) {
    const m = Math.round(H * 0.068);           // outer margin
    const yT = m, yB = H - m;
    const xL = 440, xR = W - 88;               // column left / right
    const xB = 96, xW = W - 224;               // base left / right edge after the waist
    const yShoulderTop = Math.round(H * 0.36); // column left edge turns into the shoulder
    const yShoulderBot = Math.round(H * 0.62); // shoulder reaches the base's left edge
    const yWaistTop = Math.round(H * 0.58), yWaistBot = Math.round(H * 0.70);
    const Rtl = 120, Rtr = 70, Rbr = 140, Rbl = Math.round(H * 0.17);
    const d = [
      `M${xL + Rtl},${yT}`,
      `L${xR - Rtr},${yT}`,
      `A${Rtr},${Rtr} 0 0 1 ${xR},${yT + Rtr}`,
      `L${xR},${yWaistTop}`,
      `C${xR},${yWaistTop + (yWaistBot - yWaistTop) * 0.55} ${xW},${yWaistBot - (yWaistBot - yWaistTop) * 0.55} ${xW},${yWaistBot}`,
      `L${xW},${yB - Rbr}`,
      `A${Rbr},${Rbr} 0 0 1 ${xW - Rbr},${yB}`,
      `L${xB + Rbl},${yB}`,
      `A${Rbl},${Rbl} 0 0 1 ${xB},${yB - Rbl}`,
      `L${xB},${yShoulderBot}`,
      `C${xB},${yShoulderBot - (yShoulderBot - yShoulderTop) * 0.55} ${xL},${yShoulderTop + (yShoulderBot - yShoulderTop) * 0.45} ${xL},${yShoulderTop}`,
      `L${xL},${yT + Rtl}`,
      `A${Rtl},${Rtl} 0 0 1 ${xL + Rtl},${yT}`,
      'Z'
    ].join(' ');
    return {
      W, H, m, yT, yB, xL, xR, xB, xW, yShoulderTop, yShoulderBot, yWaistTop, yWaistBot, d,
      // where things go
      pocketTitle: { x: m, y: yT, w: xL - m - 36, h: yShoulderTop - yT + 40 },        // top-left (3 strokes)
      column:      { x: xL, y: yT, w: xR - xL, h: yShoulderTop - yT },                 // two photo cards
      base:        { x: xB, y: yShoulderBot - 10, w: xW - xB, h: yB - yShoulderBot },   // two rows of achievements
      pocketBR:    { x: xW, y: yWaistBot, w: W - xW, h: yB - yWaistBot }               // bottom-right stroke
    };
  },

  // Smooth closed path through a polygon: every corner becomes one cubic curve that starts and ends
  // d px away from the vertex. k < 0.55 pulls the handles toward the vertex → a softer, squircle-like
  // turn with no visible "start" of the curve (what reads as professional rather than drawn with a compass).
  smoothPoly(pts, k = 0.4) {
    const n = pts.length;
    const seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    // clamp each corner so neighbouring corners never overlap on a shared edge
    const ds = pts.map((v, i) => v[2]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, len = seg(pts[i], pts[j]);
      if (ds[i] + ds[j] > len) { const f = len / (ds[i] + ds[j]); ds[i] *= f; ds[j] *= f; }
    }
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[(i - 1 + n) % n], c = pts[i], q = pts[(i + 1) % n], r = ds[i];
      const li = seg(p, c), lo = seg(c, q);
      const vi = [(c[0] - p[0]) / li, (c[1] - p[1]) / li], vo = [(q[0] - c[0]) / lo, (q[1] - c[1]) / lo];
      const S = [c[0] - vi[0] * r, c[1] - vi[1] * r], E = [c[0] + vo[0] * r, c[1] + vo[1] * r];
      const C1 = [c[0] - vi[0] * r * k, c[1] - vi[1] * r * k], C2 = [c[0] + vo[0] * r * k, c[1] + vo[1] * r * k];
      const f = (v) => v[0].toFixed(1) + ',' + v[1].toFixed(1);
      d += (i ? ' L' : 'M') + f(S) + ' C' + f(C1) + ' ' + f(C2) + ' ' + f(E);
    }
    return d + ' Z';
  },

  // v3 — bigger shape (52 px frame), every turn softened: same silhouette as the client's sketch
  layout3(W, H) {
    const m = 52;
    const yT = m, yB = H - m;
    const xL = 400, xR = W - m, xB = m, xW = W - 220;
    const yS1 = Math.round(H * 0.333), yS2 = Math.round(H * 0.611);   // shoulder: column → base
    const yW1 = Math.round(H * 0.518), yW2 = Math.round(H * 0.667);   // waist on the right
    // [x, y, corner distance]
    const pts = [
      [xL, yT, 170],     // column top-left
      [xR, yT, 170],     // column top-right
      [xR, yW1, 120],    // waist starts
      [xW, yW2, 120],    // waist ends (inner turn)
      [xW, yB, 190],     // base bottom-right
      [xB, yB, 250],     // base bottom-left: the big round heel
      [xB, yS2, 170],    // shoulder starts
      [xL, yS1, 170]     // shoulder ends (inner turn)
    ];
    return {
      W, H, m, yT, yB, xL, xR, xB, xW, yS1, yS2, yW1, yW2, pts,
      d: this.smoothPoly(pts, 0.38),
      pocketTitle: { x: m + 6, y: yT, w: xL - m - 50, h: yS1 - yT + 30 },
      column:      { x: xL, y: yT, w: xR - xL, h: yS1 - yT + 40 },
      base:        { x: xB, y: yS2 - 20, w: xW - xB, h: yB - yS2 },
      pocketBR:    { x: xW, y: yW2, w: W - xW, h: yB - yW2 }
    };
  },

  // ---------- Carousel: one path through every slide ----------
  // A 130 px band (BAND) leaves each slide on the right edge and enters the next one on the left,
  // so the shapes join up as the follower swipes. Corners at the canvas edge stay square (d = 0).
  BAND: [300, 430],

  // Cover = v3 silhouette + a bridge out of the right edge
  coverPts(W, H) {
    const m = 52, [s0, s1] = this.BAND;
    const xL = 400, xR = W - m, xB = m, xW = W - 220, yT = m, yB = H - m;
    const yS1 = Math.round(H * 0.333), yS2 = Math.round(H * 0.611);
    const yW1 = Math.round(H * 0.53), yW2 = Math.round(H * 0.675);
    return [
      [xL, yT, 170], [xR, yT, 170],
      [xR, s0, 40], [W, s0, 0], [W, s1, 0], [xR, s1, 40],
      [xR, yW1, 110], [xW, yW2, 110], [xW, yB, 190], [xB, yB, 250],
      [xB, yS2, 170], [xL, yS1, 170]
    ];
  },

  // Achievement slide: a tall column on the left (portrait photo), a pocket top-right (number + title),
  // the band entering on the left and leaving on the right
  achievementPts(W, H, last) {
    const m = 52, [s0, s1] = this.BAND, xC = 640;
    const pts = [[m, m, 170], [xC, m, 130], [xC, s0, 110]];
    if (!last) pts.push([W, s0, 0], [W, s1, 0], [W - m, s1, 40]);
    else pts.push([W - m, s0, 140]);
    pts.push([W - m, H - m, 200], [m, H - m, 240], [m, s1, 40], [0, s1, 0], [0, s0, 0], [m, s0, 40]);
    return pts;
  },

  // Mirror a clockwise outline left↔right (still clockwise)
  mirror(pts, W) { return pts.map(([x, y, d]) => [W - x, y, d]).reverse(); },

  // Closing slide: the cover's mirror image — the path ends here
  closingPts(W, H) { return this.mirror(this.coverPts(W, H), W); }
};
