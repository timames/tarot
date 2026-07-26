// Daily Horoscope module — zodiac sign profiles and a seeded daily reading.
// Readings are deterministic per (sign, day) so they don't change on refresh.

const ZODIAC_SIGNS = [
  { name: "Aries", glyph: "♈", dates: "Mar 21 – Apr 19", element: "Fire", quality: "Cardinal", ruler: "Mars", traits: "Bold, ambitious, direct, passionate", compat: "Leo, Sagittarius, Gemini" },
  { name: "Taurus", glyph: "♉", dates: "Apr 20 – May 20", element: "Earth", quality: "Fixed", ruler: "Venus", traits: "Steadfast, sensual, patient, devoted", compat: "Virgo, Capricorn, Cancer" },
  { name: "Gemini", glyph: "♊", dates: "May 21 – Jun 20", element: "Air", quality: "Mutable", ruler: "Mercury", traits: "Curious, adaptable, witty, expressive", compat: "Libra, Aquarius, Aries" },
  { name: "Cancer", glyph: "♋", dates: "Jun 21 – Jul 22", element: "Water", quality: "Cardinal", ruler: "Moon", traits: "Nurturing, intuitive, protective, tenacious", compat: "Scorpio, Pisces, Taurus" },
  { name: "Leo", glyph: "♌", dates: "Jul 23 – Aug 22", element: "Fire", quality: "Fixed", ruler: "Sun", traits: "Radiant, generous, dramatic, loyal", compat: "Aries, Sagittarius, Libra" },
  { name: "Virgo", glyph: "♍", dates: "Aug 23 – Sep 22", element: "Earth", quality: "Mutable", ruler: "Mercury", traits: "Precise, analytical, helpful, modest", compat: "Taurus, Capricorn, Cancer" },
  { name: "Libra", glyph: "♎", dates: "Sep 23 – Oct 22", element: "Air", quality: "Cardinal", ruler: "Venus", traits: "Harmonious, diplomatic, charming, fair", compat: "Gemini, Aquarius, Leo" },
  { name: "Scorpio", glyph: "♏", dates: "Oct 23 – Nov 21", element: "Water", quality: "Fixed", ruler: "Pluto & Mars", traits: "Intense, magnetic, perceptive, resolute", compat: "Cancer, Pisces, Virgo" },
  { name: "Sagittarius", glyph: "♐", dates: "Nov 22 – Dec 21", element: "Fire", quality: "Mutable", ruler: "Jupiter", traits: "Adventurous, optimistic, candid, free", compat: "Aries, Leo, Aquarius" },
  { name: "Capricorn", glyph: "♑", dates: "Dec 22 – Jan 19", element: "Earth", quality: "Cardinal", ruler: "Saturn", traits: "Disciplined, ambitious, wise, enduring", compat: "Taurus, Virgo, Scorpio" },
  { name: "Aquarius", glyph: "♒", dates: "Jan 20 – Feb 18", element: "Air", quality: "Fixed", ruler: "Uranus & Saturn", traits: "Visionary, independent, humanitarian, original", compat: "Gemini, Libra, Sagittarius" },
  { name: "Pisces", glyph: "♓", dates: "Feb 19 – Mar 20", element: "Water", quality: "Mutable", ruler: "Neptune & Jupiter", traits: "Dreamy, empathic, artistic, gentle", compat: "Cancer, Scorpio, Capricorn" }
];

