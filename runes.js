// Runes module — Elder Futhark casting. Some runes are symmetric and
// cannot appear reversed (rev: null).

(function () {
  const RUNES = [
    { name: "Fehu", glyph: "ᚠ", meaning: "Wealth, abundance, new resources. Prosperity flows toward you — circulate it wisely, for hoarded wealth stagnates.", rev: "Loss, blocked abundance, misplaced values. Examine your relationship with what you own." },
    { name: "Uruz", glyph: "ᚢ", meaning: "Primal strength, vitality, untamed potential. The wild ox lends you endurance for the challenge ahead.", rev: "Weakness, missed opportunity, force misdirected. Rebuild your strength before charging." },
    { name: "Thurisaz", glyph: "ᚦ", meaning: "The thorn, a protective force, catalytic conflict. A gateway moment — pause and gather yourself before passing through.", rev: "Defenselessness, haste, spite. Do not act while angry; the thorn cuts both ways." },
    { name: "Ansuz", glyph: "ᚨ", meaning: "Divine breath, messages, wisdom received. Listen — a signal, advice, or insight arrives from beyond your ordinary knowing.", rev: "Miscommunication, trickery, words twisted. Verify what you hear before acting on it." },
    { name: "Raidho", glyph: "ᚱ", meaning: "The journey, rhythm, right movement. Travel — outer or inner — proceeds in harmony. Trust the road.", rev: "Disrupted plans, delays, a journey against the grain. Reconsider the route, not the destination." },
    { name: "Kenaz", glyph: "ᚲ", meaning: "The torch, creative fire, revelation. Knowledge kindles and illuminates — apply your skill with passion.", rev: "Darkness, a creative block, withheld knowledge. Feed your inner flame before it gutters." },
    { name: "Gebo", glyph: "ᚷ", meaning: "The gift, exchange, partnership. Generosity binds giver and receiver — a balanced union blesses both.", rev: null },
    { name: "Wunjo", glyph: "ᚹ", meaning: "Joy, harmony, fellowship. Sorrow lifts; comfort and clarity return. Shared happiness multiplies.", rev: "Sorrow, strife, delayed joy. The clouds are temporary — hold to your kin and your purpose." },
    { name: "Hagalaz", glyph: "ᚺ", meaning: "Hail, disruption from without, radical weather. What is destroyed was not sound. After the storm, sow anew in cleared ground.", rev: null },
    { name: "Nauthiz", glyph: "ᚾ", meaning: "Need, constraint, the fire of necessity. Restriction teaches resourcefulness — patience now is strength later.", rev: "Deprivation grinding the spirit. Distinguish true need from fear; ask for help." },
    { name: "Isa", glyph: "ᛁ", meaning: "Ice, stillness, a freeze on activity. Nothing moves now — and nothing needs to. Preserve, wait, and let clarity crystallize.", rev: null },
    { name: "Jera", glyph: "ᛃ", meaning: "Harvest, the year's cycle, earned reward. What you planted with care ripens in its season. No effort has been wasted.", rev: null },
    { name: "Eihwaz", glyph: "ᛇ", meaning: "The yew tree, endurance, the axis between worlds. Rooted resilience carries you through transformation. Death of the old feeds the new.", rev: null },
    { name: "Perthro", glyph: "ᛈ", meaning: "The dice cup, mystery, fate in motion. Hidden forces work in your favor — secrets, chance, and things not yet revealed.", rev: "Secrets working against you, stagnant luck. Do not gamble what you cannot lose." },
    { name: "Algiz", glyph: "ᛉ", meaning: "The elk, protection, higher guidance. You are shielded — instincts warn you in time. Keep your guard gracefully.", rev: "Vulnerability, ignored warnings. Retreat from what drains you; strengthen your defenses." },
    { name: "Sowilo", glyph: "ᛊ", meaning: "The sun, wholeness, victory. Life-force floods in; the goal is reachable. Let your true self shine without apology.", rev: null },
    { name: "Tiwaz", glyph: "ᛏ", meaning: "The warrior's rune, justice, sacrifice for honor. Courage in a just cause prevails. Lead with integrity even at a cost.", rev: "Injustice, wavering conviction, energy spent in a wrong cause. Re-examine what you fight for." },
    { name: "Berkano", glyph: "ᛒ", meaning: "The birch, birth, renewal, nurturing growth. Something new is being born — tend it gently and it flourishes.", rev: "Stalled growth, family friction, neglected beginnings. Return care to the root." },
    { name: "Ehwaz", glyph: "ᛖ", meaning: "The horse, partnership, trust in motion. Progress comes through loyal cooperation — two moving as one.", rev: "Mistrust, restlessness, a partnership out of step. Re-establish trust before the next leg." },
    { name: "Mannaz", glyph: "ᛗ", meaning: "The self, humanity, mutual aid. Know yourself clearly and your place among others. Support arrives through community.", rev: "Isolation, self-deception, an enemy of your own making. Seek honest mirrors." },
    { name: "Laguz", glyph: "ᛚ", meaning: "Water, intuition, the flow of the unconscious. Follow the current of feeling — dreams and instincts speak truly now.", rev: "Emotional flood or drought, intuition ignored. Come back to the shoreline and breathe." },
    { name: "Ingwaz", glyph: "ᛜ", meaning: "The seed, gestation, completion of a phase. Energy gathers quietly toward release. Rest — the work is ripening on its own.", rev: null },
    { name: "Dagaz", glyph: "ᛞ", meaning: "Daybreak, awakening, breakthrough. Darkness turns to light in a single moment of clarity. Transformation completes itself.", rev: null },
    { name: "Othala", glyph: "ᛟ", meaning: "Ancestral home, inheritance, what endures. Your roots hold treasure — heritage, family, and hard-won ground.", rev: "Rootlessness, family discord, clinging to what must be released. Honor the past without living in it." }
  ];

  function render(container) {
    container.innerHTML = `
      <div class="spread-select">
        <h2>Cast the Runes</h2>
        <div class="spread-options">
          <button class="spread-btn" data-count="1">
            <div class="spread-icon">ᚠ</div>
            <div class="spread-name">Single Rune</div>
            <div class="spread-desc">One clear answer</div>
          </button>
          <button class="spread-btn" data-count="3">
            <div class="spread-icon">ᚠᚢᚦ</div>
            <div class="spread-name">Three Runes</div>
            <div class="spread-desc">Past, Present, Future</div>
          </button>
        </div>
      </div>
      <div id="rune-result"></div>
    `;

    container.querySelectorAll('.spread-btn').forEach(btn => {
      btn.addEventListener('click', () => draw(container, parseInt(btn.dataset.count)));
    });
  }

  function draw(container, count) {
    const labels = count === 3 ? ["Past", "Present", "Future"] : ["Guidance"];
    const rng = MysticApp.natureRng();
    const drawn = MysticApp.shuffle(RUNES, rng).slice(0, count).map(r => ({
      ...r,
      isReversed: r.rev !== null && rng() < 0.35
    }));

    let html = '<div class="rune-row">';
    drawn.forEach((r, i) => {
      html += `
        <div class="rune-stone ${r.isReversed ? 'reversed' : ''}" style="animation-delay:${i * 0.2}s">
          <div class="rune-glyph">${r.glyph}</div>
          <div class="rune-label">${labels[i]}</div>
        </div>
      `;
    });
    html += '</div>';

    drawn.forEach((r, i) => {
      html += `
        <div class="interp-card">
          <h3><span class="rune-inline ${r.isReversed ? 'reversed' : ''}">${r.glyph}</span> ${r.name}${r.isReversed ? ' (Reversed)' : ''}</h3>
          <div class="interp-position">${labels[i]}</div>
          <div class="interp-meaning">${r.isReversed ? r.rev : r.meaning}</div>
        </div>
      `;
    });

    html += `<div class="sky-stamp">${MysticApp.skyStamp()}</div>`;
    html += `<button class="btn-primary" id="btn-recast-runes">Cast Again</button>`;
    const result = container.querySelector('#rune-result');
    result.innerHTML = html;
    container.querySelector('.spread-select').classList.add('hidden');
    result.querySelector('#btn-recast-runes').addEventListener('click', () => render(container));
    window.scrollTo(0, 0);
  }

  MysticApp.register({
    id: 'runes',
    name: 'Runes',
    icon: MysticApp.icons.runes,
    desc: 'Elder Futhark casting',
    subtitle: 'Whispers of the old North',
    render
  });
})();
