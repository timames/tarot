// Ouija Board module — ask the spirits; a planchette glides across the board
// spelling out the answer. Randomness comes from the sky at the moment of
// asking, like every other casting in the app.

(function () {
  const ARC1 = 'ABCDEFGHIJKLM';
  const ARC2 = 'NOPQRSTUVWXYZ';
  const NUMS = '1234567890';

  // The spirits listen: answers are inferred from the question's shape
  // (yes/no, when, who, where, why, how, what) and its subject
  // (love, fortune, health...). Strings are spelled out; {target} glides
  // straight to YES or NO.
  const GENERIC = [
    'TRUST', 'BEWARE', 'WAIT', 'LET GO', 'HOPE', 'BELIEVE', 'DESTINY',
    'COURAGE', 'ASK THE MOON', 'IT IS KNOWN', 'LOOK WITHIN', 'PATIENCE',
    'THE ANSWER SLEEPS', 'FATE DECIDES', 'IN TIME', 'SHADOWS PASS'
  ];

  function chooseAnswer(question, rng) {
    const q = question.toLowerCase().trim();
    if (!q) {
      return MysticApp.pick(['SPEAK', 'ASK ALOUD', 'WE ARE LISTENING', 'ASK AND KNOW'], rng);
    }

    const has = (...words) => words.some(w => new RegExp('\\b' + w + '\\b').test(q));

    // Some doors stay closed
    if (has('die', 'death', 'dead', 'kill', 'suicide')) {
      return MysticApp.pick(['THE VEIL STAYS CLOSED', 'NOT OURS TO TELL', 'LIVE FIRST', 'ASK OF LIFE INSTEAD'], rng);
    }

    const pool = [];

    // Subject flavor
    if (has('love', 'crush', 'marry', 'marriage', 'relationship', 'boyfriend', 'girlfriend', 'partner', 'soulmate', 'date', 'heart', 'ex')) {
      pool.push('LOVE FINDS YOU', 'FOLLOW YOUR HEART', 'THEY THINK OF YOU', 'AN OLD FLAME STIRS', 'OPEN YOUR HEART');
    }
    if (has('money', 'job', 'work', 'career', 'rich', 'business', 'pay', 'promotion', 'lottery', 'wealth')) {
      pool.push('FORTUNE COMES', 'WORK PAYS', 'PATIENCE PAYS', 'NOT BY GOLD ALONE', 'AN OFFER COMES');
    }
    if (has('health', 'sick', 'ill', 'heal', 'tired', 'pain')) {
      pool.push('REST', 'HEAL SLOWLY', 'CARE FOR YOURSELF', 'STRENGTH RETURNS');
    }
    if (has('friend', 'family', 'mother', 'father', 'sister', 'brother')) {
      pool.push('BLOOD IS TRUE', 'REACH OUT', 'FORGIVE', 'THEY MISS YOU');
    }

    // Question shape
    const first = q.split(/\s+/)[0];
    if (first === 'when' || /\b(when will|how long|how soon)\b/.test(q)) {
      pool.push('SOON', 'NOT YET', 'IN TIME', '3 MOONS', '7 DAYS', 'WHEN YOU ARE READY', 'SOONER THAN YOU THINK');
    } else if (first === 'who') {
      pool.push('SOMEONE NEAR', 'A STRANGER', 'YOU KNOW WHO', 'A FRIEND', 'LOOK CLOSER');
    } else if (first === 'where') {
      pool.push('CLOSE BY', 'FAR FROM HERE', 'HOME', 'WITHIN YOU', 'WHERE YOU LEFT IT');
    } else if (first === 'why') {
      pool.push('YOU KNOW WHY', 'IT HAD TO BE', 'FATE', 'ASK YOUR HEART', 'TO TEACH YOU');
    } else if (first === 'how') {
      pool.push('SLOWLY', 'WITH COURAGE', 'NOT ALONE', 'STEP BY STEP', 'AS BEFORE');
    } else if (first === 'what') {
      pool.push('A SIGN COMES', 'CHANGE', 'THE TRUTH', 'A GIFT', 'WHAT YOU FEAR', 'WHAT YOU HOPE');
    } else if (/^(will|is|are|do|does|can|should|could|would|am|did|has|have|shall|was|were)\b/.test(q) || q.endsWith('?')) {
      pool.push({ target: 'YES' }, { target: 'YES' }, { target: 'NO' },
        'SIGNS SAY YES', 'UNLIKELY', 'IF YOU DARE', 'SOON', 'NEVER', 'ALWAYS', 'ASK AGAIN');
    }

    if (!pool.length) return MysticApp.pick(GENERIC, rng);
    // A touch of mystery even for pointed questions
    pool.push('THE MOON KNOWS', 'FATE DECIDES');
    return MysticApp.pick(pool, rng);
  }

  // Positions in board-percent coordinates {x: 0-100, y: 0-100}
  const POS = {};

  function layoutPositions() {
    const arc = (letters, rx, ry, cy) => {
      const start = 148, end = 32;
      letters.split('').forEach((ch, i) => {
        const a = (start + (end - start) * (i / (letters.length - 1))) * Math.PI / 180;
        POS[ch] = { x: 50 + rx * Math.cos(a), y: cy - ry * Math.sin(a) };
      });
    };
    arc(ARC1, 42, 57, 100);
    arc(ARC2, 30, 36, 100);
    NUMS.split('').forEach((ch, i) => {
      POS[ch] = { x: 15 + (70 * i) / 9, y: 86 };
    });
    POS['YES'] = { x: 14, y: 9 };
    POS['NO'] = { x: 86, y: 9 };
    POS['GOODBYE'] = { x: 50, y: 95 };
    POS['REST'] = { x: 50, y: 28 };
  }
  layoutPositions();

  const PLANCHETTE_SVG = `
    <svg viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,3 C46,14 54,30 52,46 C50,60 41,68 30,68 C19,68 10,60 8,46 C6,30 14,14 30,3 Z"
        fill="rgba(30,12,54,0.82)" stroke="#d4a04a" stroke-width="2"/>
      <circle cx="30" cy="26" r="9" fill="rgba(232,213,183,0.1)" stroke="#d4a04a" stroke-width="1.5"/>
      <circle cx="30" cy="58" r="2" fill="#d4a04a"/>
      <circle cx="14" cy="46" r="2" fill="#d4a04a"/>
      <circle cx="46" cy="46" r="2" fill="#d4a04a"/>
    </svg>`;

  let timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function render(container) {
    clearTimers();
    let boardHtml = '<div class="ouija-board" id="ouija-board">';
    for (const ch of ARC1 + ARC2 + NUMS) {
      boardHtml += `<span class="ouija-char" data-char="${ch}" style="left:${POS[ch].x}%;top:${POS[ch].y}%">${ch}</span>`;
    }
    boardHtml += `<span class="ouija-char ouija-word" data-char="YES" style="left:${POS.YES.x}%;top:${POS.YES.y}%">YES</span>`;
    boardHtml += `<span class="ouija-char ouija-word" data-char="NO" style="left:${POS.NO.x}%;top:${POS.NO.y}%">NO</span>`;
    boardHtml += `<span class="ouija-char ouija-word" data-char="GOODBYE" style="left:${POS.GOODBYE.x}%;top:${POS.GOODBYE.y}%">GOOD&nbsp;BYE</span>`;
    boardHtml += `<div class="planchette" id="planchette" style="left:${POS.REST.x}%;top:${POS.REST.y}%">${PLANCHETTE_SVG}</div>`;
    boardHtml += '</div>';

    container.innerHTML = `
      <div class="ouija-wrap">
        <p class="form-note">Ask aloud or in silence, then place your fingers on the planchette.</p>
        <input type="text" class="ouija-input" id="ouija-question" placeholder="Ask the spirits…" autocomplete="off" maxlength="140">
        ${boardHtml}
        <div class="ouija-answer" id="ouija-answer"></div>
        <button class="btn-primary" id="btn-summon">Begin the Séance</button>
        <div id="ouija-stamp"></div>
      </div>
    `;

    container.querySelector('#btn-summon').addEventListener('click', () => summon(container));
  }

  function moveTo(container, key, jitter) {
    const p = container.querySelector('#planchette');
    if (!p) return;
    const pos = POS[key] || POS.REST;
    const jx = jitter ? (Math.random() - 0.5) * 3 : 0;
    const jy = jitter ? (Math.random() - 0.5) * 3 : 0;
    p.style.left = (pos.x + jx) + '%';
    p.style.top = (pos.y + jy) + '%';
    p.style.transform = `translate(-50%, -36%) rotate(${(Math.random() - 0.5) * 14}deg)`;
  }

  function glow(container, key) {
    const el = container.querySelector(`.ouija-char[data-char="${key}"]`);
    if (!el) return;
    el.classList.add('lit');
    timers.push(setTimeout(() => el.classList.remove('lit'), 900));
  }

  function summon(container) {
    clearTimers();
    const btn = container.querySelector('#btn-summon');
    btn.disabled = true;
    btn.textContent = 'The spirits are speaking…';
    const answerEl = container.querySelector('#ouija-answer');
    answerEl.textContent = '';
    container.querySelector('#ouija-stamp').innerHTML = '';

    // The same question receives the same answer — until tomorrow.
    // Wandering questions (or none) fall to the whim of the sky.
    const question = container.querySelector('#ouija-question').value;
    const rng = question.trim()
      ? MysticApp.seededRng(question.trim().toLowerCase() + '|' + MysticApp.todayKey())
      : MysticApp.natureRng();
    const raw = chooseAnswer(question, rng);
    const answer = typeof raw === 'string' ? { spell: raw } : raw;

    const STEP = 1100;
    let t = 300;

    // The planchette stirs before it speaks
    timers.push(setTimeout(() => moveTo(container, 'REST', true), t)); t += 700;
    timers.push(setTimeout(() => moveTo(container, ['E', 'T', 'O', 'S'][Math.floor(rng() * 4)], true), t)); t += 900;

    if (answer.target) {
      timers.push(setTimeout(() => {
        moveTo(container, answer.target);
        glow(container, answer.target);
        timers.push(setTimeout(() => { answerEl.textContent = answer.target; }, 700));
      }, t));
      t += STEP + 600;
    } else {
      for (const ch of answer.spell) {
        if (ch === ' ') {
          timers.push(setTimeout(() => {
            moveTo(container, 'REST', true);
            answerEl.textContent += ' ';
          }, t));
          t += 800;
        } else {
          const key = ch;
          timers.push(setTimeout(() => {
            moveTo(container, key);
            glow(container, key);
            timers.push(setTimeout(() => { answerEl.textContent += key; }, 700));
          }, t));
          t += STEP;
        }
      }
    }

    // The spirits depart
    timers.push(setTimeout(() => {
      moveTo(container, 'GOODBYE');
      glow(container, 'GOODBYE');
    }, t + 400));
    timers.push(setTimeout(() => {
      moveTo(container, 'REST', true);
      btn.disabled = false;
      btn.textContent = 'Ask Again';
      container.querySelector('#ouija-stamp').innerHTML = `<div class="sky-stamp">${MysticApp.skyStamp()}</div>`;
      if (MysticApp.adReadingDone) MysticApp.adReadingDone();
    }, t + 2100));
  }

  // Exposed for testing the inference engine
  MysticApp._ouijaAnswer = chooseAnswer;

  MysticApp.register({
    id: 'ouija',
    name: 'Spirit Board',
    icon: MysticApp.icons.ouija,
    desc: 'Ask, and the planchette answers',
    subtitle: 'Voices from beyond the veil',
    render
  });
})();
