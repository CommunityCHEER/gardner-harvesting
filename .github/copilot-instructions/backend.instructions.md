---
applyTo: "firebaseConfig.ts,firebaseConfig.web.ts,firebase.json,context.ts"
description: "Firebase Backend Services Guidelines"
---

## Backend (Firebase)

- **Services**: Authentication, Firestore, Realtime Database, Storage
- **Config**: `firebaseConfig.ts` (native), `firebaseConfig.web.ts` (web)
- **Context**: Firebase services exposed via `firebaseContext` in `context.ts`

### Firebase Configuration

Firebase config uses environment variables (`EXPO_PUBLIC_FIREBASE_*`):
- Local dev: `.env` file (gitignored)
- EAS builds: configured via `eas env:list --environment production`
- **CRITICAL**: If env vars are missing, `initializeApp()` gets undefined config and app crashes silently or shows black screen
- The validation block in `firebaseConfig.ts` logs missing keys — check console output when debugging startup issues

### Auth Initialization
- Native (iOS/Android): `initializeAuth` with `getReactNativePersistence(AsyncStorage)`
- Web: `getAuth` with `inMemoryPersistence`
- Platform-specific initialization is in `firebaseConfig.ts` / `firebaseConfig.web.ts`

### Data Model
- Firestore document types defined in `types/firestore.ts`
- Collections: `gardens`, `crops`, `people`, `people/{uid}/participation`
- Realtime Database used for live harvest totals

### Rules
- Never hardcode Firebase credentials in source — always use `EXPO_PUBLIC_*` env vars
- When adding new Firebase services, add them to `FirebaseContext` interface in `context.ts`
- When modifying Firebase config, verify both native and web configs are updated
