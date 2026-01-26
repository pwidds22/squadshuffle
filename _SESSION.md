# Current Session State

**Updated:** 2026-01-25
**Branch:** main
**Status:** Development build READY - install and test on device

---

## IMMEDIATE NEXT STEP

**Install the development build on your iPhone:**
1. Go to https://expo.dev → squad-shuffle → Builds
2. Click the latest build (Jan 25, 2026)
3. Click "Install" button
4. Scan QR code with your iPhone camera
5. Install and open the app

---

## What Was Accomplished This Session

### Freemium Model Implemented
We added a paid subscription system to your app:

**Free Tier:**
- Spin the wheel to randomize teams
- Manage players (add/edit/delete)
- Play games and track scores during a session
- See banner ads at the bottom of screens

**Premium Tier ($0.99/month OR $2.99 lifetime):**
- Access Stats tab (leaderboards, player stats)
- Access History tab (past games)
- No ads

### External Services Set Up

| Service | Purpose | Status |
|---------|---------|--------|
| **RevenueCat** | Handles subscriptions & payments | Configured |
| **AdMob** | Shows banner ads to free users | Configured |
| **App Store Connect** | Where products are sold | Products created |

### API Keys (KEEP THESE SAFE)

**RevenueCat:**
- Production: `appl_ltvHSeDdmUqHroatKGKWeCooQkM`
- Test: `test_AUzqJwqdrRsWGcFHIjeuoqiYavw`

**AdMob:**
- iOS App ID: `ca-app-pub-3508537774608099~5696308409`
- Banner Ad Unit ID: `ca-app-pub-3508537774608099/4654689472`

**App Store Products:**
- Monthly: `com.pwidd.squadshuffle.premium.monthly` ($0.99)
- Lifetime: `com.pwidd.squadshuffle.premium.lifetime` ($2.99)

---

## Files Created This Session

| File | What It Does |
|------|--------------|
| `src/contexts/SubscriptionContext.tsx` | Manages subscription state (are they premium?) |
| `src/components/PaywallModal.tsx` | The "Upgrade to Premium" popup |
| `src/components/BannerAd.tsx` | Shows ads at bottom of screens |

## Files Modified This Session

| File | What Changed |
|------|--------------|
| `app.json` | Added AdMob config, bumped build number to 2 |
| `App.tsx` | Wrapped app with SubscriptionProvider |
| `src/navigation/MainTabNavigator.tsx` | Added tab gating (blocks Stats/History for free users) |
| `src/screens/SettingsScreen.tsx` | Added subscription management section |
| `src/screens/play/PlayHomeScreen.tsx` | Added banner ad |
| `src/screens/PlayersScreen.tsx` | Added banner ad |

---

## IMPORTANT: How to Test

### Why Expo Go Won't Work Anymore

Expo Go is a pre-built app that can run basic React Native code. But we added:
- **RevenueCat** (native payment SDK)
- **AdMob** (native ad SDK)

These require compiling native code, which Expo Go can't do.

### Your Options

**Option 1: EAS Development Build (recommended - works from any computer)**
```bash
# Login to Expo (first time only)
eas login

# Build a development version
eas build --profile development --platform ios

# After build completes (~15-20 min), install on your device via QR code
```

**Option 2: Local Build (requires Mac with Xcode)**
```bash
npx expo run:ios
```

---

## Before App Store Submission

### Still Need To Do

1. **Build and test the app** - Create development build and verify:
   - [ ] App launches without crashing
   - [ ] Tapping Stats/History shows paywall
   - [ ] Paywall shows correct prices
   - [ ] Purchase flow works (use sandbox account)
   - [ ] Ads appear for free users
   - [ ] Ads disappear after purchase

2. **App Store Connect metadata**:
   - [ ] Screenshots (iPhone 6.5" and 6.7")
   - [ ] Privacy Policy URL (must now mention ads)
   - [ ] Support URL
   - [ ] Update description (remove "No ads" claim)

3. **Create production build** after testing:
   ```bash
   eas build --profile production --platform ios
   eas submit --platform ios
   ```

---

## Updated App Description (for App Store)

```
Squad Shuffle makes picking teams fun! Spin the wheel to randomly assign players to teams for game night, sports, or any group activity.

Features:
• Satisfying spin wheel animation with haptic feedback
• Multiple team configurations (2-4 teams)
• Works completely offline - all data stays on your device

Premium Features:
• Track player stats across games - see who really wins the most
• Game history with scores and placements
• Head-to-head records between players
• Ad-free experience

Perfect for:
- Board game nights
- Pickup sports games
- Party games
- Any activity where you need fair, random teams

No account required. Just spin and play!
```

---

## How the Paywall Works (simple explanation)

1. User opens app → App checks if they're premium (RevenueCat)
2. User taps Stats or History tab → App checks if premium
3. If NOT premium → Shows upgrade popup instead
4. User can buy monthly ($0.99) or lifetime ($2.99)
5. After purchase → Tabs unlock, ads disappear

---

## Quick Glossary

| Term | What It Means |
|------|---------------|
| **RevenueCat** | Service that manages subscriptions. Handles Apple payments for you. |
| **AdMob** | Google's ad network. Pays you when users see ads. |
| **EAS** | Expo's cloud build service. Builds your app on their servers. |
| **Development build** | A testable version of your app with native code. |
| **Sandbox** | Test mode for purchases. No real money charged. |

---

## Previous Session Notes (App Store Setup)

Build 1.0.0 (1) was submitted to TestFlight but does NOT have the freemium features.
You need to build and submit version 1.0.0 (2) which includes the paywall and ads.

**Keywords (100 char limit):**
```
teams,randomizer,spinner,wheel,game night,party,sports,picker,random,group,friends
```

**Promotional Text:**
```
The fun way to pick teams! Spin the wheel, track stats, and settle the debate about who really wins the most.
```

**Category:** Games → Casual (Primary), Entertainment (Secondary)
