# Gardner Harvesting — Developer Guide

App for tracking/logging participation in CHEER's Long Branch Gardener Program and uploading harvest data.

> For project purpose, architecture overview, and history, see [README.adoc](README.adoc).
> For known bugs and stabilization work, see [docs/quick-fixes-bundle-prd.md](docs/quick-fixes-bundle-prd.md) and [docs/quick-fixes-bundle-techspec.md](docs/quick-fixes-bundle-techspec.md).

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (SDK 53) | ~53.0.0 |
| React Native | react-native | 0.79.6 |
| React | react | 19.0.0 |
| TypeScript | typescript | ~5.8.3 |
| JS Engine | Hermes | default |
| Router | expo-router | ~5.1.11 |
| Backend | Firebase (Auth, Firestore, RTDB, Storage, Hosting) | ^11.2.0 |
| i18n | i18n-js | ^4.4.3 |

| Platform | Identifier |
|---|---|
| iOS Bundle ID | `com.communitycheer.gardner-harvesting` |
| Android Package | `com.communitycheer.gardner_harvesting` |
| iOS Min Deployment | 15.1 (Podfile) |
| Android Compile/Target SDK | 35 |

---

## Prerequisites

This guide assumes **macOS**. Install each tool if you don't already have it.

### Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, follow the printed instructions to add Homebrew to your `PATH`. Verify:

```bash
brew --version
```

### Node.js 18+

Option A — Homebrew:

```bash
brew install node
```

Option B — nvm (recommended if you work on multiple Node projects):

```bash
brew install nvm
# follow the shell config instructions nvm prints
nvm install 18
nvm use 18
```

Verify:

```bash
node -v   # should print v18.x or newer
npm -v    # ships with Node
```

### Watchman

Recommended by React Native for efficient file watching:

```bash
brew install watchman
```

### Xcode (iOS development)

