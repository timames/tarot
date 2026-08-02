// Chinese Zodiac module — animal and element from the sexagenary cycle.
// The zodiac year begins at Lunar New Year, which we find astronomically:
// the new moon falling between Jan 21 and Feb 21 (China Standard Time),
// using the same lunar engine as the rest of the app.

(function () {
  const ANIMALS = [
    { name: "Rat", emoji: "🐀", traits: "Quick-witted, resourceful, and charming. Rats spot opportunity before anyone else and thrive on their wits.", strengths: "adaptability, intelligence, sociability", watch: "restlessness and opportunism" },
    { name: "Ox", emoji: "🐂", traits: "Diligent, dependable, and strong. The Ox builds success slowly and surely, with patience others lack.", strengths: "endurance, honesty, method", watch: "stubbornness and reluctance to change" },
    { name: "Tiger", emoji: "🐅", traits: "Brave, competitive, and magnetic. Tigers charge at life, natural leaders with a flair for drama.", strengths: "courage, confidence, charisma", watch: "impulsiveness and pride" },
    { name: "Rabbit", emoji: "🐇", traits: "Gentle, elegant, and alert. Rabbits move through life with quiet grace and diplomatic skill.", strengths: "kindness, tact, artistry", watch: "avoidance of conflict and hesitation" },
    { name: "Dragon", emoji: "🐉", traits: "Confident, ambitious, and lucky. The only mythical animal of the cycle — Dragons are born to stand out.", strengths: "vision, energy, fearlessness", watch: "arrogance and intensity" },
    { name: "Snake", emoji: "🐍", traits: "Wise, enigmatic, and intuitive. Snakes think deeply, speak sparingly, and act with precision.", strengths: "insight, composure, determination", watch: "secrecy and jealousy" },
    { name: "Horse", emoji: "🐎", traits: "Energetic, independent, and free-spirited. Horses gallop toward the horizon and inspire everyone watching.", strengths: "enthusiasm, honesty, drive", watch: "impatience and wanderlust" },
    { name: "Goat", emoji: "🐐", traits: "Creative, compassionate, and easygoing. Goats bring beauty and peace wherever they graze.", strengths: "imagination, empathy, gentleness", watch: "worry and indecision" },
    { name: "Monkey", emoji: "🐒", traits: "Clever, playful, and inventive. Monkeys solve problems with a grin and a trick no one saw coming.", strengths: "ingenuity, versatility, humor", watch: "mischief and inconsistency" },
    { name: "Rooster", emoji: "🐓", traits: "Observant, hardworking, and proud. Roosters keep exacting standards and announce the truth at dawn.", strengths: "precision, courage, candor", watch: "criticism and vanity" },
    { name: "Dog", emoji: "🐕", traits: "Loyal, honest, and protective. A Dog's friendship, once given, is for life.", strengths: "faithfulness, justice, sincerity", watch: "anxiety and pessimism" },
    { name: "Pig", emoji: "🐖", traits: "Generous, sincere, and good-humored. Pigs enjoy life's pleasures and share them freely.", strengths: "warmth, tolerance, diligence", watch: "naivety and indulgence" }
  ];

  const ELEMENTS = {
    Wood: "growth, flexibility, and idealism — you build and branch outward",
    Fire: "passion, dynamism, and leadership — you ignite and illuminate",
    Earth: "stability, honesty, and patience — you ground and nourish",
    Metal: "resolve, precision, and ambition — you cut through and endure",
    Water: "wisdom, adaptability, and persuasion — you flow around every obstacle"
  };
  const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

  // Allies (trines) and secret friends
  const TRINES = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
  const SECRET = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };

  function elongationAt(utcMs) {
    const t = new Date(utcMs);
    const d = AstroEngine.dayNumber(
      t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(),
      t.getUTCHours() + t.getUTCMinutes() / 60
    );
    return AstroEngine.rev(AstroEngine.moonPosition(d).lon - AstroEngine.sunPosition(d).lon);
  }

  // Lunar New Year for a given western year: the new moon between
  // Jan 21 and Feb 21, expressed as a date in China Standard Time (UTC+8).
  function lunarNewYear(year) {
    let prev = elongationAt(Date.UTC(year, 0, 20));
    for (let h = 1; h <= 24 * 33; h++) {
      const ms = Date.UTC(year, 0, 20) + h * 3600e3;
      const e = elongationAt(ms);
      if (prev > 300 && e < 60) {
        const cst = new Date(ms + 8 * 3600e3);
        return { month: cst.getUTCMonth() + 1, day: cst.getUTCDate() };
      }
      prev = e;
    }
    return { month: 2, day: 4 }; // unreachable fallback
  }

  function zodiacYear(y, m, d) {
    if (m <= 2) {
      const cny = lunarNewYear(y);
      if (m < cny.month || (m === cny.month && d < cny.day)) return { year: y - 1, cny };
      return { year: y, cny };
    }
    return { year: y, cny: null };
  }

  function animalIndex(zy) { return ((zy - 4) % 12 + 12) % 12; }
  function elementOf(zy) { return ELEMENT_ORDER[Math.floor((((zy - 4) % 10 + 10) % 10) / 2)]; }

  function render(container) {
    const p = MysticApp.getProfile();
    container.innerHTML = `
      <form class="mystic-form" id="cz-form">
        <p class="form-note">The zodiac year turns at Lunar New Year, not January 1st — this chart finds the actual new moon, so winter births land on the right animal.</p>
        <label>Birth date
          <input type="date" id="cz-date" required value="${MysticApp.esc(p.birthDate || '')}">
        </label>
        <button type="submit" class="btn-primary">Find My Animal</button>
      </form>
      <div id="cz-result"></div>
    `;

    container.querySelector('#cz-form').addEventListener('submit', e => {
      e.preventDefault();
      const dateStr = container.querySelector('#cz-date').value;
      if (!dateStr) return;
      MysticApp.saveProfile({ birthDate: dateStr });

      const [y, m, d] = dateStr.split('-').map(Number);
      const z = zodiacYear(y, m, d);
      const idx = animalIndex(z.year);
      const animal = ANIMALS[idx];
      const element = elementOf(z.year);

      const allies = TRINES.find(t => t.includes(idx)).filter(i => i !== idx).map(i => ANIMALS[i]);
      const secret = ANIMALS[SECRET[idx]];
      const clash = ANIMALS[(idx + 6) % 12];

      const nowYear = new Date().getFullYear();
      const nowIdx = animalIndex(nowYear);
      const nowAnimal = ANIMALS[nowIdx];
      const nowElement = elementOf(nowYear);
      const sameTrine = TRINES.find(t => t.includes(idx)).includes(nowIdx);
      const yearNote = nowIdx === idx
        ? "This is your own animal's year — tradition calls Ben Ming Nian a year of challenge and growth. Wear something red."
        : sameTrine
          ? "This year's animal is one of your allies — the current winds blow in your favor."
          : nowIdx === (idx + 6) % 12
            ? "This year's animal is your opposite — move deliberately and pick your battles."
            : "A neutral year for your sign — your fortune is what you make of it.";

      let html = `
        <div class="sign-header">
          <div class="cz-emoji">${animal.emoji}</div>
          <h2>${element} ${animal.name}</h2>
          <div class="sign-header-dates">Year of the ${animal.name} · ${z.year}</div>
          ${z.cny ? `<div class="sign-header-dates">Lunar New Year that year fell on ${z.cny.month === 1 ? 'January' : 'February'} ${z.cny.day}</div>` : ''}
        </div>

        <div class="interp-card featured">
          <h3><span class="cz-tint">${animal.emoji}</span> The ${animal.name}</h3>
          <div class="interp-meaning">${animal.traits}</div>
        </div>
        <div class="interp-card">
          <h3>Your Element — ${element}</h3>
          <div class="interp-meaning">The ${element} ${animal.name} carries ${ELEMENTS[element]}. Strengths: ${animal.strengths}. Watch for ${animal.watch}.</div>
        </div>

        <div class="lucky-row">
          <div class="lucky-item"><div class="lucky-label">Allies</div><div class="lucky-value">${allies.map(a => '<span class="cz-tint">' + a.emoji + '</span> ' + a.name).join(' · ')}</div></div>
          <div class="lucky-item"><div class="lucky-label">Secret Friend</div><div class="lucky-value"><span class="cz-tint">${secret.emoji}</span> ${secret.name}</div></div>
          <div class="lucky-item"><div class="lucky-label">Opposite</div><div class="lucky-value"><span class="cz-tint">${clash.emoji}</span> ${clash.name}</div></div>
        </div>

        <div class="interp-summary">
          <h3>${nowYear} — Year of the ${nowElement} ${nowAnimal.name}</h3>
          <p>${yearNote}</p>
        </div>
      `;

      const el = container.querySelector('#cz-result');
      el.innerHTML = html;
      el.scrollIntoView({ behavior: 'smooth' });
      if (MysticApp.adReadingDone) MysticApp.adReadingDone();
    });
  }

  MysticApp.register({
    id: 'chinese',
    name: 'Chinese Zodiac',
    icon: MysticApp.icons.chinese,
    desc: 'Your animal & element',
    subtitle: 'Twelve animals, five elements',
    render
  });
})();
