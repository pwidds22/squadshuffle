# Squad Shuffle - Project Handoff Document

## What Is This App?

Squad Shuffle is a mobile app for friend groups who play games together. It randomly generates teams, keeps score during games, and tracks historical win/loss records so there's proof when someone claims "I always win."

**Target User**: Adult friend groups (20s-40s) who regularly game together - trivia nights, Roblox, golf, board games, etc.

**Core Value Prop**: The only team randomizer that remembers your players and tracks who actually wins.

---

## Current State

**Status**: Initial setup phase
**Tech Stack**: Expo (React Native) + TypeScript + expo-sqlite

---

## Core Problem Being Solved

Friend groups currently use random wheel generators but:
- Have to retype names every single time
- No record of who won
- No way to settle "I always win" arguments
- No score tracking during trivia/games
- No separation of records by game type

---

## Data Models

### Player
```typescript
interface Player {
  id: string;
  name: string;
  dateAdded: number;
  isActive: boolean;  // "Retired" players hidden from selection but keep history
}
```

### Game (the type of game, not a session)
```typescript
interface Game {
  id: string;
  name: string;        // e.g., "Roblox", "Golf", "Trivia Night"
  iconName: string;    // Ionicons name
  dateCreated: number;
}
```

### GameSession
```typescript
interface GameSession {
  id: string;
  gameId: string;
  date: number;
  winningTeamId: string | null;  // null if no winner recorded
  isComplete: boolean;
  notes: string | null;
}
```

### Team
```typescript
interface Team {
  id: string;
  sessionId: string;
  name: string;           // "Team 1" or custom
  playerIds: string[];    // JSON array in SQLite
  score: number | null;
}
```

---

## Feature Specification

### 1. Player Management
- Add new players (just a name)
- View all players in a list
- Edit player names
- Deactivate players (hide from selection, keep history)
- Delete players (with warning about losing history)

### 2. Game Type Management
- Pre-populated defaults: "Roblox", "Golf", "Trivia", "Board Games", "Video Games", "Other"
- Add custom game types with name + icon picker
- Edit/delete game types

### 3. Team Randomization (THE MAIN EVENT)
- Select which players are playing (checkboxes from saved list)
- Choose number of teams (2, 3, 4, or custom)
- Choose game type for this session
- **Animation options:**
  - Wheel spin (players removed from wheel as picked) - DEFAULT
  - Card shuffle/deal animation
  - Simple reveal with suspense delay
- **Setting:** "Remove player after picked" (default ON) vs "allow repeats"
- Option to name teams or use defaults
- "Re-randomize" button before confirming
- "Lock Teams" button to start session

### 4. Score Tracking (During Active Session)
- +1 / -1 buttons for each team
- Large, tap-friendly score display
- Quick-add buttons (+5, +10) for bigger point games
- Running score visible throughout

### 5. Session Completion
- "End Game" button
- Select winning team (or "No Winner" for casual)
- Optional notes field
- Confirmation before saving

### 6. Records & History

**Session History:**
- List of past sessions, newest first
- Filter by game type
- Shows: date, game, teams, winner
- Tap for full details

**Player Stats:**
- Overall: wins, losses, win %, games played
- Per-game breakdown
- Win streak tracking

**Leaderboards:**
- Overall leaderboard
- Per-game leaderboards
- Sort by: wins, win %, games played

### 7. Settings
- Default number of teams
- Default animation style
- Remove player after picked toggle
- Export/clear data

---

## Navigation Structure

```
Tab Bar:
├── Play (main randomizer flow)
├── History (past sessions)
├── Stats (leaderboards & records)
├── Players (manage player list)
└── Settings
```

### Key Screens

**Play Tab (Home)**
- Big "New Game" button
- Last session summary
- Quick-select recent players

**New Game Flow**
1. Select players (grid with checkboxes + "Add New")
2. Select game type (icon grid)
3. Configure (team count, names optional)
4. Randomize (THE FUN ANIMATION)
5. Active game (score tracking)
6. End game (record winner)

**Randomization Screen**
- Full screen takeover
- Wheel/cards/reveal animation
- Haptic feedback on shuffle
- Dramatic team reveal
- "Shuffle Again" / "Lock Teams" buttons

**Active Session**
- Teams with player names
- Large score display per team
- +/- buttons
- "End Game" button

**Stats/Leaderboard**
- Segmented: Overall | By Game
- Player list with wins, win %
- Tap player for detailed stats

---

## UI/UX Guidelines

- **Fun and playful but not childish** - adult friend groups
- **Big tap targets** - especially score buttons
- **Satisfying animations** - randomization is the wow moment
- **Dark mode support**
- **Minimal onboarding** - should be obvious

---

## Project Structure

```
SquadShuffle/
├── App.tsx
├── app.json
├── CLAUDE.md
├── _HANDOFF.md
├── _SESSION.md
├── .claude/
├── src/
│   ├── navigation/
│   │   └── MainTabNavigator.tsx
│   ├── screens/
│   │   ├── PlayScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── PlayersScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── PlayerCard.tsx
│   │   ├── TeamCard.tsx
│   │   ├── ScoreButton.tsx
│   │   └── AnimatedWheel.tsx
│   ├── database/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   └── queries.ts
│   ├── hooks/
│   │   ├── usePlayers.ts
│   │   ├── useGames.ts
│   │   └── useSessions.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── randomizer.ts
│   └── constants/
│       └── theme.ts
└── assets/
```

---

## Phase Plan

### Phase 1: MVP (Build First)
- [x] Project structure setup
- [ ] Player management (add, list, select)
- [ ] Basic game type selection
- [ ] Team randomization with simple animation
- [ ] Session recording (teams + winner)
- [ ] Basic history view
- [ ] Basic player stats

### Phase 2: Polish
- [ ] Fancy wheel animation
- [ ] Score tracking during sessions
- [ ] Detailed leaderboards
- [ ] Haptic feedback
- [ ] Better animations throughout

### Phase 3: Nice-to-Haves
- [ ] Team combination history
- [ ] Widgets
- [ ] iCloud sync
- [ ] Apple Watch companion
- [ ] SharePlay support

---

## App Store Info

**App Name:** Squad Shuffle
**Subtitle:** Random Team Generator & Score Tracker
**Bundle ID:** com.squadshuffle.app
**Privacy:** No data collected, all local storage
**Price:** Free (v1)

**Keywords:**
```
team,random,generator,shuffle,groups,picker,wheel,trivia,games,score,friends
```

---

## Decisions Made

- Expo/React Native over Swift (no Mac needed for development)
- expo-sqlite for local persistence
- TypeScript for type safety
- react-native-reanimated for smooth animations
- iOS 17+ / Android 13+ target

## Open Questions

- Final app icon design direction?
- Sound effects on shuffle? (optional)
