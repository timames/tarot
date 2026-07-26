// SVG Card Art Generator - Mystical geometric line art for all 78 tarot cards
const CARD_ART = (() => {
  const S = (w, h, content) =>
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${content}</svg>`;

  const c1 = '#5a3a1a'; // dark brown
  const c2 = '#8a6d3b'; // gold-brown
  const c3 = '#b8960f'; // bright gold
  const c4 = '#3a2a5c'; // deep purple
  const c5 = '#6b4a8a'; // medium purple
  const c6 = '#c44';    // red accent
  const c7 = '#2a6a5a'; // teal
  const cW = '#c45a20'; // wands/fire orange
  const cC = '#2a6aaa'; // cups/water blue
  const cS = '#7a7a8a'; // swords/air silver
  const cP = '#8a7a2a'; // pentacles/earth gold

  // Helper shapes
  const star5 = (cx, cy, r, fill) => {
    let pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const b = ((i * 72) + 36 - 90) * Math.PI / 180;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      pts.push(`${cx + r * 0.4 * Math.cos(b)},${cy + r * 0.4 * Math.sin(b)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="0.9"/>`;
  };

  const circle = (cx, cy, r, stroke, fill = 'none', sw = 1.5) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  const line = (x1, y1, x2, y2, stroke, sw = 1.5) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;

  const rect = (x, y, w, h, stroke, fill = 'none', sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="2"/>`;

  const tri = (cx, cy, r, stroke, fill = 'none', up = true) => {
    const d = up ? -1 : 1;
    const pts = [
      `${cx},${cy + d * -r}`,
      `${cx - r * 0.866},${cy + d * r * 0.5}`,
      `${cx + r * 0.866},${cy + d * r * 0.5}`
    ];
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  };

  const crescent = (cx, cy, r, stroke) =>
    `<path d="M${cx - r * 0.2},${cy - r} A${r},${r} 0 1,1 ${cx - r * 0.2},${cy + r} A${r * 0.7},${r * 0.7} 0 1,0 ${cx - r * 0.2},${cy - r}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;

  const rays = (cx, cy, r1, r2, n, stroke) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i * 360 / n) * Math.PI / 180;
      s += line(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a), stroke, 1.2);
    }
    return s;
  };

  const pentacle = (cx, cy, r, stroke) => {
    let pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return circle(cx, cy, r, stroke) +
      `<polygon points="${[pts[0], pts[2], pts[4], pts[1], pts[3]].map(p => p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
  };

  const wand = (x, y, h, stroke) =>
    `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="${y - h}" r="3" fill="${stroke}" opacity="0.7"/>`;

  const cup = (cx, cy, size, stroke) =>
    `<path d="M${cx - size},${cy - size} Q${cx - size},${cy + size} ${cx},${cy + size * 1.2} Q${cx + size},${cy + size} ${cx + size},${cy - size} Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>` +
    `<line x1="${cx}" y1="${cy + size * 1.2}" x2="${cx}" y2="${cy + size * 1.8}" stroke="${stroke}" stroke-width="1.5"/>` +
    `<line x1="${cx - size * 0.6}" y1="${cy + size * 1.8}" x2="${cx + size * 0.6}" y2="${cy + size * 1.8}" stroke="${stroke}" stroke-width="1.5"/>`;

  const sword = (cx, cy, h, stroke) =>
    `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - h}" stroke="${stroke}" stroke-width="2"/>` +
    `<line x1="${cx - 8}" y1="${cy - h * 0.25}" x2="${cx + 8}" y2="${cy - h * 0.25}" stroke="${stroke}" stroke-width="2"/>` +
    `<polygon points="${cx},${cy - h} ${cx - 2},${cy - h + 6} ${cx + 2},${cy - h + 6}" fill="${stroke}"/>`;

  const coin = (cx, cy, r, stroke) =>
    circle(cx, cy, r, stroke) + circle(cx, cy, r * 0.7, stroke, 'none', 1) + star5(cx, cy, r * 0.45, stroke);

  // Wand arrangement patterns for pip cards
  const wandPips = (n) => {
    const W = 120, H = 160;
    let s = '';
    const positions = {
      1: [[60, 130, 80]],
      2: [[40, 130, 55], [80, 130, 55]],
      3: [[30, 130, 50], [60, 130, 60], [90, 130, 50]],
      4: [[25, 130, 55], [45, 130, 65], [75, 130, 65], [95, 130, 55]],
      5: [[20, 130, 50], [40, 130, 60], [60, 130, 70], [80, 130, 60], [100, 130, 50]],
      6: [[20, 130, 45], [38, 130, 55], [56, 130, 65], [74, 130, 55], [92, 130, 45], [56, 130, 35]],
      7: [[18, 135, 45], [36, 135, 55], [54, 135, 65], [72, 135, 55], [90, 135, 45], [42, 135, 35], [78, 135, 30]],
      8: [[15, 140, 40], [30, 140, 50], [45, 140, 60], [60, 140, 70], [75, 140, 60], [90, 140, 50], [105, 140, 40], [60, 140, 35]],
      9: [[15, 140, 38], [30, 140, 48], [45, 140, 58], [60, 140, 68], [75, 140, 58], [90, 140, 48], [105, 140, 38], [38, 140, 30], [82, 140, 30]],
      10: [[12, 140, 36], [26, 140, 46], [40, 140, 56], [54, 140, 66], [68, 140, 56], [82, 140, 46], [96, 140, 36], [108, 140, 30], [40, 140, 30], [80, 140, 30]]
    };
    (positions[n] || []).forEach(([x, y, h]) => { s += wand(x, y, h, cW); });
    // Fire element symbol
    s += `<path d="M55,20 Q60,5 65,20 Q70,10 60,0 Q50,10 55,20Z" fill="${cW}" opacity="0.3"/>`;
    return S(W, H, s);
  };

  const cupPips = (n) => {
    const W = 120, H = 160;
    let s = '';
    const sz = n <= 3 ? 14 : n <= 6 ? 11 : 9;
    const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : 5;
    const rows = Math.ceil(n / cols);
    let idx = 0;
    for (let r = 0; r < rows && idx < n; r++) {
      const inRow = Math.min(cols, n - idx);
      const startX = 60 - (inRow - 1) * (sz + 6) / 2;
      for (let c = 0; c < inRow && idx < n; c++) {
        s += cup(startX + c * (sz + 6), 50 + r * (sz * 2.5 + 4), sz, cC);
        idx++;
      }
    }
    // Water ripple
    s += `<path d="M20,145 Q40,138 60,145 Q80,152 100,145" fill="none" stroke="${cC}" stroke-width="1" opacity="0.4"/>`;
    s += `<path d="M25,152 Q45,145 65,152 Q85,159 95,152" fill="none" stroke="${cC}" stroke-width="1" opacity="0.3"/>`;
    return S(W, H, s);
  };

  const swordPips = (n) => {
    const W = 120, H = 160;
    let s = '';
    const h = n <= 3 ? 55 : n <= 6 ? 45 : 38;
    const spacing = Math.min(22, (W - 20) / n);
    const startX = 60 - (n - 1) * spacing / 2;
    for (let i = 0; i < n; i++) {
      const x = startX + i * spacing;
      s += sword(x, 130, h, cS);
    }
    // Wind swirl
    s += `<path d="M20,145 Q50,135 80,145 Q100,150 110,140" fill="none" stroke="${cS}" stroke-width="1" opacity="0.3"/>`;
    return S(W, H, s);
  };

  const pentPips = (n) => {
    const W = 120, H = 160;
    let s = '';
    const r = n <= 3 ? 16 : n <= 6 ? 13 : 11;
    const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    let idx = 0;
    for (let row = 0; row < rows && idx < n; row++) {
      const inRow = Math.min(cols, n - idx);
      const startX = 60 - (inRow - 1) * (r * 2 + 4) / 2;
      for (let c = 0; c < inRow && idx < n; c++) {
        s += coin(startX + c * (r * 2 + 4), 30 + r + row * (r * 2 + 6), r, cP);
        idx++;
      }
    }
    return S(W, H, s);
  };

  // Major Arcana - unique illustrations
  const major = {
    "The Fool": S(120, 160, `
      ${circle(60, 40, 18, c3)}
      ${rays(60, 40, 20, 28, 8, c3)}
      <path d="M45,65 Q50,55 60,58 Q70,55 75,65 L72,110 Q60,120 48,110 Z" fill="none" stroke="${c2}" stroke-width="1.5"/>
      <path d="M40,115 L30,145" stroke="${c2}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M80,115 L90,145" stroke="${c2}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="85" cy="95" r="8" fill="none" stroke="${c3}" stroke-width="1"/>
      <path d="M20,148 Q60,135 100,148" fill="none" stroke="${c2}" stroke-width="1" opacity="0.5"/>
      ${star5(95, 25, 6, c3)}
      <path d="M50,58 L42,45 L48,48" fill="none" stroke="${c2}" stroke-width="1.2"/>
    `),
    "The Magician": S(120, 160, `
      <path d="M60,8 L60,8" stroke="${c3}" stroke-width="2"/>
      ${circle(60, 12, 5, c3)}
      ${line(55, 12, 65, 12, c3)}
      ${line(60, 7, 60, 17, c3)}
      <path d="M45,30 Q50,22 60,25 Q70,22 75,30 L72,95 Q60,100 48,95 Z" fill="none" stroke="${c2}" stroke-width="1.5"/>
      ${line(30, 55, 90, 55, c3, 1.5)}
      <rect x="25" y="110" width="18" height="12" fill="none" stroke="${cW}" stroke-width="1.2" rx="1"/>
      ${cup(52, 118, 6, cC)}
      ${sword(75, 125, 18, cS)}
      ${coin(100, 118, 7, cP)}
      ${circle(60, 60, 35, c5, 'none', 0.8)}
      <text x="60" y="10" text-anchor="middle" font-size="10" fill="${c3}">&#x221E;</text>
    `),
    "The High Priestess": S(120, 160, `
      ${crescent(60, 30, 18, c5)}
      <path d="M48,50 Q50,42 60,45 Q70,42 72,50 L70,110 Q60,118 50,110 Z" fill="none" stroke="${c5}" stroke-width="1.5"/>
      ${line(45, 55, 45, 140, c4, 2)}
      ${line(75, 55, 75, 140, c4, 2)}
      <text x="45" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="${c4}">B</text>
      <text x="75" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="${c5}">J</text>
      <path d="M30,130 Q60,115 90,130 Q60,145 30,130Z" fill="none" stroke="${c5}" stroke-width="1" opacity="0.5"/>
      ${circle(60, 85, 12, c5)}
      <path d="M54,82 L60,74 L66,82 L60,90 Z" fill="none" stroke="${c3}" stroke-width="1"/>
    `),
    "The Empress": S(120, 160, `
      ${star5(60, 22, 10, c3)}
      <path d="M40,40 Q50,32 60,36 Q70,32 80,40 L76,100 Q60,115 44,100 Z" fill="none" stroke="${c7}" stroke-width="1.5"/>
      <path d="M35,100 Q45,120 60,125 Q75,120 85,100" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M25,135 Q40,125 50,130 Q60,135 70,130 Q80,125 95,135" fill="none" stroke="${c7}" stroke-width="1"/>
      <path d="M30,142 Q45,132 55,137 Q65,142 75,137 Q85,132 100,142" fill="none" stroke="${c7}" stroke-width="1" opacity="0.6"/>
      ${circle(60, 72, 10, c3, 'none', 1)}
      <text x="60" y="76" text-anchor="middle" font-size="12" fill="${c3}">&#x2640;</text>
    `),
    "The Emperor": S(120, 160, `
      <path d="M42,25 L60,10 L78,25 L72,28 L60,18 L48,28 Z" fill="${c3}" opacity="0.8"/>
      <path d="M40,35 Q50,28 60,32 Q70,28 80,35 L78,95 Q60,108 42,95 Z" fill="none" stroke="${c6}" stroke-width="1.5"/>
      <rect x="35" y="95" width="50" height="55" fill="none" stroke="${c2}" stroke-width="1.5" rx="3"/>
      ${line(35, 105, 85, 105, c2, 1)}
      <path d="M47,38 L47,50 L53,50" fill="none" stroke="${c3}" stroke-width="2"/>
      <path d="M67,38 L73,38 L73,50" fill="none" stroke="${c3}" stroke-width="2"/>
      ${circle(60, 70, 8, c6, 'none', 1)}
      <text x="60" y="74" text-anchor="middle" font-size="10" fill="${c6}">&#x2642;</text>
    `),
    "The Hierophant": S(120, 160, `
      <path d="M55,10 L60,5 L65,10 L60,12 Z" fill="${c3}"/>
      ${line(60, 12, 60, 25, c3, 2)}
      ${line(52, 20, 68, 20, c3, 2)}
      <path d="M42,32 Q50,25 60,28 Q70,25 78,32 L75,90 Q60,98 45,90 Z" fill="none" stroke="${c5}" stroke-width="1.5"/>
      ${line(48, 55, 72, 55, c3, 1)}
      ${line(48, 62, 72, 62, c3, 1)}
      <path d="M35,105 L50,100 L60,95 L70,100 L85,105" fill="none" stroke="${c2}" stroke-width="1.2"/>
      ${circle(40, 125, 4, c2)}
      ${circle(80, 125, 4, c2)}
      <path d="M40,130 L40,145" stroke="${c2}" stroke-width="1.5"/>
      <path d="M80,130 L80,145" stroke="${c2}" stroke-width="1.5"/>
      ${star5(60, 75, 8, c3)}
    `),
    "The Lovers": S(120, 160, `
      ${rays(60, 25, 10, 22, 12, c3)}
      ${circle(60, 25, 10, c3, 'none', 1.5)}
      <path d="M30,55 Q35,45 42,50 L42,100 Q35,108 30,100 Z" fill="none" stroke="${c5}" stroke-width="1.2"/>
      <path d="M78,55 Q83,45 90,50 L90,100 Q83,108 78,100 Z" fill="none" stroke="${c6}" stroke-width="1.2"/>
      <path d="M42,75 Q60,60 78,75" fill="none" stroke="${c3}" stroke-width="1.5"/>
      <path d="M50,120 L60,108 L70,120 L60,132 Z" fill="none" stroke="${c6}" stroke-width="1.5"/>
      ${circle(60, 120, 18, c5, 'none', 0.8)}
      <path d="M45,145 Q60,138 75,145" fill="none" stroke="${c3}" stroke-width="1" opacity="0.5"/>
    `),
    "The Chariot": S(120, 160, `
      ${star5(60, 18, 8, c3)}
      <path d="M45,30 Q50,24 60,27 Q70,24 75,30 L73,70 Q60,75 47,70 Z" fill="none" stroke="${c2}" stroke-width="1.5"/>
      <rect x="30" y="80" width="60" height="40" fill="none" stroke="${c2}" stroke-width="1.5" rx="3"/>
      ${circle(35, 128, 10, c2)}
      ${circle(85, 128, 10, c2)}
      ${line(35, 118, 35, 80, c2, 1.5)}
      ${line(85, 118, 85, 80, c2, 1.5)}
      <path d="M30,80 L20,90 L20,100" fill="none" stroke="${c4}" stroke-width="1.5"/>
      <path d="M90,80 L100,90 L100,100" fill="none" stroke="${c5}" stroke-width="1.5"/>
      ${circle(60, 95, 6, c3)}
    `),
    "Strength": S(120, 160, `
      ${circle(60, 12, 5, c3)}
      ${line(55, 12, 65, 12, c3)}
      ${line(60, 7, 60, 17, c3)}
      <path d="M48,30 Q55,22 62,28 Q70,22 75,30 L72,75 Q60,82 48,75 Z" fill="none" stroke="${c6}" stroke-width="1.5"/>
      <path d="M35,90 Q45,80 55,85 Q60,88 65,85 Q75,80 85,90 Q88,100 80,108 Q70,118 60,115 Q50,118 40,108 Q32,100 35,90Z" fill="none" stroke="${c3}" stroke-width="1.5"/>
      ${circle(50, 98, 2, c3, c3)}
      ${circle(70, 98, 2, c3, c3)}
      <path d="M45,106 Q60,114 75,106" fill="none" stroke="${c3}" stroke-width="1.2"/>
      <path d="M48,75 Q55,85 60,82" fill="none" stroke="${c6}" stroke-width="1.2"/>
      <path d="M72,75 Q65,85 60,82" fill="none" stroke="${c6}" stroke-width="1.2"/>
      <path d="M30,130 Q60,120 90,130" fill="none" stroke="${c3}" stroke-width="1" opacity="0.4"/>
    `),
    "The Hermit": S(120, 160, `
      ${rays(70, 18, 4, 12, 6, c3)}
      ${circle(70, 18, 4, c3, c3)}
      <path d="M62,28 L55,32 L55,40" fill="none" stroke="${c2}" stroke-width="1.5"/>
      ${circle(52, 48, 8, c2)}
      <path d="M44,55 Q48,50 52,54 Q56,50 60,55 L58,110 Q52,115 46,110 Z" fill="none" stroke="${c2}" stroke-width="1.5"/>
      <path d="M46,110 L40,145" stroke="${c2}" stroke-width="1.5"/>
      <path d="M58,110 L60,145" stroke="${c2}" stroke-width="1.5"/>
      ${line(65, 55, 68, 145, c2, 2)}
      <path d="M25,148 Q50,140 75,148" fill="none" stroke="${c2}" stroke-width="1" opacity="0.4"/>
    `),
    "Wheel of Fortune": S(120, 160, `
      ${circle(60, 80, 45, c3, 'none', 1.5)}
      ${circle(60, 80, 35, c5, 'none', 1)}
      ${circle(60, 80, 5, c3, c3)}
      ${line(60, 35, 60, 45, c3, 1.5)}
      ${line(60, 115, 60, 125, c3, 1.5)}
      ${line(15, 80, 25, 80, c3, 1.5)}
      ${line(95, 80, 105, 80, c3, 1.5)}
      <path d="M60,35 L55,30 L60,25 L65,30 Z" fill="${c3}"/>
      <text x="60" y="65" text-anchor="middle" font-size="9" fill="${c5}">T</text>
      <text x="78" y="83" text-anchor="middle" font-size="9" fill="${c5}">A</text>
      <text x="60" y="100" text-anchor="middle" font-size="9" fill="${c5}">R</text>
      <text x="42" y="83" text-anchor="middle" font-size="9" fill="${c5}">O</text>
      ${star5(30, 30, 5, c3)}
      ${star5(90, 30, 5, c3)}
      ${star5(30, 130, 5, c3)}
      ${star5(90, 130, 5, c3)}
    `),
    "Justice": S(120, 160, `
      ${circle(60, 28, 10, c3)}
      <path d="M44,42 Q52,36 60,40 Q68,36 76,42 L73,90 Q60,96 47,90 Z" fill="none" stroke="${c2}" stroke-width="1.5"/>
      ${line(20, 55, 100, 55, c3, 2)}
      ${line(60, 40, 60, 55, c3, 2)}
      <path d="M15,55 Q20,70 35,70 Q50,70 55,55" fill="none" stroke="${c3}" stroke-width="1.5"/>
      <path d="M65,55 Q70,70 85,70 Q100,70 105,55" fill="none" stroke="${c3}" stroke-width="1.5"/>
      ${line(60, 96, 60, 135, c2, 2)}
      ${line(45, 135, 75, 135, c2, 2)}
      ${sword(60, 42, 30, c2)}
    `),
    "The Hanged Man": S(120, 160, `
      ${line(30, 15, 90, 15, c2, 2.5)}
      ${line(60, 15, 60, 40, c2, 1.5)}
      ${circle(60, 55, 10, c5)}
      <path d="M50,65 Q55,62 60,64 Q65,62 70,65 L68,105 Q60,110 52,105 Z" fill="none" stroke="${c5}" stroke-width="1.5"/>
      <path d="M52,105 L45,125 L55,125" fill="none" stroke="${c5}" stroke-width="1.5"/>
      <path d="M68,105 L75,95 L82,95" fill="none" stroke="${c5}" stroke-width="1.5"/>
      ${line(60, 40, 55, 65, c2, 1)}
      ${line(60, 40, 65, 65, c2, 1)}
      ${rays(60, 55, 12, 18, 8, c3)}
      <path d="M30,140 Q60,130 90,140" fill="none" stroke="${c2}" stroke-width="1" opacity="0.3"/>
    `),
    "Death": S(120, 160, `
      ${circle(60, 35, 15, c2)}
      <path d="M50,28 L50,25 Q55,20 60,25 Q65,20 70,25 L70,28" fill="none" stroke="${c2}" stroke-width="1.2"/>
      ${circle(53, 32, 2.5, c1, 'none', 1.5)}
      ${circle(67, 32, 2.5, c1, 'none', 1.5)}
      <path d="M55,38 L60,40 L65,38" fill="none" stroke="${c1}" stroke-width="1"/>
      <path d="M42,50 L42,100 M78,50 L78,100" stroke="${c2}" stroke-width="1.5"/>
      ${line(42, 70, 78, 70, c2, 1.5)}
      <path d="M42,100 L35,130 M42,100 L50,130" stroke="${c2}" stroke-width="1.5"/>
      <path d="M78,100 L70,130 M78,100 L85,130" stroke="${c2}" stroke-width="1.5"/>
      <path d="M25,60 L42,70 M78,70 L95,60" stroke="${c2}" stroke-width="1.5"/>
      ${star5(60, 145, 6, c3)}
      <path d="M88,55 Q95,50 100,55 L98,65 Q95,68 90,65 Z" fill="none" stroke="${c2}" stroke-width="1.2"/>
    `),
    "Temperance": S(120, 160, `
      ${circle(60, 28, 10, c3)}
      <path d="M46,40 Q53,35 60,38 Q67,35 74,40 L72,85 Q60,92 48,85 Z" fill="none" stroke="${c7}" stroke-width="1.5"/>
      <path d="M40,55 L30,50 Q25,48 22,52 L22,72 Q25,76 30,74" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M80,55 L90,50 Q95,48 98,52 L98,72 Q95,76 90,74" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M30,62 Q60,45 90,62" fill="none" stroke="${cC}" stroke-width="1.5" opacity="0.6"/>
      ${cup(38, 100, 10, c3)}
      ${cup(82, 100, 10, c3)}
      <path d="M48,105 Q60,95 72,105" fill="none" stroke="${cC}" stroke-width="1.5"/>
      ${tri(60, 140, 10, c3)}
      ${tri(60, 140, 10, c3, 'none', false)}
    `),
    "The Devil": S(120, 160, `
      ${pentacle(60, 30, 18, c6)}
      <path d="M42,50 Q50,45 60,48 Q70,45 78,50 L75,95 Q60,102 45,95 Z" fill="none" stroke="${c1}" stroke-width="1.5"/>
      <path d="M38,52 L25,60 M82,52 L95,60" fill="none" stroke="${c1}" stroke-width="1.5"/>
      <path d="M35,110 L35,140" stroke="${c1}" stroke-width="1.5"/>
      <path d="M85,110 L85,140" stroke="${c1}" stroke-width="1.5"/>
      ${circle(35, 130, 6, c1)}
      ${circle(85, 130, 6, c1)}
      <path d="M35,136 Q60,145 85,136" fill="none" stroke="${c6}" stroke-width="1.5"/>
      ${line(55, 95, 35, 110, c6, 1)}
      ${line(65, 95, 85, 110, c6, 1)}
    `),
    "The Tower": S(120, 160, `
      <rect x="40" y="45" width="40" height="95" fill="none" stroke="${c2}" stroke-width="1.5" rx="2"/>
      <path d="M38,45 L60,20 L82,45" fill="none" stroke="${c2}" stroke-width="1.5"/>
      ${rect(48, 60, 10, 14, c2)}
      ${rect(66, 60, 10, 14, c2)}
      ${rect(48, 85, 10, 14, c2)}
      ${rect(66, 85, 10, 14, c2)}
      <path d="M60,20 L55,8 M60,20 L65,8 M60,20 L60,5" stroke="${c3}" stroke-width="1.5"/>
      <path d="M20,35 L35,45" stroke="${c6}" stroke-width="2"/>
      <path d="M100,35 L85,45" stroke="${c6}" stroke-width="2"/>
      <path d="M15,30 L20,35 L25,28" fill="none" stroke="${c6}" stroke-width="1.5"/>
      <path d="M95,28 L100,35 L105,30" fill="none" stroke="${c6}" stroke-width="1.5"/>
      <path d="M30,125 L25,145 M90,125 L95,145" stroke="${c2}" stroke-width="1" opacity="0.5"/>
    `),
    "The Star": S(120, 160, `
      ${star5(60, 30, 18, c3)}
      ${star5(25, 20, 5, c3)}
      ${star5(95, 20, 5, c3)}
      ${star5(20, 55, 4, c3)}
      ${star5(100, 55, 4, c3)}
      ${star5(30, 75, 3, c3)}
      ${star5(90, 75, 3, c3)}
      <path d="M50,60 Q48,50 55,55 L55,105 Q50,110 48,105 Z" fill="none" stroke="${cC}" stroke-width="1.2"/>
      <path d="M70,60 Q72,50 65,55 L65,105 Q70,110 72,105 Z" fill="none" stroke="${cC}" stroke-width="1.2"/>
      <path d="M40,110 Q50,115 55,120 L50,140" fill="none" stroke="${cC}" stroke-width="1.5"/>
      <path d="M80,110 Q70,115 65,120 L70,140" fill="none" stroke="${cC}" stroke-width="1.5"/>
      <path d="M35,148 Q60,140 85,148" fill="none" stroke="${cC}" stroke-width="1" opacity="0.5"/>
    `),
    "The Moon": S(120, 160, `
      ${crescent(60, 30, 20, c5)}
      ${circle(60, 30, 12, c5, 'none', 1)}
      <path d="M20,90 Q30,75 40,90 Q50,75 60,90 Q70,75 80,90 Q90,75 100,90" fill="none" stroke="${cC}" stroke-width="1.2"/>
      <path d="M25,100 Q35,88 45,100 Q55,88 65,100 Q75,88 85,100" fill="none" stroke="${cC}" stroke-width="1" opacity="0.6"/>
      <path d="M30,120 Q35,110 45,115 L45,140 Q38,145 30,140 Z" fill="none" stroke="${c2}" stroke-width="1.2"/>
      <path d="M75,120 Q80,110 90,115 L90,140 Q83,145 75,140 Z" fill="none" stroke="${c2}" stroke-width="1.2"/>
      <path d="M50,140 Q60,130 70,140" fill="none" stroke="${c2}" stroke-width="1"/>
      ${star5(25, 55, 4, c3)}
      ${star5(95, 55, 4, c3)}
    `),
    "The Sun": S(120, 160, `
      ${circle(60, 50, 22, c3, 'none', 2)}
      ${rays(60, 50, 24, 38, 16, c3)}
      ${circle(60, 50, 3, c3, c3)}
      ${circle(55, 46, 2, c3, c3)}
      ${circle(65, 46, 2, c3, c3)}
      <path d="M55,54 Q60,58 65,54" fill="none" stroke="${c3}" stroke-width="1.2"/>
      <path d="M40,100 Q45,90 52,95 Q60,85 68,95 Q75,90 80,100" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M35,110 Q50,100 60,105 Q70,100 85,110" fill="none" stroke="${c7}" stroke-width="1" opacity="0.6"/>
      ${circle(60, 125, 8, c3)}
      ${rays(60, 125, 9, 14, 8, c3)}
    `),
    "Judgement": S(120, 160, `
      ${circle(60, 22, 12, c3)}
      ${rays(60, 22, 14, 22, 8, c3)}
      <path d="M52,35 L48,55 L60,50 L60,55" fill="none" stroke="${c3}" stroke-width="1.5"/>
      <path d="M68,35 L72,55 L60,50" fill="none" stroke="${c3}" stroke-width="1.5"/>
      ${circle(35, 90, 8, c5)}
      ${circle(60, 85, 8, c5)}
      ${circle(85, 90, 8, c5)}
      <path d="M35,98 L35,125" stroke="${c5}" stroke-width="1.2"/>
      <path d="M60,93 L60,120" stroke="${c5}" stroke-width="1.2"/>
      <path d="M85,98 L85,125" stroke="${c5}" stroke-width="1.2"/>
      <path d="M28,125 L35,130 L42,125" fill="none" stroke="${c5}" stroke-width="1"/>
      <path d="M53,120 L60,125 L67,120" fill="none" stroke="${c5}" stroke-width="1"/>
      <path d="M78,125 L85,130 L92,125" fill="none" stroke="${c5}" stroke-width="1"/>
      <path d="M20,140 Q60,130 100,140" fill="none" stroke="${c2}" stroke-width="1" opacity="0.4"/>
    `),
    "The World": S(120, 160, `
      ${circle(60, 78, 42, c3, 'none', 1.5)}
      ${circle(60, 78, 38, c5, 'none', 0.8)}
      <path d="M50,55 Q55,45 60,50 Q65,45 70,55 L68,100 Q60,108 52,100 Z" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M48,70 L38,65 M72,70 L82,65" fill="none" stroke="${c7}" stroke-width="1.2"/>
      <path d="M52,100 L48,115 M68,100 L72,115" fill="none" stroke="${c7}" stroke-width="1.2"/>
      ${star5(60, 25, 6, c3)}
      ${star5(15, 78, 5, c3)}
      ${star5(105, 78, 5, c3)}
      ${star5(60, 135, 6, c3)}
      <path d="M20,30 Q15,78 20,126" fill="none" stroke="${c3}" stroke-width="1" opacity="0.4"/>
      <path d="M100,30 Q105,78 100,126" fill="none" stroke="${c3}" stroke-width="1" opacity="0.4"/>
    `)
  };

  // Court cards
  const courtFigure = (suit, rank) => {
    const sc = { Wands: cW, Cups: cC, Swords: cS, Pentacles: cP }[suit];
    const suitSymbol = {
      Wands: (x, y) => wand(x, y, 30, sc),
      Cups: (x, y) => cup(x, y, 8, sc),
      Swords: (x, y) => sword(x, y, 30, sc),
      Pentacles: (x, y) => coin(x, y, 10, sc)
    }[suit];

    let crown = '';
    let body = '';
    let extra = '';

    if (rank === 'Page') {
      body = `
        ${circle(60, 35, 10, sc)}
        <path d="M50,45 Q55,42 60,44 Q65,42 70,45 L68,95 Q60,100 52,95 Z" fill="none" stroke="${sc}" stroke-width="1.5"/>
        <path d="M52,95 L48,125 M68,95 L72,125" fill="none" stroke="${sc}" stroke-width="1.2"/>
      `;
      extra = suitSymbol(90, 75);
    } else if (rank === 'Knight') {
      body = `
        ${circle(55, 28, 10, sc)}
        <path d="M45,38 Q50,35 55,37 Q60,35 65,38 L63,70 Q55,75 47,70 Z" fill="none" stroke="${sc}" stroke-width="1.5"/>
        <path d="M65,80 Q75,75 85,80 L90,100 Q80,108 70,100 Z" fill="none" stroke="${sc}" stroke-width="1.2"/>
        <path d="M70,100 L65,130 M90,100 L95,130" fill="none" stroke="${sc}" stroke-width="1"/>
        <path d="M85,80 Q95,70 100,75" fill="none" stroke="${sc}" stroke-width="1.5"/>
      `;
      extra = suitSymbol(30, 65);
    } else if (rank === 'Queen') {
      crown = `<path d="M48,18 L52,10 L56,16 L60,8 L64,16 L68,10 L72,18 Z" fill="none" stroke="${c3}" stroke-width="1.2"/>`;
      body = `
        ${circle(60, 30, 10, sc)}
        <path d="M46,42 Q53,38 60,40 Q67,38 74,42 L72,85 Q60,90 48,85 Z" fill="none" stroke="${sc}" stroke-width="1.5"/>
        <path d="M42,90 Q50,95 60,98 Q70,95 78,90 L80,130 Q60,140 40,130 Z" fill="none" stroke="${sc}" stroke-width="1"/>
      `;
      extra = suitSymbol(85, 70);
    } else { // King
      crown = `<path d="M45,15 L48,5 L54,12 L60,3 L66,12 L72,5 L75,15 Z" fill="${c3}" opacity="0.7"/>`;
      body = `
        ${circle(60, 28, 10, sc)}
        <path d="M44,40 Q52,35 60,38 Q68,35 76,40 L74,85 Q60,92 46,85 Z" fill="none" stroke="${sc}" stroke-width="1.5"/>
        <path d="M40,88 Q50,95 60,98 Q70,95 80,88 L82,130 Q60,142 38,130 Z" fill="none" stroke="${sc}" stroke-width="1"/>
      `;
      extra = suitSymbol(25, 65);
    }

    return S(120, 160, crown + body + extra);
  };

  // Build the full art map
  const art = { ...major };

  // Generate Minor Arcana pip cards
  ['Wands', 'Cups', 'Swords', 'Pentacles'].forEach(suit => {
    const gen = { Wands: wandPips, Cups: cupPips, Swords: swordPips, Pentacles: pentPips }[suit];
    const names = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    names.forEach((name, i) => {
      art[`${name} of ${suit}`] = gen(i + 1);
    });

    // Court cards
    ['Page', 'Knight', 'Queen', 'King'].forEach(rank => {
      art[`${rank} of ${suit}`] = courtFigure(suit, rank);
    });
  });

  return art;
})();
