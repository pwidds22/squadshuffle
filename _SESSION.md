# Current Session State

**Updated:** 2026-01-25
**Branch:** main
**Status:** App Store submission in progress

## What Was Accomplished This Session

### iOS Build & App Store Connect Setup
- Configured `app.json` with iOS bundle ID: `com.pwidd.squadshuffle`
- Created `eas.json` for EAS Build configuration
- Built iOS production app with `eas build --platform ios --profile production`
- Submitted build to App Store Connect via `eas submit`
- **Build 1.0.0 (1) is now "Ready to Submit" in TestFlight**

### App Icon
- User generated app icon (spin wheel design)
- Copied to `assets/icon.png` and `assets/splash-icon.png`

## In Progress: App Store Submission

Build is in App Store Connect but needs metadata before submission.

### Required Fields (NOT YET FILLED)
1. **Screenshots** - Need iPhone 6.7" (1290×2796) and 6.5" (1284×2778)
2. **Privacy Policy URL** - Must host somewhere (GitHub Pages works)
3. **Support URL** - Can use GitHub repo
4. **Age Rating** - Answer questionnaire (should be 4+)

### Ready-to-Use Content (COPY THESE)

**App Description:**
```
Squad Shuffle makes picking teams fun! Spin the wheel to randomly assign players to teams for game night, sports, or any group activity.

Features:
• Satisfying spin wheel animation with haptic feedback
• Track player stats across games - see who really wins the most
• Multiple team configurations (2-4 teams)
• Game history with scores and placements
• Head-to-head records between players
• Strength of schedule calculations
• Works completely offline - all data stays on your device

Perfect for:
- Board game nights
- Pickup sports games
- Party games
- Any activity where you need fair, random teams

No account required. No ads. Just spin and play!
```

**Keywords (100 char limit):**
```
teams,randomizer,spinner,wheel,game night,party,sports,picker,random,group,friends
```

**Promotional Text:**
```
The fun way to pick teams! Spin the wheel, track stats, and settle the debate about who really wins the most.
```

**Category:** Games → Casual (Primary), Entertainment (Secondary)

## Next Steps

1. **Create Privacy Policy** - Use freeprivacypolicy.com or host on GitHub Pages
2. **Create Support URL** - Create `squadshuffle-support` GitHub repo
3. **Take Screenshots** - Run in iOS Simulator (iPhone 15 Pro Max + iPhone 11 Pro Max)
4. **Fill App Store Connect** - Use content above
5. **Submit for Review**

## Files Modified This Session
- `app.json` - Added iOS config (bundleIdentifier, buildNumber, infoPlist)
- `eas.json` - NEW - EAS Build configuration
- `assets/icon.png` - User's spin wheel icon
- `assets/splash-icon.png` - Same icon for splash

## How to Resume
```bash
cd "c:\Users\pwidd\CascadeProjects\team-wheel-app\SquadShuffle"
npx expo start -c
```

For screenshots in iOS Simulator:
```bash
# Open Simulator, run app, press Cmd+S to capture
```

## Blockers
- None - just need to create privacy policy and take screenshots
