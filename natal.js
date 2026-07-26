// Natal Chart module — computes real planetary positions from birth data.
// Uses Paul Schlyter's low-precision ephemeris (accurate to well under a degree
// for sign placement, valid ~1900–2100). All angles in degrees.

const AstroEngine = (function () {
  const D2R = Math.PI / 180;

  function rev(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * D2R); }
  function cosd(x) { return Math.cos(x * D2R); }
  function tand(x) { return Math.tan(x * D2R); }
  function atan2d(y, x) { return Math.atan2(y, x) / D2R; }

  // Day number, epoch = 2000 Jan 0.0 (1999-12-31 00:00 UT). ut in hours.
  function dayNumber(y, m, D, ut) {
    return 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
      + Math.floor(275 * m / 9) + D - 730530 + ut / 24;
  }

  function obliquity(d) { return 23.4393 - 3.563e-7 * d; }

  function solveKepler(M, e) {
    let E = M + e * (180 / Math.PI) * sind(M) * (1 + e * cosd(M));
    for (let i = 0; i < 20; i++) {
      const dE = (E - e * (180 / Math.PI) * sind(E) - M) / (1 - e * cosd(E));
      E -= dE;
      if (Math.abs(dE) < 1e-6) break;
    }
    return E;
  }

  // Orbital position from elements → coords in the plane of the ecliptic.
  function orbitalToEcliptic(N, i, w, a, e, M) {
    const E = solveKepler(M, e);
    const xv = a * (cosd(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * sind(E);
    const v = atan2d(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);
    const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
    const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
    const zh = r * sind(v + w) * sind(i);
    return { x: xh, y: yh, z: zh, r, v };
  }

  function sunPosition(d) {
    const w = 282.9404 + 4.70935e-5 * d;
    const e = 0.016709 - 1.151e-9 * d;
    const M = rev(356.0470 + 0.9856002585 * d);
    const E = M + e * (180 / Math.PI) * sind(M) * (1 + e * cosd(M));
    const xv = cosd(E) - e;
    const yv = Math.sqrt(1 - e * e) * sind(E);
    const v = atan2d(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);
    return { lon: rev(v + w), r };
  }

  function moonPosition(d) {
    const N = rev(125.1228 - 0.0529538083 * d);
    const i = 5.1454;
    const w = rev(318.0634 + 0.1643573223 * d);
    const a = 60.2666;
    const e = 0.054900;
    const M = rev(115.3654 + 13.0649929509 * d);

    const p = orbitalToEcliptic(N, i, w, a, e, M);
    let lon = rev(atan2d(p.y, p.x));
    let lat = atan2d(p.z, Math.sqrt(p.x * p.x + p.y * p.y));

    // Major perturbations (Sun's mean anomaly / argument needed)
    const ws = 282.9404 + 4.70935e-5 * d;
    const Ms = rev(356.0470 + 0.9856002585 * d);
    const Ls = rev(Ms + ws);
    const Lm = rev(M + w + N);
    const D = rev(Lm - Ls);
    const F = rev(Lm - N);

    lon += -1.274 * sind(M - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms)
      - 0.059 * sind(2 * M - 2 * D) - 0.057 * sind(M - 2 * D + Ms)
      + 0.053 * sind(M + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(M - Ms)
      - 0.035 * sind(D) - 0.031 * sind(M + Ms) - 0.015 * sind(2 * F - 2 * D)
      + 0.011 * sind(M - 4 * D);
    lat += -0.173 * sind(F - 2 * D) - 0.055 * sind(M - F - 2 * D)
      - 0.046 * sind(M + F - 2 * D) + 0.033 * sind(F + 2 * D) + 0.017 * sind(2 * M + F);

    return { lon: rev(lon), lat };
  }

  const PLANET_ELEMENTS = {
    Mercury: d => [48.3313 + 3.24587e-5 * d, 7.0047 + 5.0e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
    Venus: d => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.8910 + 1.38374e-5 * d, 0.723330, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
    Mars: d => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
    Jupiter: d => [100.4542 + 2.76854e-5 * d, 1.3030 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.8950 + 0.0830853001 * d],
    Saturn: d => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.9670 + 0.0334442282 * d],
    Uranus: d => [74.0005 + 1.3978e-5 * d, 0.7733 + 1.9e-8 * d, 96.6612 + 3.0565e-5 * d, 19.18171 - 1.55e-8 * d, 0.047318 + 7.45e-9 * d, 142.5905 + 0.011725806 * d],
    Neptune: d => [131.7806 + 3.0173e-5 * d, 1.7700 - 2.55e-7 * d, 272.8461 - 6.027e-6 * d, 30.05826 + 3.313e-8 * d, 0.008606 + 2.15e-9 * d, 260.2471 + 0.005995147 * d]
  };

  function planetPosition(name, d) {
    const [N, i, w, a, e, Mraw] = PLANET_ELEMENTS[name](d);
    const M = rev(Mraw);
    const p = orbitalToEcliptic(N, i, w, a, e, M);
    let lonH = atan2d(p.y, p.x);
    let latH = atan2d(p.z, Math.sqrt(p.x * p.x + p.y * p.y));

    // Main perturbations for the gas giants
    const Mj = rev(19.8950 + 0.0830853001 * d);
    const MsSat = rev(316.9670 + 0.0334442282 * d);
    const Mu = rev(142.5905 + 0.011725806 * d);
    if (name === 'Jupiter') {
      lonH += -0.332 * sind(2 * Mj - 5 * MsSat - 67.6) - 0.056 * sind(2 * Mj - 2 * MsSat + 21)
        + 0.042 * sind(3 * Mj - 5 * MsSat + 21) - 0.036 * sind(Mj - 2 * MsSat)
        + 0.022 * cosd(Mj - MsSat) + 0.023 * sind(2 * Mj - 3 * MsSat + 52)
        - 0.016 * sind(Mj - 5 * MsSat - 69);
    } else if (name === 'Saturn') {
      lonH += 0.812 * sind(2 * Mj - 5 * MsSat - 67.6) - 0.229 * cosd(2 * Mj - 4 * MsSat - 2)
        + 0.119 * sind(Mj - 2 * MsSat - 3) + 0.046 * sind(2 * Mj - 6 * MsSat - 69)
        + 0.014 * sind(Mj - 3 * MsSat + 32);
      latH += -0.020 * cosd(2 * Mj - 4 * MsSat - 2) + 0.018 * sind(2 * Mj - 6 * MsSat - 49);
    } else if (name === 'Uranus') {
      lonH += 0.040 * sind(MsSat - 2 * Mu + 6) + 0.035 * sind(MsSat - 3 * Mu + 33)
        - 0.015 * sind(Mj - Mu + 20);
    }

    // Heliocentric → geocentric
    const r = p.r;
    const xh = r * cosd(lonH) * cosd(latH);
    const yh = r * sind(lonH) * cosd(latH);
    const zh = r * sind(latH);
    const sun = sunPosition(d);
    const xg = xh + sun.r * cosd(sun.lon);
    const yg = yh + sun.r * sind(sun.lon);
    return { lon: rev(atan2d(yg, xg)), lat: atan2d(zh, Math.sqrt(xg * xg + yg * yg)) };
  }

  // Pluto — Schlyter's curve fit, valid ~1900–2100.
  function plutoPosition(d) {
    const S = 50.03 + 0.033459652 * d;
    const P = 238.95 + 0.003968789 * d;
    const lonH = 238.9508 + 0.00400703 * d
      - 19.799 * sind(P) + 19.848 * cosd(P) + 0.897 * sind(2 * P) - 4.956 * cosd(2 * P)
      + 0.610 * sind(3 * P) + 1.211 * cosd(3 * P) - 0.341 * sind(4 * P) - 0.190 * cosd(4 * P)
      + 0.128 * sind(5 * P) - 0.034 * cosd(5 * P) - 0.038 * sind(6 * P) + 0.031 * cosd(6 * P)
      + 0.020 * sind(S - P) - 0.010 * cosd(S - P);
    const latH = -3.9082
      - 5.453 * sind(P) - 14.975 * cosd(P) + 3.527 * sind(2 * P) + 1.673 * cosd(2 * P)
      - 1.051 * sind(3 * P) + 0.328 * cosd(3 * P) + 0.179 * sind(4 * P) - 0.292 * cosd(4 * P)
      + 0.019 * sind(5 * P) + 0.100 * cosd(5 * P) - 0.031 * sind(6 * P) - 0.026 * cosd(6 * P)
      + 0.011 * cosd(S - P);
    const r = 40.72 + 6.68 * sind(P) + 6.90 * cosd(P) - 1.18 * sind(2 * P) - 0.03 * cosd(2 * P)
      + 0.15 * sind(3 * P) - 0.14 * cosd(3 * P);

    const xh = r * cosd(lonH) * cosd(latH);
    const yh = r * sind(lonH) * cosd(latH);
    const zh = r * sind(latH);
    const sun = sunPosition(d);
    const xg = xh + sun.r * cosd(sun.lon);
    const yg = yh + sun.r * sind(sun.lon);
    return { lon: rev(atan2d(yg, xg)), lat: atan2d(zh, Math.sqrt(xg * xg + yg * yg)) };
  }

  // Ascendant & Midheaven. d includes UT fraction; lonEast/latDeg in degrees.
  function angles(d, lonEast, latDeg) {
    const eps = obliquity(d);
    // GMST via Meeus (J2000.0 epoch is d = 1.5 in Schlyter's day number)
    const gmst = rev(280.46061837 + 360.98564736629 * (d - 1.5));
    const ramc = rev(gmst + lonEast);
    const asc = rev(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(latDeg) * sind(eps))));
    const mc = rev(atan2d(sind(ramc), cosd(ramc) * cosd(eps)));
    return { asc, mc, ramc };
  }

  // Full chart. y/m/day + ut hours (already converted from local), optional geo.
  function chart(y, m, day, ut, lonEast, latDeg) {
    const d = dayNumber(y, m, day, ut);
    const sun = sunPosition(d);
    const moon = moonPosition(d);
    const positions = {
      Sun: sun.lon,
      Moon: moon.lon,
      Mercury: planetPosition('Mercury', d).lon,
      Venus: planetPosition('Venus', d).lon,
      Mars: planetPosition('Mars', d).lon,
      Jupiter: planetPosition('Jupiter', d).lon,
      Saturn: planetPosition('Saturn', d).lon,
      Uranus: planetPosition('Uranus', d).lon,
      Neptune: planetPosition('Neptune', d).lon,
      Pluto: plutoPosition(d).lon
    };
    let ang = null;
    if (lonEast !== null && latDeg !== null && !isNaN(lonEast) && !isNaN(latDeg)) {
      ang = angles(d, lonEast, latDeg);
    }
    return { d, positions, angles: ang };
  }

  return { chart, sunPosition, moonPosition, dayNumber, rev };
})();

