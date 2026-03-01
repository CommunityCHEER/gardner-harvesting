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
- Expo 55+ default config already includes `cjs` in `sourceExts` and enables `unstable_enablePackageExports` — no customization needed for Firebase or other CJS packages
- Do NOT add `cjs` to `assetExts` — this was a legacy Firebase workaround that conflicts with Expo 55's default config, causing `.cjs` files (e.g., `bignumber.cjs`) to be treated as binary assets instead of JS source, leading to runtime crashes (`Cannot read property 'ROUND_UP' of undefined`)
- Do not add experimental/unstable Metro options without verifying they exist in the installed Metro version's type definitions
- Check `node_modules/metro-config/src/configTypes.d.ts` before adding resolver options

### Babel Config (babel.config.js)
- Only preset should be `babel-preset-expo`
- Do NOT add `@babel/preset-typescript` — it conflicts with expo's built-in TS handling and can cause runtime issues on device while appearing to work in emulator

### iOS Native Code (CNG — Continuous Native Generation)
- The `ios/` and `android/` directories are **generated** by `npx expo prebuild` — treat as build output, not source
- **Both must be in `.gitignore`** — EAS Build runs prebuild itself. Committed native dirs cause `expo doctor` to fail during EAS builds and create stale-code drift.
- **Never hand-edit** native files (AppDelegate, Info.plist, Podfile, xcodeproj, etc.). All changes should flow through `app.json` plugins or config. Hand edits diverge from what prebuild generates and cause crashes that are extremely hard to diagnose.
- **AppDelegate**: Swift-based (`AppDelegate.swift`), required since Expo 53 / RN 0.79
- To regenerate native code: `npx expo prebuild --clean --platform ios --no-install`
- **CRITICAL**: When upgrading Expo SDK major versions, ALWAYS regenerate with `--clean` to avoid stale native code (e.g., old Obj-C AppDelegate, extra Pods references, missing RCTNewArchEnabled flag)
- **Lesson learned**: Committed native code that diverged from prebuild output caused persistent crash/black-screen issues across multiple SDK upgrades. The fix each time was a clean regeneration.
- **CocoaPods**: Do NOT pin a specific version in `eas.json` — let EAS use its default. Pinning caused version mismatches between local Podfile.lock and EAS builds.

### Local Release Testing
- `npx expo start` (dev server) does NOT test native code — it uses Expo's own AppDelegate and dev runtime
- To test a production-like build locally: `npx expo run:ios --configuration Release`
- This is the closest approximation to what EAS builds and submits to TestFlight
- Always test with Release config before submitting to TestFlight/internal track

### Android Native Code
- Managed by Expo prebuild
- `google-services.json` required for Firebase

### Major Version Upgrades Checklist
When upgrading Expo SDK (e.g., 53 to 55), React, or React Native:
1. Audit `metro.config.js` — remove legacy workarounds that may conflict with new defaults (e.g., `assetExts.push("cjs")` broke on Expo 55)
2. Run `npx expo prebuild --clean --platform ios --no-install` to regenerate native code locally (for local testing only — EAS generates its own)
3. Test locally with `npx expo run:ios --configuration Release`
4. Verify all `EXPO_PUBLIC_*` env vars are set in EAS for all environments
5. Build via EAS and test via TestFlight/internal track BEFORE submitting to review
6. Check for Apple SDK version warnings in App Store Connect
7. Local dev server success does NOT guarantee device success — always test Release config and/or TestFlight

### Debugging Release Crashes
- **Reproduce locally first**: `npx expo run:ios --configuration Release` builds a production-like bundle on the simulator
- **Read simulator logs**: `xcrun simctl spawn <UDID> log show --predicate 'process == "GardenerHarvesting" AND (messageType == error OR messageType == fault)' --last 2m --style compact`
  - Get UDID: `xcrun simctl list devices booted`
- **ErrorRecovery masks real errors**: Expo's `ErrorRecovery.tryRelaunchFromCache()` catches JS crashes and retries, then calls `crash()` → SIGABRT. The crash report shows `ErrorRecovery` / `RCTFatalException` but the **real error** is in earlier log lines (e.g., `TypeError: Cannot read property 'ROUND_UP' of undefined`)
- **Cross-platform crash = JS-level issue**: If both iOS AND Android crash on the same build, eliminate all native-specific causes (AppDelegate, CocoaPods, Xcode, etc.) and focus on JS bundle / Metro config

### Common Pitfalls (from real incidents)
- **Black screen on TestFlight, works locally**: Usually stale/hand-modified native code or missing env vars. Fix: `npx expo prebuild --clean`
- **Splash screen then crash**: JS init failure — check Firebase config, env vars, and native module compatibility
- **Crash on startup**: Check Firebase config — undefined env vars cause silent init failure
- **Emulator works, device doesn't**: Expo dev server uses its own AppDelegate; production uses the project's native code. Use `--configuration Release` to catch this locally.
- **CocoaPods version mismatch**: Pinned version in eas.json vs version that generated Podfile.lock = broken native builds. Solution: don't pin.
- **`expo doctor` fails on EAS build**: Native dirs (`ios/`, `android/`) committed to git while app.json has CNG config. Solution: gitignore both dirs, `git rm -r --cached ios/ android/`.
