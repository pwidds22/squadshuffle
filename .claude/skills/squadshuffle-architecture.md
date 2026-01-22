---
name: Squad Shuffle Architecture
description: Architecture rules and patterns for Squad Shuffle mobile app
---

# Squad Shuffle Architecture Rules

## Dependency Rules (STRICT)
- `src/types/` → Pure types, NO imports from other app folders
- `src/database/` → Can import types only
- `src/hooks/` → Can import database and types
- `src/utils/` → Pure functions, no React imports (except for animations)
- `src/components/` → Reusable UI, can import types/hooks/utils
- `src/screens/` → Can import everything
- `src/navigation/` → Can import screens only

## expo-sqlite Patterns
- Database initialized in `src/database/db.ts`
- Schema defined in `src/database/schema.ts`
- CRUD operations in `src/database/queries.ts`
- React hooks wrap queries for reactive updates

## Screen Patterns
- Each screen in its own file in `src/screens/`
- Use custom hooks for data fetching
- Keep screens focused on layout/presentation
- Complex logic goes in hooks or utils

## Component Patterns
- Reusable components in `src/components/`
- Props should be typed with interfaces
- Use StyleSheet.create for styles
- Prefer composition over prop drilling

## Naming Conventions
- Screens: `[Name]Screen.tsx` (e.g., `PlayScreen.tsx`)
- Components: `[Name].tsx` (e.g., `PlayerCard.tsx`)
- Hooks: `use[Name].ts` (e.g., `usePlayers.ts`)
- Types: Singular nouns (e.g., `Player`, not `Players`)
- Database queries: `[action][Entity]` (e.g., `addPlayer`, `getPlayers`)

## Animation Guidelines
- Use `react-native-reanimated` for complex animations
- Use `expo-haptics` for feedback on interactions
- Wheel animation is the hero - make it satisfying
- Aim for 60fps smooth animations

## State Management
- Local state with `useState` for UI state
- expo-sqlite for persistent data
- Custom hooks for data access patterns
- No Redux/MobX needed for MVP

## Navigation Structure
```
MainTabNavigator
├── PlayStack
│   ├── PlayScreen (home)
│   ├── PlayerSelectionScreen
│   ├── GameSelectionScreen
│   ├── TeamConfigScreen
│   ├── RandomizerScreen
│   └── ActiveSessionScreen
├── HistoryScreen
├── StatsScreen
├── PlayersScreen
└── SettingsScreen
```

## Testing Approach
- Test in Expo Go app on physical device
- Create mock data for development
- Verify animations feel smooth
- Test on both iOS and Android
