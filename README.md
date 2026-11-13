# Squad Shuffle

An iOS app that randomly splits a group into fair teams.

[Download on the App Store](https://apps.apple.com/us/app/squad-shuffle/id6758277622)

## What it does

- Spins a wheel to assign players to teams one at a time, either alternating between teams or filling one team first.
- Tracks live scores during a game and records the winner.
- Keeps a history of past games and per-player stats, such as win rate and head-to-head records.
- Stores everything on the device in SQLite. There are no accounts and no server.

## Tech stack

- [Expo](https://expo.dev) and React Native, written in TypeScript
- React Navigation for screens and tabs
- expo-sqlite for local storage
- react-native-reanimated and react-native-svg for the spin wheel
- [RevenueCat](https://www.revenuecat.com) for the optional premium upgrade
- Google AdMob for banner ads in the free version
- EAS Build and EAS Submit for App Store builds

## Built with Claude Code

I built this app with [Claude Code](https://claude.com/claude-code).
[CLAUDE.md](CLAUDE.md) holds the project rules that Claude follows: product goals, folder structure, and dependency rules.
[.claude/skills/squadshuffle-architecture.md](.claude/skills/squadshuffle-architecture.md) is a skill file with the architecture and coding patterns.

## How to run

You need Node.js 20.19 or later and an iPhone or the iOS Simulator.
The app uses native modules (RevenueCat, AdMob), so it runs in a development build, not in Expo Go.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   All values are optional for local development.
   Without a RevenueCat key, the paywall stays inactive.
   Without AdMob IDs, the app shows Google test ads.

3. Build and run on iOS:

   ```bash
   npx expo run:ios
   ```

### Building with EAS

EAS cloud builds do not read your local `.env` file.
Set the same variables in your Expo project before you build:

```bash
eas env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value <key> --environment production
```

Repeat for each variable in `.env.example`, then run `eas build --platform ios`.
