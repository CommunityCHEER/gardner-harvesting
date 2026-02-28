---
applyTo: "eas.json,app.json,metro.config.js,babel.config.js,package.json,ios/**/*,android/**/*"
description: "Expo Build, EAS, and Native Platform Tooling Guidelines"
---

## Build and Deployment Tooling

### EAS (Expo Application Services)
- **Config**: `eas.json` — build profiles (development, preview, production)
- **Build**: `npx eas build --platform <ios|android> --profile production`
- **Submit**: `npx eas submit --platform <ios|android> --latest --profile production`
- **Env vars**: `npx eas env:list --environment production` to verify
- Version source is `remote` (managed by EAS, auto-incremented)

### Environment Variables (CRITICAL)
- `.env` file is gitignored — it only exists locally
- EAS cloud builds get env vars from EAS environment config, NOT from `.env`
- If adding new `EXPO_PUBLIC_*` vars, MUST also add them to EAS:
  `npx eas env:create --environment production --name VAR_NAME --value "value"`
- **Lesson learned**: Moving from hardcoded config to env vars without configuring EAS secrets caused production crashes (black screen, no error)

### Expo Config (app.json)
- `runtimeVersion` must match `version` for OTA update compatibility
- iOS and Android have separate config sections for platform-specific settings
- Plugins configured here: expo-router, expo-localization, expo-image-picker, expo-font, expo-build-properties

### Metro Config (metro.config.js)
- `config.resolver.assetExts.push("cjs")` — required for Firebase compatibility
- Do not add experimental/unstable Metro options without verifying they exist in the installed Metro version's type definitions
- Check `node_modules/metro-config/src/configTypes.d.ts` before adding resolver options

### Babel Config (babel.config.js)
- Only preset should be `babel-preset-expo`
- Do NOT add `@babel/preset-typescript` — it conflicts with expo's built-in TS handling and can cause runtime issues on device while appearing to work in emulator

### iOS Native Code
- **AppDelegate**: Swift-based (`AppDelegate.swift`), required for Expo 53 / RN 0.79
- Old Objective-C AppDelegate (`AppDelegate.mm` + `AppDelegate.h` + `main.m`) was removed during Expo 53 migration
- To regenerate native code: `npx expo prebuild --clean --platform ios --no-install`
- **CRITICAL**: When upgrading Expo SDK major versions, MUST regenerate native code — old native code causes black screen on real devices while appearing to work in emulator/dev builds
- Podfile is managed by Expo prebuild; manual edits should be minimal

### Android Native Code
- Managed by Expo prebuild
- `google-services.json` required for Firebase

### Major Version Upgrades Checklist
When upgrading Expo SDK (e.g., 52 to 53), React, or React Native:
1. Run `npx expo prebuild --clean --platform ios --no-install` to regenerate native code
2. Verify AppDelegate format matches new SDK requirements (ObjC vs Swift)
3. Verify all `EXPO_PUBLIC_*` env vars are set in EAS for all environments
4. Build and test via TestFlight/internal track BEFORE submitting to review
5. Check for Apple SDK version warnings in App Store Connect
6. Local emulator success does NOT guarantee device success — always TestFlight test

### Common Pitfalls (from real incidents)
- **Black screen on TestFlight, works locally**: Usually stale native code or missing env vars
- **Crash on startup**: Check Firebase config — undefined env vars cause silent init failure
- **Emulator works, device doesn't**: Expo dev server uses its own AppDelegate; production uses the project's native code
