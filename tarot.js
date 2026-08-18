// Tarot module — instant spreads (1/3/5) and multi-day consecutive spreads (7/22/78).

(function () {
  let root = null;
  let drawnCards = [];
  let spreadSize = 3;
  let flippedCount = 0;

  // --- Multi-day position labels ---

  const HORSESHOE_POS = [
    'The Past', 'The Present', 'Hidden Influences', 'The Obstacle',
    'Those Around You', 'What To Do', 'The Outcome'
  ];

  const TREE_POS = [
    'Malkuth \u2014 The Kingdom', 'Yesod \u2014 The Foundation',
    'Hod \u2014 Splendor', 'Netzach \u2014 Victory',
    'Tiphareth \u2014 Beauty', 'Geburah \u2014 Severity',
    'Chesed \u2014 Mercy', 'Da\u2019ath \u2014 The Abyss',
    'Binah \u2014 Understanding', 'Chokmah \u2014 Wisdom',
    'Kether \u2014 The Crown',
    'Path of Earth', 'Path of the Moon', 'Path of Mercury',
    'Path of Venus', 'Path of the Sun', 'Path of Mars',
    'Path of Jupiter', 'Path of Saturn', 'Path of Air',
    'Path of Water', 'Path of Fire'
  ];

  const GT_ROWS = [
    { domain: 'The Self', houses: ['Identity','Willpower','Intuition','Foundation','Challenge','Harmony','Action','Transformation','Wisdom','Fortune','Hope','Shadow','Completion'] },
    { domain: 'Relationships', houses: ['Connection','Desire','Trust','Commitment','Tension','Healing','Growth','Sacrifice','Revelation','Balance','Renewal','Release','Union'] },
    { domain: 'Work & Purpose', houses: ['Calling','Ambition','Skill','Structure','Conflict','Collaboration','Leadership','Change','Mastery','Reward','Vision','Burden','Achievement'] },
    { domain: 'Inner World', houses: ['Emotion','Memory','Fear','Dream','Instinct','Reflection','Passion','Letting Go','Awakening','Depth','Light','Darkness','Integration'] },
    { domain: 'Spiritual Path', houses: ['Seeking','Faith','Doubt','Surrender','Ritual','Ascent','Devotion','Mystery','Illumination','Grace','Test','Rebirth','Transcendence'] },
    { domain: 'The Unfolding', houses: ['Dawn','Momentum','Threshold','Turning Point','Acceleration','Patience','Leap','Descent','Emergence','Culmination','Legacy','Return','Destiny'] }
  ];

  const TABLEAU_POS = GT_ROWS.flatMap(row =>
    row.houses.map(h => row.domain + ' \u00b7 ' + h)
  );

  const MULTI_DAY = {
    7:  { name: 'Seven Day Horseshoe', key: 'mystic-spread-7',  positions: HORSESHOE_POS, groups: null },
    22: { name: 'Tree of Life',        key: 'mystic-spread-22', positions: TREE_POS,
          groups: [{ label: 'The Sephiroth', start: 0, count: 11 }, { label: 'The Paths', start: 11, count: 11 }] },
    78: { name: 'Grand Tableau',       key: 'mystic-spread-78', positions: TABLEAU_POS,
          groups: GT_ROWS.map((r, i) => ({ label: r.domain, start: i * 13, count: 13 })) }
  };

  // --- Utilities ---

  function localDayNumber() {
    return Math.floor(new Date(new Date().toDateString()).getTime() / 86400000);
  }

  function loadSpread(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  function saveSpread(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  function clearSpread(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function hoursToMidnight() {
    const now = new Date(), midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const mins = Math.round((midnight - now) / 60000);
    return Math.floor(mins / 60) + 'h ' + String(mins % 60).padStart(2, '0') + 'm';
  }

  // --- Access gating -------------------------------------------------------
  // 1-card is free. 3/5-card and the 7-day Horseshoe are ad-supported: one
  // rewarded video unlocks every ad-tier spread for the day. Tree of Life (22)
  // and Grand Tableau (78) are Mystic Oracle Plus. Plus unlocks everything.

  function isPrem() { try { return MysticApp.isPremium(); } catch (e) { return false; } }
  function advUnlocked() { try { return MysticApp.adUnlockedToday('tarot-adv'); } catch (e) { return false; } }

  function spreadGate(size) {
    if (size === 1) return 'free';
    if (size === 3 || size === 5 || size === 7) return 'ad';
    return 'plus'; // 22, 78
  }

  const SPREAD_LABEL = { 1: 'Single Card', 3: 'Three Card', 5: 'Five Card',
    7: 'Seven Day Horseshoe', 22: 'Tree of Life', 78: 'Grand Tableau' };

  function handleSpreadClick(size) {
    const gate = spreadGate(size);
    const start = () => {
      if (size <= 5) { spreadSize = size; startInstantReading(); }
      else openMultiDay(size);
    };
    if (gate === 'free' || isPrem()) { start(); return; }
    if (gate === 'ad') {
      if (advUnlocked()) { start(); return; }
      showAdGate(size, start);
    } else {
      showPlusGate(size);
    }
  }

  function showAdGate(size, proceed) {
    root.innerHTML = `
      <div class="gate reward-gate">
        <div class="gate-icon">${MysticApp.icons.tarot}</div>
        <h2>${SPREAD_LABEL[size]}</h2>
        <p class="gate-text">Watch a short video to unlock the <b>${SPREAD_LABEL[size]}</b> —
        and every ad-supported spread — for the rest of today.</p>
        <button class="btn-primary gate-btn" id="tg-watch">${MysticApp.icons.play}<span>Watch &amp; Unlock</span></button>
        <div class="gate-or">or</div>
        <div class="gate-plus">
          <h3>Mystic Oracle Plus</h3>
          <p>Unlock every spread and remove all ads.</p>
          <button class="btn-ghost" id="tg-plus">See Plus</button>
        </div>
        <button class="btn-ghost md-back-btn" id="tg-back">Back</button>
      </div>`;
    const w = root.querySelector('#tg-watch');
    w.addEventListener('click', () => {
      w.disabled = true; w.innerHTML = MysticApp.icons.play + '<span>Loading…</span>';
      const reward = () => { try { MysticApp.grantAdUnlock('tarot-adv'); } catch (e) {} proceed(); };
      if (MysticApp.showRewardedAd) {
        MysticApp.showRewardedAd(reward, () => {
          w.disabled = false; w.innerHTML = MysticApp.icons.play + '<span>Watch &amp; Unlock</span>';
          if (!root.querySelector('.gate-err')) {
            w.insertAdjacentHTML('afterend', '<div class="gate-err">No ad available right now — please try again.</div>');
          }
        });
      } else { reward(); }
    });
    root.querySelector('#tg-plus').addEventListener('click', () => MysticApp.openSubscribe());
    root.querySelector('#tg-back').addEventListener('click', () => showSpreadPicker());
  }

  function showPlusGate(size) {
    root.innerHTML = `
      <div class="gate plus-gate">
        <div class="gate-icon">${MysticApp.icons.tarot}</div>
        <h2>${SPREAD_LABEL[size]}</h2>
        <p class="gate-text">The <b>${SPREAD_LABEL[size]}</b> is part of <b>Mystic Oracle Plus</b>.</p>
        <button class="btn-primary gate-btn" id="tg-plus">${MysticApp.icons.star}<span>Unlock with Plus</span></button>
        <button class="btn-ghost md-back-btn" id="tg-back">Back</button>
      </div>`;
    root.querySelector('#tg-plus').addEventListener('click', () => MysticApp.openSubscribe());
    root.querySelector('#tg-back').addEventListener('click', () => showSpreadPicker());
  }

  // --- The Oracle's voice (AI narrative) -----------------------------------
  // Reads the whole spread as one story rather than card-by-card. Always
  // optional: if AI is off, offline, or the worker fails, the block just
  // disappears and the traditional card meanings below stand on their own.

  const AI_TAG = '<span class="ai-tag" title="Written for this draw">✦ for this draw</span>';

  function paras(text) {
    return String(text).split(/\n+/).map(s => s.trim()).filter(Boolean)
      .map(s => '<p>' + MysticApp.esc(s) + '</p>').join('');
  }

  function runVoice(mount, spreadName, cards, question) {
    mount.innerHTML =
      '<div class="ai-voice is-loading">' +
        '<div class="ai-voice-head">The oracle considers the spread…</div>' +
        '<div class="ai-skeleton"><span></span><span></span><span></span></div>' +
      '</div>';
    MysticApp.ai.reading('tarot', { spread: spreadName, cards: cards, question: question || '' })
      .then(text => {
        if (!text) { mount.innerHTML = ''; return; }
        mount.innerHTML =
          '<div class="ai-voice"><div class="ai-voice-head">The Oracle Speaks' + AI_TAG + '</div>' +
          '<div class="ai-voice-body">' + paras(text) + '</div></div>';
      });
  }

  // Entitlement: the ad-tier and Plus spreads already paid for it. The free
  // single card offers it as an extra rewarded view — a fair trade, and the
  // highest-value ad surface in the app.
  function renderVoice(mount, spreadName, cards, autoEntitled) {
    if (!mount) return;
    if (!MysticApp.ai || !MysticApp.ai.enabled()) { mount.innerHTML = ''; return; }
    if (autoEntitled || isPrem()) { runVoice(mount, spreadName, cards); return; }

    mount.innerHTML =
      '<div class="ai-offer">' +
        '<div class="ai-offer-icon">' + MysticApp.icons.star + '</div>' +
        '<div class="ai-offer-text">Have the oracle read this card in full — written for this exact draw.</div>' +
        '<button class="btn-primary gate-btn" id="ai-ask">' + MysticApp.icons.play + '<span>Watch &amp; Read</span></button>' +
      '</div>';

    mount.querySelector('#ai-ask').addEventListener('click', function () {
      const btn = this;
      btn.disabled = true;
      btn.innerHTML = MysticApp.icons.play + '<span>Loading…</span>';
      const go = () => runVoice(mount, spreadName, cards);
      if (MysticApp.showRewardedAd) {
        MysticApp.showRewardedAd(go, () => {
          btn.disabled = false;
          btn.innerHTML = MysticApp.icons.play + '<span>Watch &amp; Read</span>';
        });
      } else { go(); }
    });
  }

  // Cosmetic card back — the gamify module supplies the equipped design;
  // without it, fall back to the original classic markup.
  function backHtml() {
    if (MysticApp.gamify && MysticApp.gamify.cardBackHtml) return MysticApp.gamify.cardBackHtml();
    return '<div class="card-face card-back"><div class="card-back-pattern"><div class="card-back-symbol">&#10022;</div></div></div>';
  }

  // --- Spread picker ---

  function render(container) {
    root = container;
    showSpreadPicker();
  }

  function showSpreadPicker() {
    const multiInfo = {};
    [7, 22, 78].forEach(size => {
      const cfg = MULTI_DAY[size];
      const data = loadSpread(cfg.key);
      if (data && data.cards && data.cards.length === size) {
        const turned = data.turnedDays ? data.turnedDays.length : 0;
        const broken = turned > 0 && localDayNumber() > data.turnedDays[turned - 1] + 1;
        multiInfo[size] = { turned, broken, total: size };
      }
    });

    function mDesc(size) {
      const info = multiInfo[size];
      if (!info) return size + ' consecutive days';
      if (info.broken) return 'Streak broken \u2014 tap to restart';
      if (info.turned === info.total) return 'Complete \u2014 tap to view';
      return 'Day ' + info.turned + ' of ' + info.total + ' \u2014 continue';
    }

    root.innerHTML = `
      <div class="spread-select" id="spread-select">
        <h2 class="section-title">Choose Your Reading</h2>
        <div class="spread-options">
          <button class="spread-btn" data-spread="1">
            <div class="spread-icon">&#9733;&#xFE0E;</div>
            <div><div class="spread-name">Single Card</div>
            <div class="spread-desc">Quick daily guidance</div></div>
          </button>
          <button class="spread-btn" data-spread="3">
            <div class="spread-icon">&#9733;&#xFE0E;&#9733;&#xFE0E;&#9733;&#xFE0E;</div>
            <div><div class="spread-name">Three Card</div>
            <div class="spread-desc">Past, Present, Future</div></div>
          </button>
          <button class="spread-btn" data-spread="5">
            <div class="spread-icon">&#9733;&#xFE0E;&#9733;&#xFE0E;&#9733;&#xFE0E;&#9733;&#xFE0E;&#9733;&#xFE0E;</div>
            <div><div class="spread-name">Five Card</div>
            <div class="spread-desc">Cross spread for deeper insight</div></div>
          </button>
        </div>
        <h2 class="section-title md-divider">Multi-Day Spreads</h2>
        <p class="form-note">Seal a spread and reveal one card per day. Miss a day and it resets.</p>
        <div class="spread-options">
          <button class="spread-btn" data-spread="7">
            <div class="spread-icon md-icon">VII</div>
            <div><div class="spread-name">Seven Day Horseshoe</div>
            <div class="spread-desc">${mDesc(7)}</div></div>
          </button>
          <button class="spread-btn" data-spread="22">
            <div class="spread-icon md-icon">XXII</div>
            <div><div class="spread-name">Tree of Life</div>
            <div class="spread-desc">${mDesc(22)}</div></div>
          </button>
          <button class="spread-btn" data-spread="78">
            <div class="spread-icon md-icon">LXXVIII</div>
            <div><div class="spread-name">Grand Tableau</div>
            <div class="spread-desc">${mDesc(78)}</div></div>
          </button>
        </div>
      </div>
      <div class="reading hidden" id="tarot-reading">
        <div class="cards-container" id="cards-container"></div>
        <div class="interpretation hidden" id="tarot-interpretation"></div>
        <button class="btn-primary hidden" id="btn-new-reading">New Reading</button>
      </div>
    `;

    const premium = isPrem();
    const adv = advUnlocked();
    root.querySelectorAll('.spread-btn').forEach(btn => {
      const size = parseInt(btn.dataset.spread);
      const gate = spreadGate(size);
      if (!premium && (gate === 'plus' || (gate === 'ad' && !adv))) {
        const b = document.createElement('div');
        b.className = 'tile-badge ' + (gate === 'plus' ? 'plus-badge' : 'ad-badge');
        b.innerHTML = gate === 'plus'
          ? MysticApp.icons.star + '<span>Plus</span>'
          : MysticApp.icons.play + '<span>Ad</span>';
        btn.appendChild(b);
      }
      btn.addEventListener('click', () => handleSpreadClick(size));
    });

    root.querySelector('#btn-new-reading').addEventListener('click', () => {
      root.querySelector('#tarot-reading').classList.add('hidden');
      root.querySelector('#spread-select').classList.remove('hidden');
    });
  }

  // --- Instant spreads (1/3/5) ---

  function startInstantReading() {
    const spreadSelect = root.querySelector('#spread-select');
    const readingDiv = root.querySelector('#tarot-reading');
    const cardsContainer = root.querySelector('#cards-container');

    spreadSelect.classList.add('hidden');
    readingDiv.classList.remove('hidden');
    root.querySelector('#tarot-interpretation').classList.add('hidden');
    root.querySelector('#btn-new-reading').classList.add('hidden');
    cardsContainer.innerHTML = '';

    const hint = document.createElement('div');
    hint.className = 'tap-hint';
    hint.id = 'tap-hint';
    hint.textContent = 'Tap each card to reveal';
    cardsContainer.before(hint);
    flippedCount = 0;

    const rng = MysticApp.natureRng();
    const shuffled = MysticApp.shuffle(TAROT_DECK, rng);
    drawnCards = shuffled.slice(0, spreadSize).map(card => ({
      ...card, isReversed: rng() < 0.3
    }));

    const labels = SPREAD_LABELS[spreadSize];

    drawnCards.forEach((card, i) => {
      const slot = document.createElement('div');
      slot.className = 'card-slot';
      slot.innerHTML = `
        <div class="card ${card.isReversed ? 'reversed' : ''}" data-index="${i}">
          ${backHtml()}
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
    if (flippedCount === spreadSize) setTimeout(showInstantInterpretation, 900);
  }

  function showInstantInterpretation() {
    const labels = SPREAD_LABELS[spreadSize];
    let html = '<div id="ai-voice"></div>';

    drawnCards.forEach((card, i) => {
      const meaning = card.isReversed ? card.reversed : card.upright;
      html += `
        <div class="interp-card">
          <h3>${card.name}</h3>
          <div class="interp-position">${labels[i]}</div>
          ${card.isReversed ? '<div class="interp-reversed">Reversed</div>' : ''}
          <div class="interp-meaning">${meaning}</div>
        </div>`;
    });

    const summaries = {
      1: ["This card speaks directly to your current moment. Let its wisdom guide your day.",
          "The universe has a clear message for you today. Reflect on how this card resonates with your inner truth.",
          "A single card, a single truth. Carry this insight with you as you move through your day."],
      3: ["Your past has shaped you, your present challenges you, and your future awaits your choices. The cards reveal a journey of transformation unfolding in your life.",
          "The threads of time weave together in this reading. What was, what is, and what may be are all connected by the choices you make now.",
          "These three cards paint a portrait of your journey. Honor where you've been, engage with where you are, and step boldly toward where you're going."],
      5: ["This cross spread reveals the deeper forces at play in your life. The visible and hidden influences converge to illuminate your path forward.",
          "Five cards reveal five facets of your situation. Together they form a map of the energies, challenges, and potential that surround you now.",
          "The cross illuminates what lies beneath the surface. Trust the wisdom of the cards as you navigate the complexities revealed in this reading."]
    };

    html += `
      <div class="interp-summary">
        <h3>Reading Summary</h3>
        <p>${MysticApp.pick(summaries[spreadSize])}</p>
      </div>
      <div class="sky-stamp">${MysticApp.skyStamp()}</div>`;

    const interpretation = root.querySelector('#tarot-interpretation');
    interpretation.innerHTML = html;
    interpretation.classList.remove('hidden');
    const hintEl = root.querySelector('#tap-hint');
    if (hintEl) hintEl.remove();
    interpretation.scrollIntoView({ behavior: 'smooth' });
    root.querySelector('#btn-new-reading').classList.remove('hidden');

    renderVoice(
      interpretation.querySelector('#ai-voice'),
      SPREAD_LABEL[spreadSize] || (spreadSize + ' card'),
      drawnCards.map((c, i) => ({
        name: c.name,
        position: labels[i],
        reversed: !!c.isReversed,
        meaning: c.isReversed ? c.reversed : c.upright
      })),
      spreadSize > 1   // 3/5-card already required a rewarded view or Plus
    );

    if (MysticApp.adReadingDone) MysticApp.adReadingDone();
  }

  // --- Multi-day spreads (7/22/78) ---

  function openMultiDay(size) {
    const cfg = MULTI_DAY[size];
    const data = loadSpread(cfg.key);

    if (data && data.cards && data.cards.length === size) {
      const turned = data.turnedDays ? data.turnedDays.length : 0;
      const broken = turned > 0 && localDayNumber() > data.turnedDays[turned - 1] + 1;
      if (broken) { showBroken(size); return; }
      renderMultiDay(size, data);
    } else {
      showSeal(size);
    }
  }

  function showSeal(size) {
    const cfg = MULTI_DAY[size];
    root.innerHTML = `
      <div class="md-seal">
        <h2 class="section-title">${cfg.name}</h2>
        <p class="form-note">Draw ${size} cards sealed by the sky. One card unlocks each day for ${size} consecutive days. Miss a day and the spread resets.</p>
        <button class="btn-primary" id="md-seal-btn">Seal the Spread</button>
        <button class="btn-ghost md-back-btn" id="md-back">Back</button>
      </div>`;
    root.querySelector('#md-seal-btn').addEventListener('click', () => sealMultiDay(size));
    root.querySelector('#md-back').addEventListener('click', () => showSpreadPicker());
  }

  function sealMultiDay(size) {
    const cfg = MULTI_DAY[size];
    const rng = MysticApp.natureRng();
    const shuffled = MysticApp.shuffle(TAROT_DECK, rng);
    const cards = shuffled.slice(0, size).map(c => ({ name: c.name, reversed: rng() < 0.3 }));
    const data = { start: localDayNumber(), cards, turnedDays: [], stamp: MysticApp.skyStamp() };
    saveSpread(cfg.key, data);
    if (MysticApp.notify) MysticApp.notify.refreshStreak();
    renderMultiDay(size, data);
  }

  function showBroken(size) {
    const cfg = MULTI_DAY[size];
    const data = loadSpread(cfg.key);
    const turned = data && data.turnedDays ? data.turnedDays.length : 0;
    root.innerHTML = `
      <div class="md-seal">
        <h2 class="section-title">Streak Broken</h2>
        <p class="form-note">You revealed ${turned} of ${size} cards before the chain was broken. The veil has fallen \u2014 begin again to restart the journey.</p>
        <button class="btn-primary" id="md-restart">Begin Again</button>
        <button class="btn-ghost md-back-btn" id="md-back">Back</button>
      </div>`;
    root.querySelector('#md-restart').addEventListener('click', () => { clearSpread(cfg.key); showSeal(size); });
    root.querySelector('#md-back').addEventListener('click', () => showSpreadPicker());
  }

  function renderMultiDay(size, data) {
    const cfg = MULTI_DAY[size];
    const today = localDayNumber();
    const turned = data.turnedDays ? data.turnedDays.length : 0;
    const dayNum = Math.min(today - data.start + 1, size);
    const canTurnNext = turned < size && (turned === 0 ? today >= data.start : today > data.turnedDays[turned - 1]);

    let progressHtml;
    if (size <= 7) {
      let dots = '';
      for (let d = 0; d < size; d++) dots += `<span class="hs-dot${d < turned ? ' filled' : ''}"></span>`;
      progressHtml = `<div class="hs-dots">${dots}</div>`;
    } else {
      progressHtml = `<div class="md-bar"><div class="md-bar-fill" style="width:${(turned / size * 100).toFixed(1)}%"></div></div>`;
    }

    root.innerHTML = `
      <div class="md-spread">
        <div class="md-header">
          <button class="btn-ghost md-back-btn" id="md-back-top">\u2190 Back</button>
          <h2 class="section-title">${cfg.name}</h2>
          <div class="hs-progress">
            ${progressHtml}
            <div class="hs-status">Day ${dayNum} of ${size} \u00b7 ${turned} turned</div>
          </div>
        </div>
        <div class="md-grid md-grid-${size}" id="md-grid"></div>
        <div id="md-detail"></div>
      </div>`;

    root.querySelector('#md-back-top').addEventListener('click', () => showSpreadPicker());

    const grid = root.querySelector('#md-grid');

    function renderGroup(startIdx, count, label) {
      if (label) {
        const hdr = document.createElement('div');
        hdr.className = 'md-group-label';
        hdr.textContent = label;
        grid.appendChild(hdr);
      }
      const wrap = document.createElement('div');
      wrap.className = 'md-group-cards';

      for (let i = startIdx; i < startIdx + count; i++) {
        const idx = i;
        const isTurned = idx < turned;
        const isTurnable = !isTurned && idx === turned && canTurnNext;
        const isLocked = !isTurned && !isTurnable;
        const cardInfo = data.cards[idx];
        const cardData = TAROT_DECK.find(c => c.name === cardInfo.name);

        const slot = document.createElement('div');
        slot.className = 'md-card-slot' + (isLocked ? ' locked' : '') + (isTurnable ? ' turnable' : '');

        slot.innerHTML = `
          <div class="card md-card${isTurned ? ' flipped' : ''}${cardInfo.reversed ? ' reversed' : ''}">
            ${backHtml()}
            <div class="card-face card-front">
              <div class="card-numeral">${cardData ? cardData.numeral : ''}</div>
              <div class="card-illustration">${(typeof CARD_ART !== 'undefined' && CARD_ART[cardInfo.name]) || (cardData ? cardData.icon : '')}</div>
              <div class="card-title">${cardInfo.name}</div>
              <div class="card-suit">${cardData ? cardData.suit : ''}${cardInfo.reversed ? ' (Rev)' : ''}</div>
            </div>
          </div>
          <div class="md-day-badge">${idx + 1}</div>`;

        slot.addEventListener('click', () => {
          if (isTurnable) {
            data.turnedDays.push(today);
            saveSpread(cfg.key, data);
            if (MysticApp.gamify) MysticApp.gamify.recordReading();
            if (MysticApp.notify) MysticApp.notify.refreshStreak();
            renderMultiDay(size, data);
            setTimeout(() => showMDDetail(size, data, idx), 100);
          } else if (isTurned) {
            showMDDetail(size, data, idx);
          }
        });
        wrap.appendChild(slot);
      }
      grid.appendChild(wrap);
    }

    if (cfg.groups) cfg.groups.forEach(g => renderGroup(g.start, g.count, g.label));
    else renderGroup(0, size, null);

    if (turned === size) showMDComplete(size, data);
    else if (turned > 0 && !canTurnNext) showMDWaiting(size, data, turned);
    else if (canTurnNext && turned > 0) showMDDetail(size, data, turned - 1);
  }

  function showMDDetail(size, data, idx) {
    const cfg = MULTI_DAY[size];
    const detail = root.querySelector('#md-detail');
    const cardData = TAROT_DECK.find(c => c.name === data.cards[idx].name);
    if (!cardData) return;
    const isRev = data.cards[idx].reversed;
    detail.innerHTML = `
      <div class="interpretation">
        <div class="interp-card">
          <h3>${MysticApp.esc(cardData.name)}</h3>
          <div class="interp-position">${cfg.positions[idx]}</div>
          ${isRev ? '<div class="interp-reversed">Reversed</div>' : ''}
          <div class="interp-meaning">${isRev ? cardData.reversed : cardData.upright}</div>
        </div>
      </div>`;
    detail.scrollIntoView({ behavior: 'smooth' });
  }

  function showMDWaiting(size, data, nextIdx) {
    const cfg = MULTI_DAY[size];
    root.querySelector('#md-detail').innerHTML = `
      <div class="hs-waiting">
        <div class="hs-waiting-title">Tomorrow</div>
        <div class="hs-waiting-pos">${cfg.positions[nextIdx]} \u2014 the next card stirs in ${hoursToMidnight()}</div>
      </div>`;
  }

  function showMDComplete(size, data) {
    const cfg = MULTI_DAY[size];
    const detail = root.querySelector('#md-detail');
    detail.innerHTML = `
      <div id="ai-voice"></div>
      <div class="interp-summary">
        <h3>${cfg.name} Complete</h3>
        <p>From <b>${MysticApp.esc(data.cards[0].name)}</b> to <b>${MysticApp.esc(data.cards[size - 1].name)}</b>, ${size} days have unfolded their wisdom.</p>
        <div class="sky-stamp">${MysticApp.esc(data.stamp)}</div>
        <button class="btn-primary" id="md-new">Begin Again</button>
      </div>`;
    detail.querySelector('#md-new').addEventListener('click', () => { clearSpread(cfg.key); showSeal(size); });

    // One closing narrative for the whole journey. Long spreads send an evenly
    // sampled dozen so the prompt stays small.
    const step = Math.max(1, Math.ceil(size / 12));
    const sampled = [];
    for (let i = 0; i < size && sampled.length < 12; i += step) {
      const info = data.cards[i];
      const deck = TAROT_DECK.find(c => c.name === info.name);
      sampled.push({
        name: info.name,
        position: cfg.positions[i],
        reversed: !!info.reversed,
        meaning: deck ? (info.reversed ? deck.reversed : deck.upright) : ''
      });
    }
    renderVoice(detail.querySelector('#ai-voice'), cfg.name, sampled, true);
    if (!data.adDone && MysticApp.adReadingDone) {
      MysticApp.adReadingDone();
      data.adDone = true;
      saveSpread(cfg.key, data);
    }
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
