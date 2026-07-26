// Biorhythm module — physical (23d), emotional (28d), intellectual (33d) cycles.

(function () {
  const CYCLES = [
    { name: "Physical", days: 23, color: "#d46a5a", desc: "strength, stamina, and coordination" },
    { name: "Emotional", days: 28, color: "#7fb2d4", desc: "mood, sensitivity, and creativity" },
    { name: "Intellectual", days: 33, color: "#8fd47f", desc: "focus, memory, and decision-making" }
  ];

  function daysSince(birth, when) {
    return (when - birth) / 86400e3;
  }

  function value(cycleDays, t) {
    return Math.sin(2 * Math.PI * t / cycleDays);
  }

  function statusWord(v) {
    if (v > 0.85) return "peaking";
    if (v > 0.3) return "high";
    if (v > -0.3) return "in transition";
    if (v > -0.85) return "low";
    return "at its lowest ebb";
  }

  function chartSvg(birth) {
    const W = 340, H = 180, mid = H / 2, span = 14; // ±14 days around today
    const now = new Date();
    now.setHours(12, 0, 0, 0);

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="bio-chart" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<line x1="0" y1="${mid}" x2="${W}" y2="${mid}" class="bio-axis"/>`;
    svg += `<line x1="${W / 2}" y1="8" x2="${W / 2}" y2="${H - 8}" class="bio-today"/>`;
    svg += `<text x="${W / 2}" y="${H - 2}" class="bio-today-label" text-anchor="middle">today</text>`;

    CYCLES.forEach(c => {
      let points = [];
      for (let px = 0; px <= W; px += 4) {
        const dayOffset = (px / W) * span * 2 - span;
        const t = daysSince(birth, new Date(now.getTime() + dayOffset * 86400e3));
        const v = value(c.days, t);
        points.push(`${px},${(mid - v * (mid - 14)).toFixed(1)}`);
      }
      svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${c.color}" stroke-width="2.5" opacity="0.9"/>`;
    });

    svg += '</svg>';
    return svg;
  }

  function render(container) {
    const p = MysticApp.getProfile();
    container.innerHTML = `
      <form class="mystic-form" id="bio-form">
        <p class="form-note">Three natural cycles begin at birth and oscillate throughout life. See where yours stand today.</p>
        <label>Birth date
          <input type="date" id="bio-date" required value="${MysticApp.esc(p.birthDate || '')}">
        </label>
        <button type="submit" class="btn-primary">Chart My Rhythms</button>
      </form>
      <div id="bio-result"></div>
    `;

    container.querySelector('#bio-form').addEventListener('submit', e => {
      e.preventDefault();
      const dateStr = container.querySelector('#bio-date').value;
      if (!dateStr) return;
      MysticApp.saveProfile({ birthDate: dateStr });

      const [y, m, d] = dateStr.split('-').map(Number);
      const birth = new Date(y, m - 1, d, 12);
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      const t = daysSince(birth, now);

      let html = `<div class="chart-wheel-wrap">${chartSvg(birth)}</div><div class="bio-legend">`;
      CYCLES.forEach(c => {
        html += `<span class="bio-key"><span class="bio-swatch" style="background:${c.color}"></span>${c.name}</span>`;
      });
      html += '</div>';

      CYCLES.forEach(c => {
        const v = value(c.days, t);
        const pct = Math.round(v * 100);
        html += `
          <div class="interp-card">
            <h3 style="color:${c.color}">${c.name} — ${pct > 0 ? '+' : ''}${pct}%</h3>
            <div class="interp-meaning">Your ${c.name.toLowerCase()} cycle (${c.days} days), governing ${c.desc}, is ${statusWord(v)} today.</div>
          </div>
        `;
      });

      html += `
        <div class="interp-summary">
          <h3>Reading the Rhythms</h3>
          <p>Days near a cycle's peak favor activities it governs; days near the bottom call for rest in that area. The most sensitive days are "critical days," when a cycle crosses zero — take extra care then.</p>
        </div>
      `;

      const el = container.querySelector('#bio-result');
      el.innerHTML = html;
      el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  MysticApp.register({
    id: 'biorhythm',
    name: 'Biorhythms',
    icon: MysticApp.icons.biorhythm,
    desc: 'Your three life cycles',
    subtitle: 'The waves that carry you',
    render
  });
})();
