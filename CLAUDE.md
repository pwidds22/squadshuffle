# Squad Shuffle - Project Constitution

## Session Management (CRITICAL)

### Starting a Session
1. Read `_SESSION.md` if it exists - contains where we left off
2. Read `_HANDOFF.md` for overall project context and full app specification
3. Check git status to see current branch and uncommitted changes

### Ending a Session (ALWAYS DO THIS)
When context is running low or task isn't complete:
1. **Update `_SESSION.md`** with:
   - What was accomplished this session
   - What's in progress (with specific file paths)
   - Exact next steps (be specific!)
   - Any blockers or decisions needed
2. **Commit your work** - even partial progress
3. Tell the user: "Session context is low. I've updated _SESSION.md with handoff notes."

---

## Product Philosophy
- **Solve a real problem**: Friends argue about who "always wins" - we provide proof
- **Delight over features**: The randomization animation IS the product. Make it satisfying.
- **Respect user time**: No account creation, no onboarding tutorial, no upsells. Just works.
- **Local-first**: All data on device. Privacy by default. No server dependencies.
- **Fun but not childish**: Target audience is adult friend groups gaming together

---

## Architecture Rules

### Dependency Rules (STRICT)
- `types/` → NEVER imports from other app folders
- `database/` → Can import types, NEVER imports screens/components
- `hooks/` → Can import database and types
- `components/` → Reusable UI only, minimal business logic
- `screens/` → Can import everything
- `utils/` → Pure functions only, no state

### File Locations
| Type | Location |
|------|----------|
| TypeScript interfaces | `src/types/` |
| Database setup/queries | `src/database/` |
| React hooks | `src/hooks/` |
| Screen components | `src/screens/` |
| Reusable components | `src/components/` |
| Navigation | `src/navigation/` |
| Animations | `src/utils/` |
| Constants/Theme | `src/constants/` |

---

## Tech Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Database**: expo-sqlite (local persistence)
- **Animations**: react-native-reanimated
- **Haptics**: expo-haptics
- **Target**: iOS 17+ / Android 13+

---

## Key Files
- `_HANDOFF.md` - Full project context and app specification (local only, gitignored)
- `_SESSION.md` - Current progress, update every session (local only, gitignored)
- `.claude/plans/` - Detailed implementation plans for larger features
- `.claude/skills/squadshuffle-architecture.md` - Architecture reference

---

## Testing Approach
- Test in Expo Go on physical device
- Create sample data for development
- Focus on happy path for MVP
- Verify animations feel smooth (60fps)

---

## Common Commands

```bash
# Start development
npx expo start

# Install a new Expo package
npx expo install <package-name>

# Build for iOS (requires EAS)
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```
