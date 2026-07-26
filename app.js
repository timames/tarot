// Starfield
(function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--dur', (1.5 + Math.random() * 3) + 's');
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(star);
  }
})();

const spreadSelect = document.getElementById('spread-select');
const readingDiv = document.getElementById('reading');
const cardsContainer = document.getElementById('cards-container');
const interpretation = document.getElementById('interpretation');
const btnNewReading = document.getElementById('btn-new-reading');

let drawnCards = [];
let spreadSize = 3;
let flippedCount = 0;

// Spread selection
document.querySelectorAll('.spread-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    spreadSize = parseInt(btn.dataset.spread);
    startReading();
  });
});

btnNewReading.addEventListener('click', () => {
  readingDiv.classList.add('hidden');
  spreadSelect.classList.remove('hidden');
  interpretation.classList.add('hidden');
  btnNewReading.classList.add('hidden');
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startReading() {
  spreadSelect.classList.add('hidden');
  readingDiv.classList.remove('hidden');
  interpretation.classList.add('hidden');
  btnNewReading.classList.add('hidden');
  cardsContainer.innerHTML = '';
  flippedCount = 0;

  const shuffled = shuffle(TAROT_DECK);
  drawnCards = shuffled.slice(0, spreadSize).map(card => ({
    ...card,
    isReversed: Math.random() < 0.3
  }));

  const labels = SPREAD_LABELS[spreadSize];

  drawnCards.forEach((card, i) => {
    const slot = document.createElement('div');
    slot.className = 'card-slot';
    slot.innerHTML = `
      <div class="card ${card.isReversed ? 'reversed' : ''}" data-index="${i}">
        <div class="card-face card-back">
          <div class="card-back-pattern">
            <div class="card-back-symbol">\u2726</div>
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

    slot.addEventListener('click', () => flipCard(slot, i));
    cardsContainer.appendChild(slot);
  });
}

function flipCard(slot, index) {
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
  `;

  interpretation.innerHTML = html;
  interpretation.classList.remove('hidden');
  btnNewReading.classList.remove('hidden');
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

  const options = summaries[spreadSize];
  return options[Math.floor(Math.random() * options.length)];
}