(function () {
  const GENERAL = [
    "The cosmos aligns to open an unexpected door — walk through it with confidence.",
    "A conversation today carries more weight than it first appears. Listen between the lines.",
    "Your instincts are sharper than usual. Trust the first quiet answer that rises within you.",
    "Something you released long ago circles back in a new form. This time, you are ready.",
    "Small, steady steps today build the foundation for a leap you'll make next month.",
    "An old pattern loosens its grip. Notice the freedom in choosing differently.",
    "The energy of the day favors beginnings. Plant a seed before sunset.",
    "What feels like a delay is actually protection. Let the timing be what it is.",
    "Someone sees your effort even when you think no one is watching.",
    "A moment of solitude today will reveal more than a week of searching."
  ];
  const LOVE = [
    "Affection deepens through honesty — say the true thing gently.",
    "A shared laugh dissolves a lingering tension. Let lightness lead.",
    "If single, an unexpected encounter carries a familiar spark. Stay open.",
    "Express appreciation out loud; unspoken warmth cannot be felt.",
    "The heart asks for patience today. Let connection unfold at its own pace.",
    "Vulnerability is your strength now — the right person will meet you there.",
    "Revisit what first drew you together; the ember still glows beneath the routine.",
    "Someone close needs your listening more than your advice."
  ];
  const CAREER = [
    "A detail others overlook becomes your advantage. Stay thorough.",
    "Collaboration multiplies your efforts today — share the vision, share the credit.",
    "Hold your boundary on what matters; flexibility everywhere else wins allies.",
    "The bold idea you've been sitting on is riper than you think. Voice it.",
    "Finish the lingering task first; momentum will carry the rest of the day.",
    "A mentor's earlier advice suddenly makes sense. Apply it now.",
    "Resources arrive when the plan is clear. Sharpen the plan.",
    "Quiet competence speaks louder than self-promotion today."
  ];
  const WELLNESS = [
    "Your body asks for rhythm — regular meals, regular rest, regular breath.",
    "Step outside; ten minutes under the open sky resets everything.",
    "Tension gathers in the shoulders of those who carry too much. Set something down.",
    "Water and movement are your medicine today.",
    "Guard the hour before sleep; let the mind land softly.",
    "A creative act — however small — restores more energy than it spends.",
    "Notice what you consume, in food and in media alike. Choose nourishment."
  ];
  const COLORS = ["Gold", "Crimson", "Emerald", "Sapphire", "Violet", "Silver", "Amber", "Rose", "Turquoise", "Ivory", "Indigo", "Copper"];
  const MOODS = ["Inspired", "Grounded", "Magnetic", "Reflective", "Bold", "Serene", "Curious", "Radiant"];

  function dailyReading(sign) {
    const rng = MysticApp.seededRng(sign.name + '|' + MysticApp.todayKey());
    return {
      general: MysticApp.pick(GENERAL, rng),
      love: MysticApp.pick(LOVE, rng),
      career: MysticApp.pick(CAREER, rng),
      wellness: MysticApp.pick(WELLNESS, rng),
      luckyNumber: Math.floor(rng() * 99) + 1,
      luckyColor: MysticApp.pick(COLORS, rng),
      mood: MysticApp.pick(MOODS, rng),
      stars: 3 + Math.floor(rng() * 3)
    };
  }

  let root = null;

  function render(container) {
    root = container;
    let html = '<div class="zodiac-grid">';
    ZODIAC_SIGNS.forEach((s, i) => {
      html += `
        <button class="zodiac-tile" data-index="${i}">
          <div class="zodiac-glyph">${s.glyph}</div>
          <div class="zodiac-name">${s.name}</div>
          <div class="zodiac-dates">${s.dates}</div>
        </button>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.zodiac-tile').forEach(tile => {
      tile.addEventListener('click', () => showSign(ZODIAC_SIGNS[parseInt(tile.dataset.index)]));
    });
  }

  function showSign(sign) {
    const r = dailyReading(sign);
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const starStr = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);

    root.innerHTML = `
      <div class="sign-header">
        <div class="sign-header-glyph">${sign.glyph}</div>
        <h2>${sign.name}</h2>
        <div class="sign-header-dates">${sign.dates}</div>
        <div class="sign-facts">
          <span><b>Element</b> ${sign.element}</span>
          <span><b>Quality</b> ${sign.quality}</span>
          <span><b>Ruler</b> ${sign.ruler}</span>
        </div>
        <div class="sign-traits">${sign.traits}</div>
      </div>

      <div class="interp-card">
        <h3>Today's Horoscope</h3>
        <div class="interp-position">${dateStr} &nbsp;·&nbsp; ${starStr}</div>
        <div class="interp-meaning">${r.general}</div>
      </div>
      <div class="interp-card">
        <h3>&#10084;&#65039; Love</h3>
        <div class="interp-meaning">${r.love}</div>
      </div>
      <div class="interp-card">
        <h3>&#128188; Career</h3>
        <div class="interp-meaning">${r.career}</div>
      </div>
      <div class="interp-card">
        <h3>&#127807; Wellness</h3>
        <div class="interp-meaning">${r.wellness}</div>
      </div>

      <div class="lucky-row">
        <div class="lucky-item"><div class="lucky-label">Lucky Number</div><div class="lucky-value">${r.luckyNumber}</div></div>
        <div class="lucky-item"><div class="lucky-label">Lucky Color</div><div class="lucky-value">${r.luckyColor}</div></div>
        <div class="lucky-item"><div class="lucky-label">Mood</div><div class="lucky-value">${r.mood}</div></div>
      </div>

      <div class="interp-summary">
        <h3>Best Matches</h3>
        <p>${sign.compat}</p>
      </div>

      <button class="btn-primary" id="btn-back-signs">All Signs</button>
    `;

    root.querySelector('#btn-back-signs').addEventListener('click', () => render(root));
    window.scrollTo(0, 0);
  }

  MysticApp.register({
    id: 'horoscope',
    name: 'Horoscope',
    icon: '&#9800;',
    desc: 'Daily zodiac guidance',
    subtitle: 'What the stars hold for today',
    render
  });
})();
