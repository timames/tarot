// Moon Phase module — real lunar phase from the astro engine in natal.js.

(function () {
  const PHASES = [
    { name: "New Moon", range: [0, 22.5], meaning: "A blank page. Set intentions, plant seeds, and begin quietly. The dark moon favors new starts and inner listening." },
    { name: "Waxing Crescent", range: [22.5, 67.5], meaning: "First momentum. Take the initial concrete steps toward what you envisioned at the new moon. Faith over doubt." },
    { name: "First Quarter", range: [67.5, 112.5], meaning: "The first test. Obstacles surface to strengthen your commitment. Push through resistance — decide and act." },
    { name: "Waxing Gibbous", range: [112.5, 157.5], meaning: "Refinement. Adjust, edit, and improve what you are building. Patience now, the culmination is near." },
    { name: "Full Moon", range: [157.5, 202.5], meaning: "Culmination and illumination. Emotions run high and truths come to light. Celebrate what has ripened; release what has not." },
    { name: "Waning Gibbous", range: [202.5, 247.5], meaning: "Gratitude and sharing. Distribute the harvest — teach, give thanks, and integrate what the full moon revealed." },
    { name: "Last Quarter", range: [247.5, 292.5], meaning: "Release. Break old habits and clear away what no longer serves. Forgiveness lightens the load for the next cycle." },
    { name: "Waning Crescent", range: [292.5, 337.5], meaning: "Surrender and rest. The cycle closes — reflect, dream, and restore your energy before the next new moon." },
    { name: "New Moon", range: [337.5, 360], meaning: "A blank page. Set intentions, plant seeds, and begin quietly. The dark moon favors new starts and inner listening." }
  ];

  function currentElongation(date) {
    const d = AstroEngine.dayNumber(
      date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
      date.getUTCHours() + date.getUTCMinutes() / 60
    );
    const sun = AstroEngine.sunPosition(d);
    const moon = AstroEngine.moonPosition(d);
    return AstroEngine.rev(moon.lon - sun.lon);
  }

  function findNext(targetElong, from) {
    // Scan forward in 1-hour steps for the elongation crossing
    let prev = currentElongation(from);
    for (let h = 1; h <= 24 * 31; h++) {
      const t = new Date(from.getTime() + h * 3600e3);
      const e = currentElongation(t);
      const prevDiff = AstroEngine.rev(prev - targetElong);
      const currDiff = AstroEngine.rev(e - targetElong);
      if (prevDiff > 300 && currDiff < 60) return t;
      prev = e;
    }
    return null;
  }

  function moonSvg(elong) {
    const R = 70, size = 160, c = size / 2;
    const lit = '#e8d5b7', dark = '#1e0a3c';
    const rt = Math.abs(R * Math.cos(elong * Math.PI / 180));
    let path;
    if (elong <= 180) {
      // Waxing — lit on the right
      const sweep = elong <= 90 ? 0 : 1;
      path = `M ${c},${c - R} A ${R},${R} 0 0 1 ${c},${c + R} A ${rt},${R} 0 0 ${sweep} ${c},${c - R}`;
    } else {
      // Waning — lit on the left
      const sweep = elong <= 270 ? 0 : 1;
      path = `M ${c},${c - R} A ${R},${R} 0 0 0 ${c},${c + R} A ${rt},${R} 0 0 ${sweep} ${c},${c - R}`;
    }
    return `
      <svg viewBox="0 0 ${size} ${size}" class="moon-svg" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${c}" cy="${c}" r="${R}" fill="${dark}" stroke="rgba(212,160,74,0.5)" stroke-width="2"/>
        <path d="${path}" fill="${lit}"/>
        <circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="rgba(212,160,74,0.5)" stroke-width="2"/>
      </svg>
    `;
  }

  function render(container) {
    const now = new Date();
    const elong = currentElongation(now);
    const illum = Math.round((1 - Math.cos(elong * Math.PI / 180)) / 2 * 100);
    const phase = PHASES.find(p => elong >= p.range[0] && elong < p.range[1]) || PHASES[0];

    const nextNew = findNext(0, now);
    const nextFull = findNext(180, now);
    const fmt = t => t ? t.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : '—';

    container.innerHTML = `
      <div class="moon-display">
        ${moonSvg(elong)}
        <h2>${phase.name}</h2>
        <div class="interp-position">${illum}% illuminated</div>
      </div>

      <div class="interp-card">
        <h3>Lunar Guidance</h3>
        <div class="interp-meaning">${phase.meaning}</div>
      </div>

      <div class="lucky-row">
        <div class="lucky-item"><div class="lucky-label">Next Full Moon</div><div class="lucky-value">${fmt(nextFull)}</div></div>
        <div class="lucky-item"><div class="lucky-label">Next New Moon</div><div class="lucky-value">${fmt(nextNew)}</div></div>
      </div>

      <div class="interp-summary">
        <h3>Working with the Moon</h3>
        <p>The waxing moon (new to full) supports building, attracting, and growth. The waning moon (full to new) supports releasing, clearing, and rest. Align your efforts with the tide.</p>
      </div>
    `;
  }

  MysticApp.register({
    id: 'moon',
    name: 'Moon Phase',
    icon: '&#127765;',
    desc: "Tonight's lunar energy",
    subtitle: 'The moon in her current mood',
    render
  });
})();
