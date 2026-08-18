// "Arcana Pairs" — memory-match mini game for the Sanctum.
// 4x4 grid, 8 pairs drawn from the tarot deck with natureRng(). Winning grants
// a loot box via ctx.awardWin() (capped per day by the registry); past the cap
// the board still plays for glory.

(function () {
  if (!MysticApp.gamify) return;

  const PAIRS = 8;
  const MISMATCH_MS = 750;

  function render(container, ctx) {
    let first = null, lock = false, moves = 0, matched = 0;

    const rng = MysticApp.natureRng();
    const chosen = MysticApp.shuffle(TAROT_DECK, rng).slice(0, PAIRS);
    const tiles = MysticApp.shuffle([...chosen, ...chosen], rng);

    const left = ctx.winsLeft();
    container.innerHTML =
      '<div class="mem-game">' +
        '<div class="mem-head">' +
          '<button class="btn-ghost md-back-btn" id="mem-back">\u2190 Sanctum</button>' +
          '<h2 class="section-title">Arcana Pairs</h2>' +
          '<div class="mem-status"><span id="mem-moves">0 moves</span> \u00b7 ' +
          (left > 0 ? left + (left === 1 ? ' box' : ' boxes') + ' left today' : 'playing for glory') +
          '</div>' +
        '</div>' +
        '<div class="mem-grid" id="mem-grid"></div>' +
        '<div id="mem-result"></div>' +
      '</div>';

    container.querySelector('#mem-back').addEventListener('click', ctx.exit);
    const movesEl = container.querySelector('#mem-moves');
    const grid = container.querySelector('#mem-grid');

    tiles.forEach(card => {
      const tile = document.createElement('div');
      tile.className = 'mem-tile';
      tile.dataset.name = card.name;
      const art = (typeof CARD_ART !== 'undefined' && CARD_ART[card.name]) || card.icon;
      tile.innerHTML =
        '<div class="mem-inner">' +
          ctx.cardBackHtml() +
          '<div class="card-face mem-front">' + art + '</div>' +
        '</div>';
      tile.addEventListener('click', () => onTap(tile));
      grid.appendChild(tile);
    });

    function onTap(tile) {
      if (lock || tile === first) return;
      if (tile.classList.contains('flipped') || tile.classList.contains('matched')) return;
      tile.classList.add('flipped');

      if (!first) { first = tile; return; }

      moves++;
      movesEl.textContent = moves + ' moves';

      if (first.dataset.name === tile.dataset.name) {
        first.classList.add('matched');
        tile.classList.add('matched');
        first = null;
        matched++;
        if (matched === PAIRS) setTimeout(win, 600);
      } else {
        lock = true;
        const a = first;
        first = null;
        setTimeout(() => {
          a.classList.remove('flipped');
          tile.classList.remove('flipped');
          lock = false;
        }, MISMATCH_MS);
      }
    }

    function win() {
      const gotBox = ctx.awardWin();
      container.querySelector('#mem-result').innerHTML =
        '<div class="interp-summary">' +
          '<h3>The Arcana Align</h3>' +
          '<p>All ' + PAIRS + ' pairs found in ' + moves + ' moves. ' +
          (gotBox
            ? 'A box has appeared in your Sanctum.'
            : 'The day\u2019s boxes are spent \u2014 this victory is for glory alone.') +
          '</p>' +
          '<div class="sky-stamp">' + MysticApp.skyStamp() + '</div>' +
          '<button class="btn-primary" id="mem-again">Play Again</button>' +
          '<button class="btn-ghost" id="mem-done">Return to the Sanctum</button>' +
        '</div>';
      container.querySelector('#mem-again').addEventListener('click', () => render(container, ctx));
      container.querySelector('#mem-done').addEventListener('click', ctx.exit);
      container.querySelector('#mem-result').scrollIntoView({ behavior: 'smooth' });
    }
  }

  MysticApp.gamify.registerGame({
    id: 'pairs',
    name: 'Arcana Pairs',
    icon: MysticApp.icons.tarot,
    desc: 'Match the hidden arcana',
    dailyCap: 2,
    render
  });
})();
