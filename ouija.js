// Ouija Board module — ask the spirits; a planchette glides across the board
// spelling out the answer. Randomness comes from the sky at the moment of
// asking, like every other casting in the app.

(function () {
  const ARC1 = 'ABCDEFGHIJKLM';
  const ARC2 = 'NOPQRSTUVWXYZ';
  const NUMS = '1234567890';

  const ANSWERS = [
    { target: 'YES' }, { target: 'YES' }, { target: 'NO' }, { target: 'NO' },
    { spell: 'SOON' }, { spell: 'NOT YET' }, { spell: 'NEVER' }, { spell: 'ALWAYS' },
    { spell: 'TRUST' }, { spell: 'BEWARE' }, { spell: 'WAIT' }, { spell: 'LET GO' },
    { spell: 'HOPE' }, { spell: 'BELIEVE' }, { spell: 'DESTINY' }, { spell: 'COURAGE' },
    { spell: 'ASK THE MOON' }, { spell: 'IT IS KNOWN' }, { spell: 'LOOK WITHIN' },
    { spell: 'PATIENCE' }, { spell: 'THE ANSWER SLEEPS' }, { spell: 'FATE DECIDES' },
    { spell: 'IN TIME' }, { spell: 'SHADOWS PASS' }
  ];

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

    const rng = MysticApp.natureRng();
    const answer = MysticApp.pick(ANSWERS, rng);

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

  MysticApp.register({
    id: 'ouija',
    name: 'Spirit Board',
    icon: MysticApp.icons.ouija,
    desc: 'Ask, and the planchette answers',
    subtitle: 'Voices from beyond the veil',
    render
  });
})();
