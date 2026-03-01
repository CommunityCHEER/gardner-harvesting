---
applyTo: "app/**/*.{ts,tsx},components/**/*.{ts,tsx},hooks/**/*.{ts,tsx},constants/**/*.ts,types/**/*.ts,context.ts,i18n.ts"
description: "Expo/React Native Frontend Development Guidelines"
---

## Frontend (Expo + React Native + TypeScript)

- **Framework**: Expo SDK 55, React 19.2, React Native 0.83
- **Routing**: expo-router (file-based routing in `app/`)
- **Language**: TypeScript (~5.8)
- **State**: React Context (`context.ts`) for Firebase services and participation; local `useState` for component state
- **i18n**: `i18n-js` with expo-localization; translations in `i18n.ts`
- **Styling**: StyleSheet objects in `constants/style.ts` and `constants/Colors.ts`

### Project Structure
- `app/` — Expo Router screens and layouts
- `app/(tabs)/` — Tab-based navigation screens
- `components/` — Reusable UI components
- `hooks/` — Custom React hooks (`useAuthState`, `useList`)
- `constants/` — Shared styles and colors
- `types/` — TypeScript interfaces (Firestore document types)
- `context.ts` — React Context definitions for Firebase and participation
- `firebaseConfig.ts` — Firebase initialization (native)
- `firebaseConfig.web.ts` — Firebase initialization (web)

### Key Patterns
- Firebase services (auth, db, storage, realtime) provided via `firebaseContext`
- Custom hooks replace `react-firebase-hooks` — do not reintroduce that dependency
- Custom `Dropdown` component replaces `react-native-dropdown-picker` — do not reintroduce that dependency
- `@/` path alias maps to project root via `tsconfig.json` and `jest.config.js`
- `NoteModal` and `ImagePicker` are extracted components from `HarvestForm`
- Toast notifications via `react-native-toast-message`

### Null Safety
- Always use optional chaining for `getLocales()` results: `getLocales()?.[0]?.languageTag ?? 'en'`
- Always add dependency arrays to `useEffect` hooks — missing deps cause infinite re-renders

### Testing
- **Framework**: Jest with `jest-expo` preset
- **Libraries**: `@testing-library/react-native`, `react-test-renderer`
- **Location**: `components/__tests__/`, `hooks/__tests__/`
- **Run**: `npx jest` (all tests), `npx jest --watchAll` (watch mode)
- **Mocking**: Firebase services mocked in `jest.setup.js`

### TDD (MANDATORY)

1. RED: Create test in `__tests__/` then `npx jest` then **EXPECT FAIL**
2. GREEN: Implement component/hook then `npx jest` then **EXPECT PASS**
3. REFACTOR: Clean up then `npx jest` then **EXPECT PASS**
