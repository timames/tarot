// AdMob integration for Capacitor native apps
// On web (browser), ads are skipped gracefully

(async function initAds() {
  // Only run on native platforms
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

    await AdMob.initialize({
      initializeForTesting: true // Set to false for production
    });

    // Show banner ad at bottom of screen
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111', // Test ad ID - replace with real one
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true // Set to false for production
    });

    // Show interstitial ad between readings
    window.showInterstitialAd = async function () {
      try {
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-3940256099942544/1033173712', // Test ad ID
          isTesting: true
        });
        await AdMob.showInterstitial();
      } catch (e) {
        console.log('Interstitial ad not available:', e);
      }
    };
  } catch (e) {
    console.log('AdMob not available:', e);
  }
})();
