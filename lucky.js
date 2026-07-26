// Lucky Numbers module — draw a chosen amount of unique numbers,
// seeded by the sky at the moment of the draw.

(function () {
  let count = 6;
  let root = null;

  function render(container) {
    root = container;
    container.innerHTML = `
      <div class="lucky-picker">
        <p class="form-note">Choose how many numbers fate should hand you, and the highest number in play. Perfect for lottery picks or any moment that needs a number.</p>
        <div class="lucky-controls">
          <div class="lucky-control">
            <span class="lucky-control-label">How many</span>
            <div class="stepper">
              <button type="button" class="stepper-btn" id="lucky-minus">−</button>
              <span class="stepper-value" id="lucky-count">${count}</span>
              <button type="button" class="stepper-btn" id="lucky-plus">+</button>
            </div>
          </div>
          <div class="lucky-control">
            <span class="lucky-control-label">Highest number</span>
            <input type="number" id="lucky-max" class="lucky-max-input" min="2" max="999" value="49">
          </div>
        </div>
        <button class="btn-primary" id="btn-draw-lucky">Draw My Numbers</button>
      </div>
      <div id="lucky-result"></div>
    `;

    const countEl = container.querySelector('#lucky-count');
    container.querySelector('#lucky-minus').addEventListener('click', () => {
      count = Math.max(1, count - 1);
      countEl.textContent = count;
    });
    container.querySelector('#lucky-plus').addEventListener('click', () => {
      count = Math.min(12, count + 1);
      countEl.textContent = count;
    });
    container.querySelector('#btn-draw-lucky').addEventListener('click', draw);
  }

  function draw() {
    let max = parseInt(root.querySelector('#lucky-max').value, 10);
    if (isNaN(max) || max < 2) max = 49;
    if (max > 999) max = 999;
    root.querySelector('#lucky-max').value = max;
    const n = Math.min(count, max);

    const rng = MysticApp.natureRng();
    const pool = Array.from({ length: max }, (_, i) => i + 1);
    const numbers = MysticApp.shuffle(pool, rng).slice(0, n).sort((a, b) => a - b);

    let html = '<div class="lucky-orbs">';
    numbers.forEach((num, i) => {
      html += `<div class="lucky-orb" style="animation-delay:${i * 0.12}s">${num}</div>`;
    });
    html += '</div>';
    html += `<div class="sky-stamp">${MysticApp.skyStamp()}</div>`;

    root.querySelector('#lucky-result').innerHTML = html;
  }

  MysticApp.register({
    id: 'lucky',
    name: 'Lucky Numbers',
    icon: MysticApp.icons.lucky,
    desc: 'Numbers drawn by the sky',
    subtitle: 'Fortune favors the chosen few',
    render
  });
})();
