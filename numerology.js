// Numerology module — Pythagorean numerology from full name and birth date.

(function () {
  const LETTER_VALUES = {
    a: 1, j: 1, s: 1, b: 2, k: 2, t: 2, c: 3, l: 3, u: 3,
    d: 4, m: 4, v: 4, e: 5, n: 5, w: 5, f: 6, o: 6, x: 6,
    g: 7, p: 7, y: 7, h: 8, q: 8, z: 8, i: 9, r: 9
  };
  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

  const MEANINGS = {
    1: { title: "The Leader", text: "Independent, pioneering, and driven. You are here to forge your own path, initiate new ventures, and stand on your own strength. Watch for stubbornness and the loneliness of always going first." },
    2: { title: "The Peacemaker", text: "Diplomatic, sensitive, and cooperative. You are here to build bridges, create harmony, and work behind the scenes with grace. Watch for over-sensitivity and losing yourself in others' needs." },
    3: { title: "The Creative", text: "Expressive, joyful, and imaginative. You are here to communicate, inspire, and bring beauty into the world through word and art. Watch for scattered energy and speaking without depth." },
    4: { title: "The Builder", text: "Practical, loyal, and disciplined. You are here to create lasting foundations through steady, honest work. Watch for rigidity and mistaking routine for purpose." },
    5: { title: "The Adventurer", text: "Freedom-loving, versatile, and magnetic. You are here to experience life fully — travel, change, and the thrill of the new. Watch for restlessness and commitment fears." },
    6: { title: "The Nurturer", text: "Responsible, warm, and devoted. You are here to care for family and community, and to create beauty and harmony at home. Watch for martyrdom and controlling through care." },
    7: { title: "The Seeker", text: "Analytical, spiritual, and introspective. You are here to search beneath the surface for truth and wisdom. Watch for isolation and overthinking what should be felt." },
    8: { title: "The Powerhouse", text: "Ambitious, authoritative, and material-savvy. You are here to master abundance, lead organizations, and wield power responsibly. Watch for workaholism and measuring worth in wealth." },
    9: { title: "The Humanitarian", text: "Compassionate, wise, and generous. You are here to serve the greater good and complete old cycles with forgiveness. Watch for carrying the world's pain as your own." },
    11: { title: "The Illuminator", text: "A master number. Intuitive, inspired, and visionary — you carry a heightened spiritual voltage meant to uplift others. Watch for nervous tension and doubting your own light." },
    22: { title: "The Master Builder", text: "A master number. You can turn grand visions into concrete reality — the architect of dreams made solid. Watch for the pressure of your own potential." },
    33: { title: "The Master Teacher", text: "A master number. Selfless service through compassion, healing, and uplifting others is your calling. Watch for self-sacrifice that empties the vessel." }
  };

  function reduceNum(n, keepMasters) {
    while (n > 9 && !(keepMasters && (n === 11 || n === 22 || n === 33))) {
      n = String(n).split('').reduce((s, c) => s + Number(c), 0);
    }
    return n;
  }

  function sumLetters(name, filter) {
    let total = 0;
    for (const ch of name.toLowerCase()) {
      if (LETTER_VALUES[ch] && (!filter || filter(ch))) total += LETTER_VALUES[ch];
    }
    return total;
  }

  function lifePath(y, m, d) {
    const rm = reduceNum(m, true);
    const rd = reduceNum(d, true);
    const ry = reduceNum(y, true);
    return reduceNum(rm + rd + ry, true);
  }

  function render(container) {
    const p = MysticApp.getProfile();
    container.innerHTML = `
      <form class="mystic-form" id="num-form">
        <p class="form-note">Your numbers are drawn from your full birth name and date of birth.</p>
        <label>Full birth name
          <input type="text" id="num-name" required placeholder="e.g. Jane Elizabeth Smith" value="${MysticApp.esc(p.fullName || '')}" autocomplete="off">
        </label>
        <label>Birth date
          <input type="date" id="num-date" required value="${MysticApp.esc(p.birthDate || '')}">
        </label>
        <button type="submit" class="btn-primary">Reveal My Numbers</button>
      </form>
      <div id="num-result"></div>
    `;

    container.querySelector('#num-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = container.querySelector('#num-name').value.trim();
      const dateStr = container.querySelector('#num-date').value;
      if (!name || !dateStr) return;
      MysticApp.saveProfile({ fullName: name, birthDate: dateStr });

      const [y, m, d] = dateStr.split('-').map(Number);
      const now = new Date();

      const numbers = [
        { label: "Life Path", value: lifePath(y, m, d), desc: "The central lesson and journey of your life" },
        { label: "Expression", value: reduceNum(sumLetters(name), true), desc: "Your natural talents and how you move through the world" },
        { label: "Soul Urge", value: reduceNum(sumLetters(name, ch => VOWELS.has(ch)), true), desc: "What your heart secretly longs for" },
        { label: "Personality", value: reduceNum(sumLetters(name, ch => !VOWELS.has(ch)), true), desc: "The impression you make on others" },
        { label: "Birthday", value: reduceNum(d, true), desc: "A special gift you carry from birth" },
        { label: "Personal Year", value: reduceNum(reduceNum(m, true) + reduceNum(d, true) + reduceNum(now.getFullYear(), true), true), desc: `The theme of your ${now.getFullYear()} cycle` }
      ];

      let html = '';
      numbers.forEach(n => {
        const meaning = MEANINGS[n.value] || MEANINGS[reduceNum(n.value)];
        html += `
          <div class="interp-card num-card">
            <div class="num-badge">${n.value}</div>
            <div class="num-body">
              <h3>${n.label} — ${meaning.title}</h3>
              <div class="interp-position">${n.desc}</div>
              <div class="interp-meaning">${meaning.text}</div>
            </div>
          </div>
        `;
      });

      const el = container.querySelector('#num-result');
      el.innerHTML = html;
      el.scrollIntoView({ behavior: 'smooth' });
      if (MysticApp.adReadingDone) MysticApp.adReadingDone();
    });
  }

  MysticApp.register({
    id: 'numerology',
    name: 'Numerology',
    icon: MysticApp.icons.numerology,
    desc: 'The power of your numbers',
    subtitle: 'Life path, destiny & soul numbers',
    render
  });
})();
