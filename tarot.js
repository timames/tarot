// Tarot module — card spreads with flip animation and interpretation.

(function () {
  let drawnCards = [];
  let spreadSize = 3;
  let flippedCount = 0;
  let root = null;

  function render(container) {
    root = container;
    container.innerHTML = `
      <div class="spread-select" id="spread-select">
        <h2>Choose Your Reading</h2>
        <div class="spread-options">
          <button class="spread-btn" data-spread="1">
            <div class="spread-icon">&#9733;</div>
            <div class="spread-name">Single Card</div>
            <div class="spread-desc">Quick daily guidance</div>
          </button>
          <button class="spread-btn" data-spread="3">
            <div class="spread-icon">&#9733;&#9733;&#9733;</div>
            <div class="spread-name">Three Card</div>
            <div class="spread-desc">Past, Present, Future</div>
          </button>
          <button class="spread-btn" data-spread="5">
            <div class="spread-icon">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div class="spread-name">Five Card</div>
            <div class="spread-desc">Cross spread for deeper insight</div>
          </button>
        </div>
      </div>

      <div class="reading hidden" id="tarot-reading">
        <div class="cards-container" id="cards-container"></div>
        <div class="interpretation hidden" id="tarot-interpretation"></div>
        <button class="btn-primary hidden" id="btn-new-reading">New Reading</button>
      </div>
    `;

    container.querySelectorAll('.spread-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        spreadSize = parseInt(btn.dataset.spread);
        startReading();
      });
    });

    container.querySelector('#btn-new-reading').addEventListener('click', () => {
      root.querySelector('#tarot-reading').classList.add('hidden');
      root.querySelector('#spread-select').classList.remove('hidden');
    });
  }

  function startReading() {
    const spreadSelect = root.querySelector('#spread-select');
    const readingDiv = root.querySelector('#tarot-reading');
    const cardsContainer = root.querySelector('#cards-container');

    spreadSelect.classList.add('hidden');
    readingDiv.classList.remove('hidden');
    root.querySelector('#tarot-interpretation').classList.add('hidden');
    root.querySelector('#btn-new-reading').classList.add('hidden');
    cardsContainer.innerHTML = '';
    flippedCount = 0;

    const rng = MysticApp.natureRng();
    const shuffled = MysticApp.shuffle(TAROT_DECK, rng);
    drawnCards = shuffled.slice(0, spreadSize).map(card => ({
      ...card,
      isReversed: rng() < 0.3
    }));

    const labels = SPREAD_LABELS[spreadSize];

    drawnCards.forEach((card, i) => {
      const slot = document.createElement('div');
      slot.className = 'card-slot';
      slot.innerHTML = `
        <div class="card ${card.isReversed ? 'reversed' : ''}" data-index="${i}">
          <div class="card-face card-back">
            <div class="card-back-pattern">
              <div class="card-back-symbol">✦</div>
            </div>
          </div>
          <div class="card-face card-front">
            <div class="card-numeral">${card.numeral}</div>
            <div class="card-illustration">${CARD_ART[card.name] || card.icon}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-suit">${card.suit}${card.isReversed ? ' (Reversed)' : ''}</div>
          </div>
        </div>
        <div class="card-slot-label">${labels[i]}</div>
      `;

      slot.addEventListener('click', () => flipCard(slot));
      cardsContainer.appendChild(slot);
    });
  }

  function flipCard(slot) {
    const card = slot.querySelector('.card');
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');
    flippedCount++;

    if (flippedCount === spreadSize) {
      setTimeout(showInterpretation, 900);
    }
  }

  function showInterpretation() {
    const labels = SPREAD_LABELS[spreadSize];
    let html = '';

    drawnCards.forEach((card, i) => {
      const meaning = card.isReversed ? card.reversed : card.upright;
      html += `
        <div class="interp-card">
          <h3>${card.icon} ${card.name}</h3>
          <div class="interp-position">${labels[i]}</div>
          ${card.isReversed ? '<div class="interp-reversed">Reversed</div>' : ''}
          <div class="interp-meaning">${meaning}</div>
        </div>
      `;
    });

    html += `
      <div class="interp-summary">
        <h3>Reading Summary</h3>
        <p>${generateSummary()}</p>
      </div>
      <div class="sky-stamp">${MysticApp.skyStamp()}</div>
    `;

    const interpretation = root.querySelector('#tarot-interpretation');
    interpretation.innerHTML = html;
    interpretation.classList.remove('hidden');
    root.querySelector('#btn-new-reading').classList.remove('hidden');
  }

  function generateSummary() {
    const summaries = {
      1: [
        "This card speaks directly to your current moment. Let its wisdom guide your day.",
        "The universe has a clear message for you today. Reflect on how this card resonates with your inner truth.",
        "A single card, a single truth. Carry this insight with you as you move through your day."
      ],
      3: [
        "Your past has shaped you, your present challenges you, and your future awaits your choices. The cards reveal a journey of transformation unfolding in your life.",
        "The threads of time weave together in this reading. What was, what is, and what may be are all connected by the choices you make now.",
        "These three cards paint a portrait of your journey. Honor where you've been, engage with where you are, and step boldly toward where you're going."
      ],
      5: [
        "This cross spread reveals the deeper forces at play in your life. The visible and hidden influences converge to illuminate your path forward.",
        "Five cards reveal five facets of your situation. Together they form a map of the energies, challenges, and potential that surround you now.",
        "The cross illuminates what lies beneath the surface. Trust the wisdom of the cards as you navigate the complexities revealed in this reading."
      ]
    };

    return MysticApp.pick(summaries[spreadSize]);
  }

  MysticApp.register({
    id: 'tarot',
    name: 'Tarot',
    icon: MysticApp.icons.tarot,
    desc: 'Card spreads & readings',
    subtitle: 'Unveil the wisdom of the cards',
    render
  });
})();
