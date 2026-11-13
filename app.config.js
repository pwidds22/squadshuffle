// Dynamic Expo config. Static settings live in app.json.
// Account-specific IDs come from environment variables so they stay out of the repo.
// Set them in .env for local builds (see .env.example) and as EAS environment
// variables for cloud builds.

// Google's published sample AdMob app ID. It lets the app build and show test ads
// when no real ID is configured.
const ADMOB_SAMPLE_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-google-mobile-ads',
      { iosAppId: process.env.ADMOB_IOS_APP_ID || ADMOB_SAMPLE_IOS_APP_ID },
    ],
  ],
});
