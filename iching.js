// I Ching module — 64 hexagrams cast by the traditional three-coin method.
// Lines are recorded bottom-up; changing lines produce a second hexagram.

(function () {
  // Trigram lines bottom-up (1 = yang solid, 0 = yin broken)
  const TRIGRAMS = {
    heaven: [1, 1, 1], thunder: [1, 0, 0], water: [0, 1, 0], mountain: [0, 0, 1],
    earth: [0, 0, 0], wind: [0, 1, 1], fire: [1, 0, 1], lake: [1, 1, 0]
  };

  const HEXAGRAMS = [
    { num: 1, name: "The Creative", ch: "乾", lower: "heaven", upper: "heaven", meaning: "Pure creative power flows through you. Great success comes through perseverance and alignment with your highest purpose. Act with the strength of heaven itself." },
    { num: 2, name: "The Receptive", ch: "坤", lower: "earth", upper: "earth", meaning: "Yield, receive, and nourish. Success comes not through forcing but through devotion and responsiveness. Follow rather than lead, and the way opens." },
    { num: 3, name: "Difficulty at the Beginning", ch: "屯", lower: "thunder", upper: "water", meaning: "Chaos precedes order, as a sprout struggles through soil. Persevere through initial obstacles — helpers appear when you commit to the path." },
    { num: 4, name: "Youthful Folly", ch: "蒙", lower: "water", upper: "mountain", meaning: "Inexperience is not shameful — refusing to learn is. Seek a teacher, ask sincerely, and accept guidance with humility." },
    { num: 5, name: "Waiting", ch: "需", lower: "heaven", upper: "water", meaning: "Nourishment comes to those who wait with confidence. This is not passive delay but calm certainty that the rain will fall in its season." },
    { num: 6, name: "Conflict", ch: "訟", lower: "water", upper: "heaven", meaning: "Opposition blocks the way. Do not push a dispute to its bitter end; meet others halfway. A wise arbiter helps more than victory." },
    { num: 7, name: "The Army", ch: "師", lower: "water", upper: "earth", meaning: "Discipline and organization win the day. Lead with justice and the people will follow. Strength must serve a righteous cause." },
    { num: 8, name: "Holding Together", ch: "比", lower: "earth", upper: "water", meaning: "Union brings good fortune. Seek out those who share your center. If you would unite others, examine whether your own heart is constant." },
    { num: 9, name: "Small Taming", ch: "小畜", lower: "heaven", upper: "wind", meaning: "Gentle restraint holds back the storm. Great force is not available now — succeed through small, friendly persuasions and attention to detail." },
    { num: 10, name: "Treading", ch: "履", lower: "lake", upper: "heaven", meaning: "You tread on the tiger's tail — proceed with careful courtesy. Good conduct carries you through danger untouched." },
    { num: 11, name: "Peace", ch: "泰", lower: "heaven", upper: "earth", meaning: "Heaven and earth unite; the small departs and the great arrives. A time of harmony, prosperity, and flowering. Share the abundance." },
    { num: 12, name: "Standstill", ch: "否", lower: "earth", upper: "heaven", meaning: "Heaven and earth do not meet; stagnation prevails. Withdraw into your inner worth and wait — this too shall turn." },
    { num: 13, name: "Fellowship", ch: "同人", lower: "fire", upper: "heaven", meaning: "Fellowship with others in the open brings success. Unite around a shared goal, not private interest, and even great rivers may be crossed." },
    { num: 14, name: "Great Possession", ch: "大有", lower: "heaven", upper: "fire", meaning: "Supreme success and great abundance. Possess your wealth with modesty and generosity, and it becomes a blessing rather than a burden." },
    { num: 15, name: "Modesty", ch: "謙", lower: "mountain", upper: "earth", meaning: "The mountain hides within the earth. Modesty carried through to the end brings success — what is full is diminished, what is modest is increased." },
    { num: 16, name: "Enthusiasm", ch: "豫", lower: "earth", upper: "thunder", meaning: "Thunder rises from the earth — inspiring, energizing music. Movement along the line of least resistance carries everything with it." },
    { num: 17, name: "Following", ch: "隨", lower: "thunder", upper: "lake", meaning: "To lead, first learn to follow. Adapt to the demands of the time and rest when rest is called for. Joyful movement attracts followers." },
    { num: 18, name: "Work on the Decayed", ch: "蠱", lower: "wind", upper: "mountain", meaning: "What has been spoiled through neglect can be repaired through effort. Face the decay honestly, work steadily, and renewal follows." },
    { num: 19, name: "Approach", ch: "臨", lower: "lake", upper: "earth", meaning: "The great approaches; success is near. Work joyfully while the season is favorable, for no spring lasts forever." },
    { num: 20, name: "Contemplation", ch: "觀", lower: "earth", upper: "wind", meaning: "Ascend the tower and view the currents of life. A time for observation rather than action — what you see now shapes what you build later." },
    { num: 21, name: "Biting Through", ch: "噬嗑", lower: "thunder", upper: "fire", meaning: "An obstacle must be bitten through decisively. Justice must be done clearly and energetically — half measures prolong the problem." },
    { num: 22, name: "Grace", ch: "賁", lower: "fire", upper: "mountain", meaning: "Beauty and form bring small success. Adornment gladdens the heart, but remember: grace decorates substance, it does not replace it." },
    { num: 23, name: "Splitting Apart", ch: "剝", lower: "earth", upper: "mountain", meaning: "The old structure crumbles; do not intervene. It does not further to go anywhere now. Wait quietly — collapse clears ground for renewal." },
    { num: 24, name: "Return", ch: "復", lower: "thunder", upper: "earth", meaning: "The turning point. After darkness, light returns of its own accord. Nurture the new beginning gently; do not force its growth." },
    { num: 25, name: "Innocence", ch: "無妄", lower: "thunder", upper: "heaven", meaning: "Act from natural sincerity, without scheme or expectation. The unexpected may come — meet it with an innocent heart and all goes well." },
    { num: 26, name: "Great Taming", ch: "大畜", lower: "heaven", upper: "mountain", meaning: "Great power held under control, like a mountain containing heaven. Daily renewal of character builds strength for the great undertaking ahead." },
    { num: 27, name: "Nourishment", ch: "頤", lower: "thunder", upper: "mountain", meaning: "Pay attention to what you nourish and what nourishes you — in food, in words, in thought. Tend the roots and the tree flourishes." },
    { num: 28, name: "Great Excess", ch: "大過", lower: "wind", upper: "lake", meaning: "The ridgepole sags under extraordinary weight. An exceptional time calls for extraordinary action — even standing alone without fear." },
    { num: 29, name: "The Abysmal", ch: "坎", lower: "water", upper: "water", meaning: "Danger upon danger, like water in a ravine. Flow like water: fill each low place, remain true to yourself, and you pass through unharmed." },
    { num: 30, name: "The Clinging", ch: "離", lower: "fire", upper: "fire", meaning: "Fire clings to what it burns. Clarity comes through accepting what you depend upon. Care for your inner light and it illuminates the world." },
    { num: 31, name: "Influence", ch: "咸", lower: "mountain", upper: "lake", meaning: "Mutual attraction stirs — the lake atop the mountain. Keep your heart open and unattached to outcome; genuine influence flows both ways." },
    { num: 32, name: "Duration", ch: "恆", lower: "wind", upper: "thunder", meaning: "Endurance through constant renewal. What lasts is not rigid but moves in a stable orbit. Stand firm in your direction and do not waver." },
    { num: 33, name: "Retreat", ch: "遯", lower: "mountain", upper: "heaven", meaning: "Strategic withdrawal is not defeat. Retire at the right moment, with dignity, and preserve your strength for a better season." },
    { num: 34, name: "Great Power", ch: "大壯", lower: "heaven", upper: "thunder", meaning: "Thunder in heaven above — great vigor is yours. True power stays aligned with what is right; movement in harmony with justice cannot be stopped." },
    { num: 35, name: "Progress", ch: "晉", lower: "earth", upper: "fire", meaning: "The sun rises over the earth — rapid, easy advance. Clarity and virtue are recognized and rewarded. Rise, and lift others as you go." },
    { num: 36, name: "Darkening of the Light", ch: "明夷", lower: "fire", upper: "earth", meaning: "The light hides beneath the earth. In dark times, veil your brilliance yet keep your inner lamp burning. Protect what is precious quietly." },
    { num: 37, name: "The Family", ch: "家人", lower: "fire", upper: "wind", meaning: "Wind arises from fire: influence spreads from within the home outward. Order the inner circle with warmth and clear roles, and the outer world follows." },
    { num: 38, name: "Opposition", ch: "睽", lower: "lake", upper: "fire", meaning: "Fire rises, the lake sinks — estrangement. Yet in small matters, opposition can still yield success. Seek unity within diversity, not uniformity." },
    { num: 39, name: "Obstruction", ch: "蹇", lower: "mountain", upper: "water", meaning: "An obstacle blocks the way forward. Do not blame others — turn inward, join with friends, and seek wise counsel. The detour is the path." },
    { num: 40, name: "Deliverance", ch: "解", lower: "water", upper: "thunder", meaning: "The storm breaks and tension releases. Forgive misdeeds, let go of what is finished, and return to normal life without lingering." },
    { num: 41, name: "Decrease", ch: "損", lower: "lake", upper: "mountain", meaning: "Decrease is not always loss. Simplify, curb what is excessive, and sincerity transforms sacrifice into gain." },
    { num: 42, name: "Increase", ch: "益", lower: "thunder", upper: "wind", meaning: "A time of blessing and increase — use it. Undertake the great crossing now. To increase others is ultimately to increase yourself." },
    { num: 43, name: "Breakthrough", ch: "夬", lower: "heaven", upper: "lake", meaning: "Resolution: the matter must be openly declared. Announce the truth, but do not resort to force — the last vestige of darkness yields to persistent light." },
    { num: 44, name: "Coming to Meet", ch: "姤", lower: "wind", upper: "heaven", meaning: "A seemingly harmless influence arrives seeking entry. Be gracious but discerning — what is small now grows if given ground." },
    { num: 45, name: "Gathering Together", ch: "萃", lower: "earth", upper: "lake", meaning: "The lake gathers upon the earth — people assemble around a center. Great things are possible in community; prepare for the unexpected as crowds form." },
    { num: 46, name: "Pushing Upward", ch: "升", lower: "wind", upper: "earth", meaning: "Growth like a tree pushing up through the earth — effortless, steady, unseen. Advance step by step; small accumulations become great heights." },
    { num: 47, name: "Oppression", ch: "困", lower: "water", upper: "lake", meaning: "The lake is drained; a time of exhaustion. Words are not believed now — remain cheerful in adversity and let inner strength speak instead." },
    { num: 48, name: "The Well", ch: "井", lower: "wind", upper: "water", meaning: "The town may change but the well remains. Return to the inexhaustible source within. Tend your well — a good spring serves all who come." },
    { num: 49, name: "Revolution", ch: "革", lower: "fire", upper: "lake", meaning: "Fire and water contend: radical change is due. Revolution succeeds only when the time is ripe and the cause is genuine. On your own day, you are believed." },
    { num: 50, name: "The Cauldron", ch: "鼎", lower: "wind", upper: "fire", meaning: "The sacred vessel transforms raw into refined. Nourish what is worthy and offer your finest to the highest purpose. Great fortune flows." },
    { num: 51, name: "The Arousing", ch: "震", lower: "thunder", upper: "thunder", meaning: "Shock! Thunder rolls twice. The upheaval that frightens also awakens. Keep inner composure while the world trembles, and laughter follows the storm." },
    { num: 52, name: "Keeping Still", ch: "艮", lower: "mountain", upper: "mountain", meaning: "Mountain upon mountain: stillness. Rest when it is time to rest; act when it is time to act. In deep stillness, the ego's clamor fades." },
    { num: 53, name: "Gradual Development", ch: "漸", lower: "mountain", upper: "wind", meaning: "The tree on the mountain grows slowly and stands visible to all. Progress by patient, orderly steps — what develops gradually endures." },
    { num: 54, name: "The Marrying Maiden", ch: "歸妹", lower: "lake", upper: "thunder", meaning: "You enter a situation you do not control. Tact, reserve, and awareness of your position carry you through. Keep the distant goal in sight." },
    { num: 55, name: "Abundance", ch: "豐", lower: "fire", upper: "thunder", meaning: "Clarity within, movement without — the zenith of fullness. Be like the sun at midday: shine on all without sorrow that noon must pass." },
    { num: 56, name: "The Wanderer", ch: "旅", lower: "mountain", upper: "fire", meaning: "You are a stranger in a strange land. Travel light, be courteous and reserved, and do not entangle yourself — small successes attend the careful traveler." },
    { num: 57, name: "The Gentle", ch: "巽", lower: "wind", upper: "wind", meaning: "Wind follows wind — gentle, persistent influence. Small, continuous efforts in a clear direction accomplish what force cannot." },
    { num: 58, name: "The Joyous", ch: "兌", lower: "lake", upper: "lake", meaning: "Lake mirrors lake — shared joy. True joy rests on inner firmness and expresses as gentleness. Learning with friends multiplies delight." },
    { num: 59, name: "Dispersion", ch: "渙", lower: "water", upper: "wind", meaning: "Wind moves over water, dissolving what is rigid and frozen. Divisions, egotism, and hardness melt away. Reunite what has scattered." },
    { num: 60, name: "Limitation", ch: "節", lower: "lake", upper: "water", meaning: "Limits give life form, as banks give the river its power. Set measures joyfully — but do not make limitation bitter or it cannot endure." },
    { num: 61, name: "Inner Truth", ch: "中孚", lower: "lake", upper: "wind", meaning: "Wind stirs the lake's surface: the invisible moves the visible. Sincerity that reaches the heart transforms even the stubborn. Even pigs and fishes respond." },
    { num: 62, name: "Small Excess", ch: "小過", lower: "mountain", upper: "thunder", meaning: "The small bird should not fly too high. A time for small deeds done with great conscientiousness — exceptional modesty, not grand ambitions." },
    { num: 63, name: "After Completion", ch: "既濟", lower: "fire", upper: "water", meaning: "Everything is in its place — and that is exactly the danger. At the moment of completion, only vigilance in small matters preserves order." },
    { num: 64, name: "Before Completion", ch: "未濟", lower: "water", upper: "fire", meaning: "The crossing is nearly made, but the fox's tail is not yet dry. Deliberate care in the final steps turns near-success into true completion." }
  ];

  // Lookup by six-line key, bottom-up
  const BY_KEY = {};
  HEXAGRAMS.forEach(h => {
    const key = [...TRIGRAMS[h.lower], ...TRIGRAMS[h.upper]].join('');
    BY_KEY[key] = h;
  });

  function lookup(lines) { return BY_KEY[lines.join('')]; }

  function castLine(rng) {
    // Three coins: heads = 3, tails = 2. 6 old yin, 7 yang, 8 yin, 9 old yang.
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += rng() < 0.5 ? 2 : 3;
    return sum;
  }

  function linesHtml(values, changing) {
    // Render top line first
    let html = '<div class="hexagram">';
    for (let i = values.length - 1; i >= 0; i--) {
      const yang = values[i] === 1;
      const chg = changing && changing[i];
      html += `<div class="hex-line ${yang ? 'yang' : 'yin'} ${chg ? 'changing' : ''}">` +
        (yang ? '<span class="hl full"></span>' : '<span class="hl half"></span><span class="hl half"></span>') +
        (chg ? '<span class="hex-dot">●</span>' : '') +
        '</div>';
    }
    return html + '</div>';
  }

  function render(container) {
    container.innerHTML = `
      <div class="iching-intro">
        <p class="form-note">Hold your question in mind, then cast the coins. Six lines build your hexagram from the bottom up. Changing lines reveal a second hexagram — the direction your situation is moving.</p>
        <button class="btn-primary" id="btn-cast">Cast the Coins</button>
      </div>
      <div id="iching-result"></div>
    `;
    container.querySelector('#btn-cast').addEventListener('click', () => cast(container));
  }

  function cast(container) {
    const rng = MysticApp.natureRng();
    const casts = [];
    for (let i = 0; i < 6; i++) casts.push(castLine(rng));
    const primaryLines = casts.map(v => (v === 7 || v === 9) ? 1 : 0);
    const changing = casts.map(v => v === 6 || v === 9);
    const hasChanges = changing.some(Boolean);
    const secondaryLines = casts.map((v, i) => changing[i] ? (primaryLines[i] === 1 ? 0 : 1) : primaryLines[i]);

    const primary = lookup(primaryLines);
    const secondary = hasChanges ? lookup(secondaryLines) : null;

    let html = `
      <div class="iching-reading">
        <div class="hex-display">
          ${linesHtml(primaryLines, changing)}
          <div class="hex-caption">
            <div class="hex-num">Hexagram ${primary.num} · ${primary.ch}</div>
            <div class="hex-name">${primary.name}</div>
          </div>
        </div>
        <div class="interp-card">
          <h3>${primary.ch} ${primary.name}</h3>
          <div class="interp-meaning">${primary.meaning}</div>
        </div>
    `;

    if (secondary) {
      const changedNums = changing.map((c, i) => c ? i + 1 : null).filter(Boolean);
      html += `
        <div class="interp-position hex-changing-note">Changing line${changedNums.length > 1 ? 's' : ''}: ${changedNums.join(', ')} — becoming…</div>
        <div class="hex-display">
          ${linesHtml(secondaryLines)}
          <div class="hex-caption">
            <div class="hex-num">Hexagram ${secondary.num} · ${secondary.ch}</div>
            <div class="hex-name">${secondary.name}</div>
          </div>
        </div>
        <div class="interp-card">
          <h3>${secondary.ch} ${secondary.name}</h3>
          <div class="interp-meaning">${secondary.meaning}</div>
        </div>
      `;
    } else {
      html += `<div class="interp-position hex-changing-note">No changing lines — the situation is stable.</div>`;
    }

    html += `<div class="sky-stamp">${MysticApp.skyStamp()}</div>`;
    html += `<button class="btn-primary" id="btn-recast">Cast Again</button></div>`;
    const result = container.querySelector('#iching-result');
    result.innerHTML = html;
    container.querySelector('.iching-intro').classList.add('hidden');
    result.querySelector('#btn-recast').addEventListener('click', () => render(container));
  }

  MysticApp.register({
    id: 'iching',
    name: 'I Ching',
    icon: '&#9775;',
    desc: 'The Book of Changes',
    subtitle: 'Cast the coins, read the changes',
    render
  });
})();
