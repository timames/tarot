// settings.js — the Settings screen.
//
// Google Play expects a subscriber to be able to manage and restore their
// subscription from inside the app, and store reviewers look for a reachable
// privacy policy. This screen covers both, plus notification preferences and
// the birth details the oracles share.

(function () {
  const APP_VERSION = '1.3';
  const PACKAGE = 'net.ripdi.mystic_oracle';
  const PRIVACY_URL = 'https://tarot.ripdi.net/privacy-policy';
  const MANAGE_URL = 'https://play.google.com/store/account/subscriptions?package=' + PACKAGE;

  function el(id) { return document.getElementById(id); }

  function enterView() {
    const home = el('home'), view = el('module-view'), back = el('btn-back');
    const footer = document.querySelector('.app-footer');
    home.classList.add('hidden');
    view.classList.remove('hidden');
    back.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    el('app-title').textContent = 'Settings';
    el('app-subtitle').textContent = 'Your account and preferences';
    window.scrollTo(0, 0);
    return view;
  }

  function openUrl(url) {
    try { window.open(url, '_blank'); } catch (e) { window.location.href = url; }
  }

  function toggleHtml(id, on, label, note) {
    return `
      <div class="set-row">
        <div class="set-row-text">
          <div class="set-row-label">${label}</div>
          ${note ? `<div class="set-row-note">${note}</div>` : ''}
        </div>
        <button class="switch${on ? ' on' : ''}" id="${id}" role="switch" aria-checked="${on ? 'true' : 'false'}" aria-label="${label}">
          <span class="switch-knob"></span>
        </button>
      </div>`;
  }

  function two(n) { return String(n).padStart(2, '0'); }

  // enabled() also reports false when offline, which would make the toggle look
  // flipped for a reason that has nothing to do with the user's choice.
  function aiOff() {
    try { return localStorage.getItem('mystic-ai') === '0'; } catch (e) { return false; }
  }

  function open() {
    const view = enterView();
    const premium = MysticApp.isPremium();
    const profile = MysticApp.getProfile() || {};
    const np = (MysticApp.notify && MysticApp.notify.prefs) ? MysticApp.notify.prefs() : { daily: false, streak: false, hour: 9, minute: 0 };
    const signName = profile.sign || (profile.birthDate ? MysticApp.sunSign(profile.birthDate) : null);

    view.innerHTML = `
      <div class="settings">

        <div class="set-card set-plus ${premium ? 'is-plus' : ''}">
          <div class="set-plus-head">
            <span class="set-plus-icon">${MysticApp.icons.star}</span>
            <div>
              <div class="set-plus-title">Mystic Oracle Plus</div>
              <div class="set-plus-state">${premium ? 'Active — ads removed, everything unlocked' : 'Not subscribed'}</div>
            </div>
          </div>
          ${premium
            ? `<button class="btn-ghost set-btn" id="set-manage">Manage subscription</button>`
            : `<button class="btn-primary set-btn" id="set-get">${MysticApp.icons.star}<span>See Plus</span></button>`}
          <button class="link-btn" id="set-restore">Restore purchase</button>
        </div>

        <h3 class="set-heading">Reminders</h3>
        <div class="set-card">
          ${toggleHtml('set-daily', np.daily, 'Daily reading reminder', 'A nudge when your card and horoscope refresh')}
          <div class="set-row set-time-row${np.daily ? '' : ' dimmed'}" id="set-time-row">
            <div class="set-row-text"><div class="set-row-label">Reminder time</div></div>
            <input type="time" class="set-time" id="set-time" value="${two(np.hour)}:${two(np.minute)}">
          </div>
          ${toggleHtml('set-streak', np.streak, 'Streak protection', 'Warns you before a multi-day spread breaks')}
          ${MysticApp.notify && MysticApp.notify.available() ? '' :
            '<div class="set-note">Reminders only fire on a phone — this preview has no notification support.</div>'}
        </div>

        ${MysticApp.ai && MysticApp.ai.configured() ? `
        <h3 class="set-heading">Readings</h3>
        <div class="set-card">
          ${toggleHtml('set-ai', MysticApp.ai.enabled() || !aiOff(), 'Freshly written readings',
            'Horoscopes and spread interpretations are written new rather than drawn from a fixed set. Turn this off to keep everything on your device.')}
        </div>` : ''}

        <h3 class="set-heading">Your details</h3>
        <div class="set-card">
          <label class="set-field">Name
            <input type="text" id="set-name" placeholder="Optional" value="${MysticApp.esc(profile.fullName || '')}">
          </label>
          <label class="set-field">Birth date
            <input type="date" id="set-dob" value="${MysticApp.esc(profile.birthDate || '')}">
          </label>
          <div class="set-row">
            <div class="set-row-text">
              <div class="set-row-label">Your sign</div>
              <div class="set-row-note" id="set-sign-note">${signName ? signName : 'Add a birth date to set this'}</div>
            </div>
          </div>
          <button class="btn-ghost set-btn" id="set-save">Save details</button>
          <div class="set-saved hidden" id="set-saved">Saved ✦</div>
        </div>

        <h3 class="set-heading">About</h3>
        <div class="set-card">
          <button class="set-link-row" id="set-privacy"><span>Privacy policy</span><span class="set-chevron">›</span></button>
          <button class="set-link-row" id="set-terms"><span>Subscription terms</span><span class="set-chevron">›</span></button>
          <div class="set-terms-body hidden" id="set-terms-body">
            Mystic Oracle Plus is an auto-renewing subscription billed through your Google Play
            account. It renews at the end of each period unless cancelled at least 24 hours before.
            Manage or cancel any time in Google Play → Subscriptions. Prices are shown in your local
            currency before purchase. All readings are for entertainment and reflection only.
          </div>
          <div class="set-row">
            <div class="set-row-text"><div class="set-row-label">Version</div></div>
            <div class="set-row-value">${APP_VERSION}</div>
          </div>
        </div>

        <button class="link-btn set-danger" id="set-reset">Reset all app data</button>
      </div>`;

    // --- Plus
    const get = view.querySelector('#set-get');
    if (get) get.addEventListener('click', () => MysticApp.openSubscribe());
    const manage = view.querySelector('#set-manage');
    if (manage) manage.addEventListener('click', () => openUrl(MANAGE_URL));

    const restore = view.querySelector('#set-restore');
    restore.addEventListener('click', async function () {
      restore.textContent = 'Restoring…';
      let ok = false;
      if (MysticApp.billing && MysticApp.billing.restore) {
        try { ok = await MysticApp.billing.restore(); } catch (e) { ok = false; }
      }
      if (ok) open();
      else restore.textContent = 'No purchase found';
    });

    // --- Reminders
    const dailyBtn = view.querySelector('#set-daily');
    const streakBtn = view.querySelector('#set-streak');
    const timeRow = view.querySelector('#set-time-row');

    function setSwitch(btn, on) {
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    }

    dailyBtn.addEventListener('click', async () => {
      const on = !dailyBtn.classList.contains('on');
      setSwitch(dailyBtn, on);
      timeRow.classList.toggle('dimmed', !on);
      if (MysticApp.notify) await MysticApp.notify.setDaily(on);
    });

    streakBtn.addEventListener('click', async () => {
      const on = !streakBtn.classList.contains('on');
      setSwitch(streakBtn, on);
      if (MysticApp.notify) await MysticApp.notify.setStreak(on);
    });

    const aiBtn = view.querySelector('#set-ai');
    if (aiBtn) {
      setSwitch(aiBtn, !aiOff());
      aiBtn.addEventListener('click', () => {
        const on = !aiBtn.classList.contains('on');
        setSwitch(aiBtn, on);
        if (MysticApp.ai) {
          MysticApp.ai.setEnabled(on);
          if (!on) MysticApp.ai.clearCache();
        }
      });
    }

    view.querySelector('#set-time').addEventListener('change', async function () {
      const parts = String(this.value || '09:00').split(':');
      if (MysticApp.notify) await MysticApp.notify.setTime(parseInt(parts[0], 10), parseInt(parts[1], 10));
    });

    // --- Details
    const dob = view.querySelector('#set-dob');
    const signNote = view.querySelector('#set-sign-note');
    dob.addEventListener('change', function () {
      const s = MysticApp.sunSign(this.value);
      signNote.textContent = s || 'Add a birth date to set this';
    });

    view.querySelector('#set-save').addEventListener('click', function () {
      const name = view.querySelector('#set-name').value.trim();
      const birthDate = dob.value;
      const patch = { fullName: name, birthDate: birthDate };
      const s = MysticApp.sunSign(birthDate);
      if (s) patch.sign = s;
      MysticApp.saveProfile(patch);
      const saved = view.querySelector('#set-saved');
      saved.classList.remove('hidden');
      setTimeout(() => saved.classList.add('hidden'), 1800);
    });

    // --- About
    view.querySelector('#set-privacy').addEventListener('click', () => openUrl(PRIVACY_URL));
    view.querySelector('#set-terms').addEventListener('click', () => {
      view.querySelector('#set-terms-body').classList.toggle('hidden');
    });

    // --- Reset
    const reset = view.querySelector('#set-reset');
    let armed = false;
    reset.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        reset.textContent = 'Tap again to erase everything';
        reset.classList.add('armed');
        setTimeout(() => {
          if (!armed) return;
          armed = false;
          reset.textContent = 'Reset all app data';
          reset.classList.remove('armed');
        }, 4000);
        return;
      }
      // Keep the purchase flag — entitlement belongs to the Play account, and
      // billing.js will re-assert it on next launch anyway.
      const keep = MysticApp.isPremium();
      try {
        const doomed = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf('mystic-') === 0 && k !== 'mystic-premium') doomed.push(k);
        }
        doomed.forEach(k => localStorage.removeItem(k));
        if (!keep) localStorage.removeItem('mystic-premium');
      } catch (e) {}
      if (MysticApp.notify) MysticApp.notify.refreshAll();
      MysticApp.refresh();
      MysticApp.showHome();
    });
  }

  MysticApp.settings = { open: open };
})();