(function () {
  const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const SIGN_GLYPHS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];
  const ELEMENT_OF_SIGN =["Fire", "Earth", "Air", "Water", "Fire", "Earth", "Air", "Water", "Fire", "Earth", "Air", "Water"];
  const SIGN_FLAVOR = [
    "bold, pioneering, direct energy",
    "steady, sensual, patient energy",
    "curious, quick, communicative energy",
    "nurturing, intuitive, protective energy",
    "radiant, generous, expressive energy",
    "precise, analytical, devoted energy",
    "harmonious, diplomatic, graceful energy",
    "intense, magnetic, transformative energy",
    "adventurous, optimistic, freedom-loving energy",
    "disciplined, ambitious, enduring energy",
    "visionary, original, humanitarian energy",
    "dreamy, empathic, boundless energy"
  ];

  const PLANET_GLYPHS = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀︎", Mars: "♂︎", Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Ascendant: "Asc", Midheaven: "MC" };
  const PLANET_ROLES = {
    Sun: "your core identity and vitality",
    Moon: "your emotions and inner needs",
    Mercury: "your mind and communication style",
    Venus: "how you love and what you value",
    Mars: "your drive, courage, and desire",
    Jupiter: "where you grow and find luck",
    Saturn: "your discipline and life lessons",
    Uranus: "where you innovate and rebel",
    Neptune: "your dreams and spiritual intuition",
    Pluto: "where you transform and claim power",
    Ascendant: "the self you show the world",
    Midheaven: "your public calling and reputation"
  };

  const ASPECTS = [
    { name: "Conjunction", angle: 0, orb: 7, symbol: "☌", tone: "fuses" },
    { name: "Sextile", angle: 60, orb: 4, symbol: "⚹", tone: "supports" },
    { name: "Square", angle: 90, orb: 6, symbol: "□", tone: "challenges" },
    { name: "Trine", angle: 120, orb: 6, symbol: "△", tone: "harmonizes" },
    { name: "Opposition", angle: 180, orb: 7, symbol: "☍", tone: "polarizes" }
  ];

  function signOf(lon) { return Math.floor(AstroEngine.rev(lon) / 30); }
  function degInSign(lon) { return AstroEngine.rev(lon) % 30; }
  function fmtPos(lon) {
    const deg = Math.floor(degInSign(lon));
    const min = Math.floor((degInSign(lon) - deg) * 60);
    return `${deg}°${String(min).padStart(2, '0')}′ ${SIGN_NAMES[signOf(lon)]}`;
  }

  let root = null;

  // Every UTC offset in real-world use, including the odd half/quarter hours
  const TZ_OFFSETS = [-12, -11, -10, -9.5, -9, -8, -7, -6, -5, -4, -3.5, -3, -2, -1, 0,
    1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 5.75, 6, 6.5, 7, 8, 8.75, 9, 9.5, 10, 10.5, 11, 12, 12.75, 13, 14];

  function fmtOffset(o) {
    const sign = o < 0 ? '−' : '+';
    const abs = Math.abs(o);
    const h = Math.floor(abs);
    const m = Math.round((abs - h) * 60);
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function render(container) {
    root = container;
    const p = MysticApp.getProfile();
    container.innerHTML = `
      <form class="mystic-form" id="natal-form">
        <p class="form-note">Enter your birth details. Time and place unlock your Ascendant and Midheaven — leave them blank if unknown.</p>
        <label>Birth date
          <input type="date" id="natal-date" required value="${MysticApp.esc(p.birthDate || '')}">
        </label>
        <label>Birth time (local)
          <input type="time" id="natal-time" value="${MysticApp.esc(p.birthTime || '')}">
        </label>
        <label>Birthplace — start typing a city
          <input type="text" id="natal-city" list="natal-city-list" autocomplete="off" placeholder="e.g. New York, USA" value="${MysticApp.esc(p.birthCity || '')}">
          <datalist id="natal-city-list">
            ${CITY_LIST.map(c => `<option value="${MysticApp.esc(c[0])}"></option>`).join('')}
          </datalist>
        </label>
        <p class="form-note">Picking a city fills in the timezone and coordinates below automatically — daylight saving is handled for you. City not listed? Pick the nearest one, or fill the fields by hand.</p>
        <label>UTC offset of birthplace
          <select id="natal-tz">
            <option value="">— select (or pick a city above) —</option>
            ${TZ_OFFSETS.map(o => `<option value="${o}" ${String(p.birthTz) === String(o) ? 'selected' : ''}>${fmtOffset(o)}</option>`).join('')}
          </select>
        </label>
        <div class="form-row">
          <label>Latitude
            <input type="number" id="natal-lat" step="0.0001" min="-90" max="90" value="${p.birthLat !== undefined ? MysticApp.esc(p.birthLat) : ''}" placeholder="e.g. 40.71">
          </label>
          <label>Longitude (east +)
            <input type="number" id="natal-lon" step="0.0001" min="-180" max="180" value="${p.birthLon !== undefined ? MysticApp.esc(p.birthLon) : ''}" placeholder="e.g. -74.01">
          </label>
        </div>
        <button type="submit" class="btn-primary">Cast Chart</button>
      </form>
      <div id="natal-result"></div>
    `;

    container.querySelector('#natal-form').addEventListener('submit', e => {
      e.preventDefault();
      castChart();
    });

    // City picker: fill tz/lat/lon whenever the city, date, or time changes
    function applyCity() {
      const name = container.querySelector('#natal-city').value.trim();
      const city = CITY_LIST.find(c => c[0].toLowerCase() === name.toLowerCase());
      if (!city) return;
      container.querySelector('#natal-lat').value = city[1];
      container.querySelector('#natal-lon').value = city[2];
      const off = cityUtcOffset(city[3], container.querySelector('#natal-date').value || '2000-01-01', container.querySelector('#natal-time').value);
      if (off !== null) container.querySelector('#natal-tz').value = off;
      MysticApp.saveProfile({ birthCity: city[0] });
    }
    ['natal-city', 'natal-date', 'natal-time'].forEach(id => {
      container.querySelector('#' + id).addEventListener('change', applyCity);
    });
    container.querySelector('#natal-city').addEventListener('input', applyCity);
  }

  function castChart() {
    const dateStr = root.querySelector('#natal-date').value;
    const timeStr = root.querySelector('#natal-time').value;
    const tzStr = root.querySelector('#natal-tz').value;
    const latStr = root.querySelector('#natal-lat').value;
    const lonStr = root.querySelector('#natal-lon').value;
    if (!dateStr) return;

    MysticApp.saveProfile({ birthDate: dateStr, birthTime: timeStr, birthTz: tzStr, birthLat: latStr, birthLon: lonStr });

    const [y, m, day] = dateStr.split('-').map(Number);
    const hasTime = !!timeStr;
    const tz = tzStr === '' ? 0 : parseFloat(tzStr);
    let localHours = 12;
    if (hasTime) {
      const [hh, mm] = timeStr.split(':').map(Number);
      localHours = hh + mm / 60;
    }
    const ut = localHours - tz;

    const lat = latStr === '' ? null : parseFloat(latStr);
    const lon = lonStr === '' ? null : parseFloat(lonStr);
    const useAngles = hasTime && lat !== null && lon !== null;

    const c = AstroEngine.chart(y, m, day, ut, useAngles ? lon : null, useAngles ? lat : null);

    const entries = Object.entries(c.positions);
    if (c.angles) {
      entries.push(['Ascendant', c.angles.asc]);
      entries.push(['Midheaven', c.angles.mc]);
    }

    // Element balance (planets only)
    const balance = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    Object.values(c.positions).forEach(lonP => { balance[ELEMENT_OF_SIGN[signOf(lonP)]]++; });
    const dominant = Object.entries(balance).sort((a, b) => b[1] - a[1])[0][0];

    // Aspects between planets
    const names = Object.keys(c.positions);
    const aspects = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        let diff = Math.abs(AstroEngine.rev(c.positions[names[i]]) - AstroEngine.rev(c.positions[names[j]]));
        if (diff > 180) diff = 360 - diff;
        for (const a of ASPECTS) {
          if (Math.abs(diff - a.angle) <= a.orb) {
            aspects.push({ a: names[i], b: names[j], aspect: a, exact: Math.abs(diff - a.angle) });
            break;
          }
        }
      }
    }
    aspects.sort((x, y2) => x.exact - y2.exact);

    let html = `<div class="chart-wheel-wrap">${drawWheel(c)}</div>`;

    html += '<div class="planet-table">';
    entries.forEach(([name, lonP]) => {
      const s = signOf(lonP);
      html += `
        <div class="planet-row">
          <span class="planet-glyph">${PLANET_GLYPHS[name]}</span>
          <span class="planet-name">${name}</span>
          <span class="planet-pos">${SIGN_GLYPHS[s]} ${fmtPos(lonP)}</span>
        </div>
      `;
    });
    html += '</div>';

    if (!hasTime) {
      html += `<p class="form-note">Computed for noon — without a birth time the Moon may be off by up to ~7°, and the Ascendant cannot be determined.</p>`;
    } else if (!useAngles) {
      html += `<p class="form-note">Add latitude and longitude to unlock your Ascendant and Midheaven.</p>`;
    }

    // Big three (or what we have)
    html += '<h2 class="section-title">Your Placements</h2>';
    const featured = c.angles ? ['Sun', 'Moon', 'Ascendant'] : ['Sun', 'Moon', 'Mercury'];
    entries.forEach(([name, lonP]) => {
      const s = signOf(lonP);
      const cls = featured.includes(name) ? 'interp-card featured' : 'interp-card';
      html += `
        <div class="${cls}">
          <h3>${PLANET_GLYPHS[name]} ${name} in ${SIGN_NAMES[s]}</h3>
          <div class="interp-meaning">${capitalize(PLANET_ROLES[name])} expresses through ${SIGN_NAMES[s]}'s ${SIGN_FLAVOR[s]}.</div>
        </div>
      `;
    });

    html += `
      <div class="interp-summary">
        <h3>Elemental Balance</h3>
        <div class="element-bars">
          ${Object.entries(balance).map(([el, n]) => `
            <div class="element-bar-row">
              <span class="element-label">${el}</span>
              <div class="element-bar"><div class="element-bar-fill el-${el.toLowerCase()}" style="width:${n * 10}%"></div></div>
              <span class="element-count">${n}</span>
            </div>
          `).join('')}
        </div>
        <p>Your chart leans toward <b>${dominant}</b> — ${elementMeaning(dominant)}</p>
      </div>
    `;

    if (aspects.length) {
      html += '<h2 class="section-title">Major Aspects</h2><div class="aspect-list">';
      aspects.slice(0, 10).forEach(x => {
        html += `
          <div class="aspect-row">
            <span class="aspect-symbol">${x.aspect.symbol}</span>
            <span>${PLANET_GLYPHS[x.a]} ${x.a} ${x.aspect.name} ${PLANET_GLYPHS[x.b]} ${x.b}</span>
            <span class="aspect-orb">${x.exact.toFixed(1)}° orb</span>
          </div>
          <div class="aspect-meaning">${x.aspect.name} ${x.aspect.tone} ${PLANET_ROLES[x.a]} with ${PLANET_ROLES[x.b]}.</div>
        `;
      });
      html += '</div>';
    }

    root.querySelector('#natal-result').innerHTML = html;
    root.querySelector('#natal-result').scrollIntoView({ behavior: 'smooth' });
  }

  function elementMeaning(el) {
    return {
      Fire: "you meet life with passion, spontaneity, and creative force.",
      Earth: "you meet life with practicality, endurance, and grounded sense.",
      Air: "you meet life with ideas, connection, and social intelligence.",
      Water: "you meet life with feeling, imagination, and deep intuition."
    }[el];
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function drawWheel(c) {
    const size = 372, cx = size / 2, cy = size / 2;
    const rOuter = 160, rSigns = 143, rInner = 126, rPlanet = 100, rHub = 55;
    // Longitude 0° at 9 o'clock, increasing counterclockwise (visual).
    // If an ascendant exists, rotate so it sits at 9 o'clock like a real chart.
    const rotation = c.angles ? c.angles.asc : 0;

    function pt(lonDeg, r) {
      const a = (180 + (lonDeg - rotation)) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    }

    let svg = `<svg viewBox="0 0 ${size} ${size}" class="chart-wheel" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${rOuter}" class="wheel-ring"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${rInner}" class="wheel-ring"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${rHub}" class="wheel-ring wheel-hub"/>`;

    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pt(i * 30, rInner);
      const [x2, y2] = pt(i * 30, rOuter);
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wheel-spoke"/>`;
      const [gx, gy] = pt(i * 30 + 15, rSigns);
      svg += `<text x="${gx}" y="${gy}" class="wheel-sign" dominant-baseline="central" text-anchor="middle">${SIGN_GLYPHS[i]}</text>`;
    }

    // Spread out planets that share nearly the same longitude
    const entries = Object.entries(c.positions).sort((a, b) => AstroEngine.rev(a[1]) - AstroEngine.rev(b[1]));
    let lastLon = -999, level = 0;
    entries.forEach(([name, lonP]) => {
      const L = AstroEngine.rev(lonP);
      level = (L - lastLon < 9) ? (level + 1) % 3 : 0;
      lastLon = L;
      const r = rPlanet - level * 22;
      const [px, py] = pt(L, r);
      const [tx, ty] = pt(L, rInner);
      svg += `<line x1="${tx}" y1="${ty}" x2="${px}" y2="${py}" class="wheel-tick" opacity="0.35"/>`;
      svg += `<text x="${px}" y="${py}" class="wheel-planet" dominant-baseline="central" text-anchor="middle">${PLANET_GLYPHS[name]}</text>`;
    });

    if (c.angles) {
      const [ax1, ay1] = pt(c.angles.asc, rHub);
      const [ax2, ay2] = pt(c.angles.asc, rOuter);
      svg += `<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" class="wheel-asc"/>`;
      const [alx, aly] = pt(c.angles.asc, rOuter + 12);
      svg += `<text x="${alx}" y="${aly}" class="wheel-asc-label" dominant-baseline="central" text-anchor="middle">ASC</text>`;
    }

    svg += `<text x="${cx}" y="${cy}" class="wheel-center" dominant-baseline="central" text-anchor="middle">✦</text>`;
    svg += '</svg>';
    return svg;
  }

  MysticApp.register({
    id: 'natal',
    name: 'Natal Chart',
    icon: MysticApp.icons.natal,
    desc: 'Your birth chart, computed',
    subtitle: 'The sky at the moment you were born',
    render
  });
})();
