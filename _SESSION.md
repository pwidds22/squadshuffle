# Current Session State

**Updated:** 2026-01-23
**Branch:** master

## Project Status
Team Randomizer flow implemented with live score tracking and history. Multiple UI/UX issues identified that need addressing.

## Completed This Session
- [x] Fixed invalid 'puzzle' icon → 'extension-puzzle' (Issue #1)
- [x] Fixed wheel visuals - names now centered in segments between divider lines (Issue #2)
- [x] Fixed wheel spin landing - pointer now correctly lands on the announced player

## Previous Sessions Completed
- Updated ActiveGameScreen to show player names on each team
- Implemented HistoryScreen with full session details
- Added `accentLight` color to theme for winner banner
- One-at-a-time wheel spinning
- Live game score tracking (ActiveGameScreen)
- Custom game creation (no default games)
- Configurable settings with database persistence
- Assignment mode options (round-robin vs fill-first)

## Known Issues (User Feedback) - REMAINING

### ~~1. Invalid Icon Warning~~ FIXED
### ~~2. Wheel Visual Issues~~ FIXED

### 3. Team Naming After Reveal
- Currently can only name teams in TeamConfigScreen BEFORE randomizing
- User wants ability to rename teams AFTER seeing the reveal
- File: `src/screens/play/TeamRevealScreen.tsx`
- Add editable team name inputs on the reveal screen

### 4. History Edit/Delete
- File: `src/screens/HistoryScreen.tsx`
- Need to add:
  - Swipe-to-delete or long-press menu for sessions
  - Edit capability for scores/winner
- New queries needed in `src/database/queries.ts`:
  - `deleteSession(sessionId: string)`
  - `updateSession(sessionId, updates)`

### 5. Game Management (Delete Games)
- File: `src/screens/play/GameSelectionScreen.tsx`
- Users should be able to delete games they created
- Add long-press or swipe-to-delete on game cards
- Query exists: `deleteGame(id)` in `src/database/queries.ts:120`

### 6. Keyboard Covering Input
- File: `src/screens/play/GameSelectionScreen.tsx`
- Modal game name input hidden behind keyboard
- Fix: Wrap modal content in `KeyboardAvoidingView` or use `KeyboardAwareScrollView`

### 7. "Play Again" Flow
- File: `src/screens/play/ActiveGameScreen.tsx`
- After ending game, prompt: "Play again?"
  - Option 1: Same teams → create new session with same teams
  - Option 2: Re-shuffle → go back to Randomizer with same players
  - Option 3: Done → go to PlayHome
- This saves a new session, not overwrites

### 8. Auto-Detect Winner by Score
- File: `src/screens/play/ActiveGameScreen.tsx`
- Current: Always asks user to pick winner
- Should: Auto-select winner based on scores
  - If game.lowerScoreWins → lowest score wins
  - Otherwise → highest score wins
  - Still allow manual override
- Need to load game data (currently `game` state is never set)
- Also need to handle:
  - Games where users don't track score (still pick winner manually)
  - Pure random wheel generator (no scoring at all)

### 9. Stats Screen Not Implemented
- File: `src/screens/StatsScreen.tsx`
- Currently shows placeholder "Coming soon"
- Need to implement:
  - Player win rates
  - Game frequency
  - Team combinations that win most

## Files Modified This Session
```
src/screens/play/
├── RandomizerScreen.tsx         # Fixed wheel segment positioning (line 204)
└── GameSelectionScreen.tsx      # Fixed 'puzzle' → 'extension-puzzle' icon (line 43)
```

## Files Needing Work Next
```
src/screens/play/GameSelectionScreen.tsx # Keyboard avoiding (Issue #6)
src/screens/play/TeamRevealScreen.tsx    # Add team renaming (Issue #3)
src/screens/play/ActiveGameScreen.tsx    # Play again, auto-winner (Issues #7, #8)
src/screens/HistoryScreen.tsx            # Edit/delete sessions (Issue #4)
src/screens/StatsScreen.tsx              # Implement stats (Issue #9)
```

## How to Resume
```bash
cd "c:\Users\pwidd\CascadeProjects\team-wheel-app\SquadShuffle"
npx expo start
```

## Priority Order for Remaining Issues
1. ~~**Fix wheel visuals** - Core UX broken (Issue #2)~~ DONE
2. ~~**Fix puzzle icon** - Easy quick fix (Issue #1)~~ DONE
3. **Keyboard avoiding** - Easy quick fix (Issue #6)
4. **Auto-detect winner** - Important for UX (Issue #8)
5. **Play again flow** - Nice to have (Issue #7)
6. **Team renaming** - Nice to have (Issue #3)
7. **History edit/delete** - Nice to have (Issue #4)
8. **Game deletion** - Nice to have (Issue #5)
9. **Stats screen** - Lower priority (Issue #9)

## Blockers/Questions
- None, just need to work through the issues list
