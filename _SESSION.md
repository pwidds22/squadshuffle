# Current Session State

**Updated:** 2026-01-28
**Branch:** main
**Status:** App submitted to App Store Connect - awaiting review

---

## IMMEDIATE NEXT STEP

**Wait for App Store review.** The app has been:
1. Built with all fixes (`eas build --platform ios --profile production`)
2. Submitted to App Store Connect (`eas submit --platform ios --latest`)
3. App Privacy declarations updated (removed tracking declaration)

Expected review time: 24-48 hours

---

## What Was Accomplished This Session

### 1. App Store Rejection Fixes (Completed)

**Issue 1: Missing Terms/Privacy Links (Guideline 3.1.2)**
- Added Terms of Use and Privacy Policy links to `src/components/PaywallModal.tsx`
- Added Terms of Use and Privacy Policy links to `src/screens/SettingsScreen.tsx`
- Links open in Safari via `Linking.openURL()`

**Issue 2: ATT Declaration Mismatch (Guideline 2.1)**
- Removed `NSUserTrackingUsageDescription` from `app.json` (line 23)
- App uses non-personalized ads only (`requestNonPersonalizedAdsOnly: true`)
- Updated App Privacy declarations in App Store Connect to remove "Tracking"

### 2. Manual Game Entry Feature (Completed)

New feature allowing users to manually enter past games without using the wheel.

**Files Created:**
- `src/screens/ManualGameEntryScreen.tsx` - Multi-step form with modal-based UI
- `src/navigation/HistoryStackNavigator.tsx` - Stack navigator for History tab

**Files Modified:**
- `src/screens/HistoryScreen.tsx` - Added "+" button in header (line 35-46)
- `src/navigation/MainTabNavigator.tsx` - Changed to use HistoryStackNavigator (line 10, 75)
- `package.json` - Removed unused `@react-native-picker/picker` dependency

**Feature includes:**
- Select existing game or create new game type
- Select players who participated
- Dynamic team count based on selected players
- Modal-based team assignment (replaced broken native Picker)
- Score entry per team
- Auto-detect winner from scores

---

## Legal URLs (Keep These)

- **Terms of Use:** https://peat-bow-b31.notion.site/Terms-of-Use-Squad-Shuffle-2f6a02984392803493bedebbc769108d
- **Privacy Policy:** https://peat-bow-b31.notion.site/Privacy-Policy-Squad-Shuffle-2f4a029843928086b94ed06b40459eb9

---

## Build Info

**Latest Production Build:**
- Build profile: production
- Submitted to: App Store Connect / TestFlight
- Build number: 8 (auto-incremented by EAS)

---

## If App Gets Rejected Again

1. Check rejection reason in App Store Connect
2. The most likely remaining issues:
   - Review the Terms/Privacy content if Apple wants specific wording
   - Verify ads are actually non-personalized in production

---

## API Keys Reference (KEEP SAFE)

**RevenueCat:**
- Production: `appl_ltvHSeDdmUqHroatKGKWeCooQkM`

**AdMob:**
- iOS App ID: `ca-app-pub-3508537774608099~5696308409`
- Banner Ad Unit ID: `ca-app-pub-3508537774608099/4654689472`

**App Store Products:**
- Monthly: `com.pwidd.squadshuffle.premium.monthly` ($0.99)
- Lifetime: `com.pwidd.squadshuffle.premium.lifetime` ($2.99)

---

## Development Workflow Reminder

Since this app uses native modules (AdMob, RevenueCat), you cannot use Expo Go.

**To test changes:**
1. Build with EAS: `eas build --platform ios --profile preview`
2. Install from Expo dashboard or TestFlight
3. For App Store submission: `eas build --platform ios --profile production` then `eas submit --platform ios --latest`

---

## Git Log (Recent)

```
980e587 Improve Manual Game Entry UX and remove unused picker
dff30e2 Add App Store fixes and manual game entry feature
f29add8 Prepare for App Store submission
a1fe33c Add freemium paywall with RevenueCat and AdMob
```
