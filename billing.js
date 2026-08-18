// billing.js — "Mystic Oracle Plus" subscription via RevenueCat.
// Runs only on native platforms; in a browser it shows the marketing screen
// with a preview "simulate Plus" button so the unlocked state can be tested.
//
// ── TO GO LIVE ──────────────────────────────────────────────────────────────
// 1. Install the plugin and sync native:
//        npm i @revenuecat/purchases-capacitor
//        npx cap sync
// 2. Create a RevenueCat project (https://app.revenuecat.com):
//        • Add your Google Play app; paste the Play service-account credentials.
//        • Create an Entitlement with identifier "plus".
//        • Create two subscription products in Play Console
//          (e.g. net.ripdi.mystic_oracle.plus.monthly / .annual), import them
//          into RevenueCat, attach both to the "plus" entitlement.
//        • Create an Offering (identifier "default") with a Monthly and an
//          Annual package pointing at those products.
// 3. Paste your RevenueCat PUBLIC API keys below (Project → API keys):
//        Android key starts "goog_...", iOS key starts "appl_...".
// 4. Because this app has no bundler, the native plugin is reached through the
//    Capacitor bridge (registerPlugin('PurchasesPlugin')). After `cap sync`,
//    verify method names on-device — RevenueCat keeps the bridge API stable
//    (configure / getOfferings / purchasePackage / getCustomerInfo /
//    restorePurchases), but test a sandbox purchase before release.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const RC = {
    ANDROID_API_KEY: 'goog_usVUJpmnYfHeVeLJaKLsXCHATys',
    IOS_API_KEY: 'appl_YOUR_REVENUECAT_PUBLIC_KEY',     // TODO
    ENTITLEMENT_ID: 'plus'
  };

  let Purchases = null;
  let offering = null;   // current offering (holds the packages)
  let ready = false;

  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform()); }
  function platform() { try { return window.Capacitor.getPlatform(); } catch (e) { return 'web'; } }

  function hasPlus(customerInfo) {
    try {
      const active = customerInfo && customerInfo.entitlements && customerInfo.entitlements.active;
      return !!(active && active[RC.ENTITLEMENT_ID]);
    } catch (e) { return false; }
  }

  async function init() {
    if (!isNative()) return; // browser preview — no billing SDK
    try {
      Purchases = window.Capacitor.registerPlugin('PurchasesPlugin');
      const apiKey = platform() === 'ios' ? RC.IOS_API_KEY : RC.ANDROID_API_KEY;
      await Purchases.configure({ apiKey });
      ready = true;
      await refreshStatus();
      try { await loadOfferings(); } catch (e) { /* offerings load lazily too */ }
    } catch (e) {
      console.log('RevenueCat unavailable:', e);
      Purchases = null;
      ready = false;
    }
  }

  async function refreshStatus() {
    if (!Purchases) return false;
    try {
      const res = await Purchases.getCustomerInfo();
      const active = hasPlus(res && res.customerInfo);
      MysticApp.applyPremium(active);
      return active;
    } catch (e) { return false; }
  }

  async function loadOfferings() {
    if (!Purchases) return null;
    const res = await Purchases.getOfferings();
    offering = (res && res.current) || null;
    return offering;
  }

  function packages() { return (offering && offering.availablePackages) || []; }
  function findPkg(type) {
    return packages().find(p => String(p.packageType || '').toUpperCase() === type);
  }
  function priceOf(pkg) {
    try { return (pkg && pkg.product && pkg.product.priceString) || ''; } catch (e) { return ''; }
  }

  async function purchase(pkg) {
    if (!Purchases || !pkg) return false;
    const res = await Purchases.purchasePackage({ aPackage: pkg });
    const active = hasPlus(res && res.customerInfo);
    MysticApp.applyPremium(active);
    return active;
  }

  async function restore() {
    if (!Purchases) return false;
    try {
      const res = await Purchases.restorePurchases();
      const active = hasPlus(res && res.customerInfo);
      MysticApp.applyPremium(active);
      return active;
    } catch (e) { return false; }
  }

  // --- Subscribe screen -----------------------------------------------------

  function el(id) { return document.getElementById(id); }

  function enterView(title, subtitle) {
    const home = el('home'), view = el('module-view'), back = el('btn-back');
    const t = el('app-title'), st = el('app-subtitle');
    const footer = document.querySelector('.app-footer');
    home.classList.add('hidden');
    view.classList.remove('hidden');
    back.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    t.textContent = title;
    st.textContent = subtitle;
    window.scrollTo(0, 0);
    return view;
  }

  const BENEFITS = `
    <ul class="sub-benefits">
      <li>Every oracle unlocked, every day</li>
      <li>No ads, anywhere — banners and interstitials gone</li>
      <li>New: monthly &amp; yearly horoscopes</li>
      <li>Full natal chart</li>
      <li>Tree of Life &amp; Grand Tableau tarot spreads</li>
    </ul>`;

  function planCard(pkg, tag) {
    const price = priceOf(pkg);
    const type = String(pkg.packageType || '').toUpperCase();
    const label = type === 'ANNUAL' ? 'Yearly' : type === 'MONTHLY' ? 'Monthly' : (pkg.identifier || 'Plan');
    const per = type === 'ANNUAL' ? '/year' : type === 'MONTHLY' ? '/month' : '';
    return `
      <button class="plan-card${tag ? ' plan-best' : ''}" data-type="${type}">
        ${tag ? `<div class="plan-tag">${tag}</div>` : ''}
        <div class="plan-name">${label}</div>
        <div class="plan-price">${MysticApp.esc(price || '—')}<span>${per}</span></div>
      </button>`;
  }

  function renderPurchased(view) {
    view.innerHTML = `
      <div class="subscribe">
        <div class="sub-crown">${MysticApp.icons.star}</div>
        <h2>You’re Plus ✦</h2>
        <p class="sub-thanks">Every oracle is unlocked and the ads are gone. Thank you.</p>
        <button class="btn-primary" id="sub-done">Continue</button>
      </div>`;
    const d = view.querySelector('#sub-done');
    if (d) d.addEventListener('click', () => MysticApp.showHome());
  }

  async function openSubscribe() {
    const view = enterView('Mystic Oracle Plus', 'Every oracle, no ads');

    // Already subscribed → confirmation.
    if (MysticApp.isPremium()) { renderPurchased(view); return; }

    // Try to have offerings ready for live pricing.
    if (ready && !offering) { try { await loadOfferings(); } catch (e) {} }

    const monthly = findPkg('MONTHLY');
    const annual = findPkg('ANNUAL');
    const havePlans = !!(monthly || annual);

    let plansHtml;
    if (havePlans) {
      plansHtml = `<div class="plan-row">
        ${monthly ? planCard(monthly, '') : ''}
        ${annual ? planCard(annual, 'Best value') : ''}
      </div>
      <button class="btn-primary sub-cta" id="sub-buy">Start Plus</button>`;
    } else {
      // No live offerings (browser preview or not-yet-configured build).
      plansHtml = `<div class="sub-note">Subscription pricing loads from the store on a device.
        ${isNative() ? 'If this persists, check your RevenueCat offerings and API key.' : ''}</div>`;
    }

    view.innerHTML = `
      <div class="subscribe">
        <div class="sub-crown">${MysticApp.icons.star}</div>
        <h2>Mystic Oracle Plus</h2>
        ${BENEFITS}
        ${plansHtml}
        <div class="sub-terms">Recurring subscription — cancel anytime in Google Play. Payment is charged to your Play account and renews unless canceled at least 24h before the period ends.</div>
        <button class="link-btn" id="sub-restore">Restore purchase</button>
        ${!isNative() ? '<button class="link-btn sub-preview" id="sub-sim">Preview: simulate Plus</button>' : ''}
      </div>`;

    let chosen = annual || monthly;
    const cards = view.querySelectorAll('.plan-card');
    cards.forEach(c => {
      if (chosen && String(chosen.packageType).toUpperCase() === c.dataset.type) c.classList.add('selected');
      c.addEventListener('click', () => {
        cards.forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        chosen = (c.dataset.type === 'ANNUAL') ? annual : monthly;
      });
    });

    const buy = view.querySelector('#sub-buy');
    if (buy) buy.addEventListener('click', async () => {
      if (!chosen) return;
      buy.disabled = true; buy.textContent = 'Contacting store…';
      try {
        const ok = await purchase(chosen);
        if (ok) renderPurchased(view);
        else { buy.disabled = false; buy.textContent = 'Start Plus'; }
      } catch (e) {
        buy.disabled = false; buy.textContent = 'Start Plus';
      }
    });

    const r = view.querySelector('#sub-restore');
    if (r) r.addEventListener('click', async () => {
      r.textContent = 'Restoring…';
      const ok = await restore();
      if (ok) renderPurchased(view);
      else r.textContent = 'No purchase found';
    });

    const sim = view.querySelector('#sub-sim');
    if (sim) sim.addEventListener('click', () => { MysticApp.applyPremium(true); renderPurchased(view); });
  }

  MysticApp.billing = { init, refreshStatus, loadOfferings, purchase, restore, openSubscribe };

  init();
})();