1. Install from the [Mac App Store](https://apps.apple.com/us/app/xcode/id497799835).
2. Open Xcode once to accept the license agreement and install additional components.
3. Install Command Line Tools:

```bash
xcode-select --install
```

4. **Point `xcode-select` at the full Xcode app** (required for iOS Simulator and native builds):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

5. Verify:

```bash
xcode-select -p
# MUST print: /Applications/Xcode.app/Contents/Developer
#
# If it prints /Library/Developer/CommandLineTools instead, you have
# only the standalone CLI tools selected — iOS builds will fail.
# Re-run the sudo xcode-select -s command above after installing Xcode.app.
```

6. In Xcode → **Settings → Locations**, confirm the **Command Line Tools** dropdown is set to the installed Xcode version.

### CocoaPods

Required for iOS native dependencies. The EAS production build pins CocoaPods 1.15.2 (see [eas.json](eas.json)), but any recent version works locally.

**Recommended — install via Homebrew** (avoids Ruby version issues):

```bash
brew install cocoapods
pod --version
```

> **Why not `gem install`?** macOS ships with Ruby 2.6, which is too old for recent CocoaPods dependencies (e.g., `ffi` requires Ruby >= 3.0). Using `brew install cocoapods` sidesteps this entirely. If you prefer the gem route, first install a modern Ruby via `brew install ruby` or `rbenv`.

### Android Studio & SDK (Android development)

1. Download and install [Android Studio](https://developer.android.com/studio).
2. During setup (or via **Settings → Languages & Frameworks → Android SDK**), install:
   - **SDK Platform**: Android 15 (API 35) — matches `compileSdkVersion` / `targetSdkVersion` in [app.json](app.json).
   - **SDK Tools**: Android SDK Build-Tools, Android Emulator, Android SDK Platform-Tools.
3. Set environment variables in your shell profile (`~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

4. Restart your terminal and verify:

```bash
adb --version
emulator -list-avds
```

### Java Development Kit (JDK 17)

Android Studio bundles a JDK, but if you need a standalone install (Expo recommends JDK 17):

```bash
brew install --cask zulu17
```

Verify:

```bash
java -version   # should print 17.x
```

### EAS CLI

Expo Application Services CLI for cloud builds and submissions. Minimum version 10.0.2 (per [eas.json](eas.json)):

```bash
npm install -g eas-cli
eas --version   # should print >= 10.0.2
eas login       # log in with your Expo account
```

### Firebase CLI

Needed for web deployment to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase --version
firebase login   # authenticates with your Google account
```

### Expo CLI

No global install needed — invoked via `npx`:

```bash
npx expo --version
```

---

## Installation & Environment Setup

### Clone and install

```bash
git clone https://github.com/CommunityCHEER/gardner-harvesting.git
cd gardner-harvesting
npm install
```

### Environment variables

The native Firebase config reads credentials from environment variables. A template is provided:

```bash
cp .env.example .env
```

Open `.env` and fill in the six values:

| Variable | Where to find it |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Your apps → Web app → `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same location → `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Same location → `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same location → `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same location → `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Same location → `appId` |

**How to navigate there:**

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Select the **cheer-app-prototype** project.
3. Click the gear icon → **Project settings**.
4. Scroll to **Your apps** → select the Web app (or create one if none exists).
5. The config object contains all six values.

The native config file [firebaseConfig.ts](firebaseConfig.ts) reads these variables at runtime via `process.env.EXPO_PUBLIC_*`.

> **Note:** The web build uses a separate file, [firebaseConfig.web.ts](firebaseConfig.web.ts), which currently has its own initialization. See [Addendum](#addendum-improvements--known-issues) for details.

---

## Running Locally — iOS

### Quick start

```bash
npx expo run:ios
```

This single command:
1. Installs CocoaPods dependencies (runs `pod install` in `ios/`).
2. Compiles the native Xcode project.
3. Launches the iOS Simulator with the app.

Alternatively, use the npm script:

```bash
npm run ios
```

### Choosing a simulator

To pick a specific simulator (e.g., iPhone 16 Pro):

```bash
npx expo run:ios --device
# presents a list of available simulators and connected devices
```

### Running on a physical device

1. Open `ios/GardenerHarvesting.xcodeproj` (or the `.xcworkspace` after pod install) in Xcode.
2. In **Signing & Capabilities**, select your development team.
3. Connect your device via USB or Wi-Fi.
4. Run:

```bash
npx expo run:ios --device "Your Device Name"
```

### Debugging

| Method | How |
|---|---|
| **Expo DevTools menu** | Press `Cmd+D` in the Simulator (or shake a physical device). Opens a menu with options like "Debug Remote JS", "Toggle Inspector", etc. |
| **React DevTools** | In a separate terminal: `npx react-devtools`. The app connects automatically. Inspect component tree, props, state. |
| **Safari Web Inspector** | Safari → **Develop** menu → select your Simulator → select the JSContext. Inspect console logs, set breakpoints, profile. (Enable the Develop menu in Safari → Settings → Advanced → "Show Develop menu in menu bar".) |
| **Metro terminal** | Console logs (`console.log`, warnings, errors) appear directly in the Metro bundler terminal where you ran the command. |

### Troubleshooting

If the build fails due to stale pods or cache:

```bash
cd ios && pod install --repo-update && cd ..
npx expo run:ios
```

To do a clean build:

```bash
cd ios && xcodebuild clean && cd ..
npx expo run:ios
```

---

## Running Locally — Android

### Quick start

The `android/` directory is intentionally **gitignored** — it is generated on demand during the first build.

**Before running**, verify an emulator is running or a device is connected:

```bash
adb devices
# should list at least one device/emulator
```

If no devices are listed, launch an emulator first (see [Setting up an Android emulator](#setting-up-an-android-emulator-avd) below).

```bash
npx expo run:android
```

This single command:
1. Generates the `android/` native project (equivalent to `npx expo prebuild --platform android`).
2. Compiles the Gradle project.
3. Installs and launches the app on the connected emulator or device.

Alternatively:

```bash
npm run android
```

### Choosing an emulator or device

To pick a specific target when multiple emulators/devices are connected:

```bash
npx expo run:android --device
# presents a list of available emulators and connected devices
```

### Setting up an Android emulator (AVD)

1. Open Android Studio → **Virtual Device Manager** (or **Tools → Device Manager**).
2. Click **Create Device**.
3. Choose a device definition (e.g., Pixel 7).
4. Select a system image with **API 35** (download if needed).
5. Finish and launch the AVD.

Verify the emulator is running:

```bash
adb devices
# should list the emulator
```

### Running on a physical device

1. On the device: **Settings → About phone → tap "Build number" 7 times** to enable Developer Options.
2. In **Developer Options**, enable **USB Debugging**.
3. Connect via USB. Approve the debugging prompt on the device.
4. Verify:

```bash
adb devices
# should list your device
```

5. Run:

```bash
npx expo run:android
```

### Debugging

| Method | How |
|---|---|
| **Expo DevTools menu** | Press `Cmd+M` in the emulator (or shake a physical device). |
| **React DevTools** | Separate terminal: `npx react-devtools`. |
| **ADB logcat** | `adb logcat *:S ReactNative:V ReactNativeJS:V` — filters for React Native logs only. |
| **Flipper** | Download [Flipper](https://fbflipper.com/). Useful for network inspection, layout debugging, and database viewing. |
| **Metro terminal** | Console logs appear in the Metro bundler terminal. |

### Troubleshooting

**App built successfully but doesn't appear on the emulator:**

1. Verify the emulator is still running: `adb devices`. If it shows no devices, the emulator may have closed during the build.
2. Check that the APK was actually produced:
   ```bash
   find android -name "*.apk"
   ```
3. If the APK exists, install it manually:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. The app may not be on the home screen — swipe up to open the **app drawer** and look for **"Gardener Harvesting"**.

**Regenerate the native project from scratch:**

```bash
npx expo prebuild --clean --platform android
npx expo run:android
```

**Gradle errors persist — clear the build cache:**

```bash
cd android && ./gradlew clean && cd ..
```

---

## Running Locally — Web

### Quick start

```bash
npm run web
```

or equivalently:

```bash
npx expo start --web
```

Opens the app in your default browser at `http://localhost:8081`. Hot module replacement is enabled — changes to source files reflect immediately.

### Web-specific Firebase config

The web platform uses [firebaseConfig.web.ts](firebaseConfig.web.ts) for Firebase initialization, separate from the native [firebaseConfig.ts](firebaseConfig.ts). Be aware that changes to Firebase config may need to be reflected in both files.

### Local production preview

To build and serve the production web export locally:

```bash
npm run start:web
```

This runs `expo export --platform web` (output to `dist/`) and then serves it via `npx serve`. The `EXPO_PUBLIC_GIT_HASH` env var is injected automatically to display the commit hash in the app.

### Debugging

| Method | How |
|---|---|
| **Browser DevTools** | `Cmd+Option+I` (or F12). Full access to console, network, sources, performance, etc. |
| **React DevTools** | Install the [React DevTools browser extension](https://react.dev/learn/react-developer-tools) for Chrome or Firefox. |
| **Source maps** | Enabled in development — you can set breakpoints in your TypeScript source directly in the browser's Sources panel. |

---

## Testing

### Running tests

```bash
npm test
```

This starts [Jest](https://jestjs.io/) in **watch mode** — tests re-run automatically when files change. Press `q` to quit.

To run a specific test file:

```bash
npx jest --testPathPattern=HarvestForm
```

To run all tests once (no watch, useful for CI):

```bash
npx jest
```

### Test file locations

Tests live alongside components in `components/__tests__/`:

- `HarvestForm.test.tsx`
- `ImagePicker.test.tsx`
- `NoteModal.test.tsx`
- `PasswordInput.test.tsx`

Configuration: [jest.config.js](jest.config.js), [jest.setup.js](jest.setup.js) (mocks for AsyncStorage, vector icons).

### Linting

```bash
npm run lint
```

Uses Expo's built-in lint configuration.

### Health check

```bash
npm run expo:doctor
```

Runs `npx expo-doctor` to detect common Expo configuration issues, version mismatches, and dependency problems.

---

## Building & Deploying — iOS via EAS

### Prerequisites

- Logged into EAS CLI (`eas login`) with an Expo account that has access to this project.
- An [Apple Developer Program](https://developer.apple.com/programs/) membership (required for App Store distribution).

### Build profiles

Defined in [eas.json](eas.json):

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Development client with live reload. For testing on physical devices during development. | Internal (ad hoc) |
| `preview` | Internal testing build with OTA update channel `"preview"`. | Internal |
| `production` | App Store build. Auto-increments build number. Pins CocoaPods to 1.15.2. | Store |

### Building

```bash
# Production build (App Store)
npm run build:ios
# equivalent to: npx eas build --platform ios --profile production

# Development build
npx eas build --platform ios --profile development

# Preview build
npx eas build --platform ios --profile preview
```

On your first build, EAS will prompt you to set up credentials (certificates, provisioning profiles). It can manage these automatically — just provide your Apple Developer account credentials when asked.

The build runs in the cloud on EAS servers. Monitor progress at [expo.dev](https://expo.dev) or in the terminal.

### Submitting to App Store

```bash
npm run submit:ios
# equivalent to: npx eas submit --platform ios --latest --profile production
```

This uploads the latest production build to **App Store Connect**. The company name is configured in [eas.json](eas.json) as `"COMMUNITY HEALTH AND EMPOWERMENT THROUGH EDUCATION AND RESEARCH, INC."`.

`ITSAppUsesNonExemptEncryption` is set to `false` in [app.json](app.json), so Apple won't prompt for export compliance documentation.

### OTA updates

Push JavaScript-only changes without a new binary:

```bash
eas update --branch production --message "description of change"
```

The runtime version (currently `1.2.4` in [app.json](app.json)) must match the binary's runtime version. Bump it whenever native dependencies change.

---

## Building & Deploying — Android via EAS

### Prerequisites

- Logged into EAS CLI (`eas login`).
- For submission: [Google Play Console](https://play.google.com/console) access and a [Google Service Account](https://expo.dev/accounts/[owner]/projects/gardner-harvesting/credentials) JSON key configured in EAS for automated uploads.

### Building

```bash
# Production build (Google Play)
npm run build:android
# equivalent to: npx eas build --platform android --profile production

# Development client for side-loading
npm run devbuild
# equivalent to: npx eas build -e development -p android
```

On first build, EAS manages the Android keystore automatically. It will generate and store the keystore securely.

### Submitting to Google Play

```bash
npm run submit:android
# equivalent to: npx eas submit -p android --latest --profile production
```

Per [eas.json](eas.json), this submits to the **internal** track with **draft** release status. You must then promote the release in the Google Play Console.

### SHA fingerprint sync (critical)

After your first EAS build, you must sync the signing certificate fingerprints with Firebase:

1. Go to [expo.dev](https://expo.dev) → your project → **Credentials** → **Android** → view the **SHA-1** and **SHA-256** fingerprints.
2. Open the [Firebase Console](https://console.firebase.google.com/) → **Project Settings** → **Your apps** → **Android app** (`com.communitycheer.gardner_harvesting`).
3. Click **Add fingerprint** and paste both SHA-1 and SHA-256 values.
4. Download the updated `google-services.json` from Firebase and replace the file at the repo root.
5. Commit the updated file.

Without this step, Firebase features (especially Auth and Google sign-in) may not work correctly on Android.

### OTA updates

Same as iOS:

```bash
eas update --branch production --message "description of change"
```

---

## Building & Deploying — Web

### Local preview

```bash
npm run start:web
```

This exports the production web bundle to `dist/` and serves it locally via `npx serve` (typically at `http://localhost:3000`). The `EXPO_PUBLIC_GIT_HASH` environment variable is automatically set to the current git short hash.

### Production deploy to Firebase Hosting

```bash
npm run deploy:web
```

This:
1. Exports the web bundle to `dist/` (with `EXPO_PUBLIC_GIT_HASH` injected).
2. Deploys `dist/` to Firebase Hosting via `firebase deploy --only hosting`.

Firebase Hosting is configured in [firebase.json](firebase.json):
- Serves from the `dist/` directory.
- All routes rewrite to `/index.html` (SPA behavior).

**Requirements:**
- Firebase CLI installed and logged in (`firebase login`).
- Access to the `cheer-app-prototype` Firebase project.

### Custom domain / hosting URL

The app is served at the default Firebase Hosting URL for the project. Configure custom domains in the Firebase Console → **Hosting** → **Add custom domain**.

---

## EAS & Firebase Linkage

### Project identifiers

| Service | Identifier |
|---|---|
| EAS Project ID | `b54ebaef-028f-45f9-9380-6918d6c41315` |
| Firebase Project ID | `cheer-app-prototype` |
| EAS Updates URL | `https://u.expo.dev/b54ebaef-028f-45f9-9380-6918d6c41315` |

### Linking a new developer's EAS account

If you need to use your own EAS account instead of the original developer's:

1. In [app.json](app.json), delete the `extra.eas` node:
   ```json
   "extra": {
     "router": { "origin": false },
     "eas": { "projectId": "..." }  // ← delete this "eas" object
   }
   ```
2. Run any EAS command (e.g., `eas build --platform android --profile development`).
3. EAS CLI will prompt you to log in and select/create a project, then re-insert the `projectId`.
4. Commit the updated [app.json](app.json).

### SHA fingerprint workflow (Android)

See [Building & Deploying — Android via EAS → SHA fingerprint sync](#sha-fingerprint-sync-critical).

### Runtime version & OTA updates

The `runtimeVersion` field in [app.json](app.json) (currently `1.2.4`) links OTA updates to compatible binaries:

- **JS-only changes**: push via `eas update` without changing the runtime version.
- **Native dependency changes** (new native module, SDK upgrade, etc.): **bump the runtime version** before building a new binary, or OTA updates will fail to load on older binaries.

Update channels:
- `preview` profile builds receive updates from the `preview` channel.
- `production` profile builds receive updates from the `production` branch.

---

## Addendum: Improvements & Known Issues

Items below represent opportunities to improve security, developer experience, and code quality. Each links back to the relevant section above.

### Security

| Issue | Details | Relevant Section |
|---|---|---|
| Hardcoded web Firebase config | [firebaseConfig.web.ts](firebaseConfig.web.ts) contains hardcoded Firebase credentials instead of reading from environment variables like the native config does. Should be unified to use `EXPO_PUBLIC_*` env vars. | [Installation & Environment Setup](#installation--environment-setup) |
| Committed native Firebase configs | `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are committed to the repo with API keys and SHA certificate hashes. This is standard for Firebase mobile apps, but there is no documented key rotation procedure. | [Deploy Android](#building--deploying--android-via-eas), [Deploy iOS](#building--deploying--ios-via-eas) |
| No Firebase security rules in repo | Firestore, Realtime Database, and Storage security rules are not versioned in the repository. The actual protection level in production is unknown from the codebase alone. | [EAS & Firebase Linkage](#eas--firebase-linkage) |
| No API key restrictions documented | Firebase API keys should have application restrictions (HTTP referrers for web, package name + SHA for Android, bundle ID for iOS) configured in the Google Cloud Console. No documentation exists for current restrictions. | [Installation & Environment Setup](#installation--environment-setup) |

### Convention & Config Hygiene

| Issue | Details | Relevant Section |
|---|---|---|
| No `.nvmrc` file | The project requires Node 18+ but has no `.nvmrc` or `.node-version` file to pin the version automatically for developers using nvm/fnm. | [Prerequisites](#prerequisites) |
| Inconsistent native directory strategy | `ios/` is committed to git but `android/` is gitignored. This is a hybrid of managed and bare workflows. Consider either committing both or gitignoring both (fully managed). | [Running Android](#running-locally--android) |
| ~~iOS minimum version mismatch~~ | ~~`ios/GardenerHarvesting/Info.plist` declares `MinimumOSVersion` as 12.0, but `ios/Podfile` sets the deployment target to 15.1.~~ **Resolved** — native code regenerated via `expo prebuild --clean` for Expo 53. | [Running iOS](#running-locally--ios) |
| Contradictory Android permissions | [app.json](app.json) lists `RECORD_AUDIO` in both `blockedPermissions` and `permissions` under the `android` key. The intent is likely to block it — remove it from `permissions`. | [Deploy Android](#building--deploying--android-via-eas) |
| `web` missing from `platforms` | [app.json](app.json) `platforms` array lists only `["ios", "android"]` despite active web support and a deploy script. Add `"web"` for clarity. | [Running Web](#running-locally--web) |

### Ease of Use & Developer Experience

| Issue | Details | Relevant Section |
|---|---|---|
| No CI/CD pipeline | There are no GitHub Actions workflows. Tests, linting, and type-checking are not automated on PR or push. | [Testing](#testing) |
| Growing test coverage | Seven test files exist across `components/__tests__/` and `hooks/__tests__/`. Core flows (auth, data submission) still lack full automated coverage. | [Testing](#testing) |
| `start` script uses `--tunnel` | The default `npm start` runs `expo start --tunnel`, which routes through ngrok. This adds latency and requires a network connection. For local development, `expo start` (LAN/localhost) is sufficient. Consider renaming or adding a `start:local` script. | [Running iOS](#running-locally--ios) |
| No unified task runner | There is no `Makefile`, `Justfile`, or similar tool to document and run common multi-step workflows (e.g., "clean build iOS", "reset and reinstall"). | [Prerequisites](#prerequisites) |

### Bugs (Documented in Existing Specs)

These are known issues already documented in project specs. They are included here for visibility.

| Issue | Details | Reference |
|---|---|---|
| Web auth sessions lost on refresh | [firebaseConfig.web.ts](firebaseConfig.web.ts) uses `inMemoryPersistence`, causing auth state to be lost on every page reload. Should use `browserLocalPersistence`. | [Running Web](#running-locally--web), [quick-fixes-bundle-prd.md](docs/quick-fixes-bundle-prd.md) |
| Realtime DB overwrite (data loss) | Concurrent harvest submissions can overwrite each other because `set()` is used instead of `push()`. | [quick-fixes-bundle-prd.md](docs/quick-fixes-bundle-prd.md) |
| Non-idempotent participation writes | `addDoc` creates duplicates if a user logs participation multiple times on the same day. | [quick-fixes-bundle-prd.md](docs/quick-fixes-bundle-prd.md) |
| ~~Welcome component repeated reads~~ | ~~Missing effect dependencies cause the Welcome component to re-fetch user data from Firestore on every render.~~ **Fixed** — dependency array added. | [quick-fixes-bundle-techspec.md](docs/quick-fixes-bundle-techspec.md) |
| ~~i18n key mismatch~~ | ~~English uses `signUp` but Spanish uses `signup` — causes missing translations for Spanish users.~~ **Fixed** — both languages now use `signUp`. | [quick-fixes-bundle-techspec.md](docs/quick-fixes-bundle-techspec.md) |
| N+1 Firestore reads | Localized crop/unit names are fetched individually per item, causing excessive reads and latency. | [Architecture guide](docs/gardner-harvesting/gardner-harvesting.client-data-backend/current-architecture-guide-the-good-the-bad-and-the-ugly.md) |
