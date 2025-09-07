<!-- Original Prompt: Create a report on this project so we can stabilize it, harden it and make it easier to maintain and extend for years to come. Then: I might have you generate some of that but, first, create the report and add it to a new docs folder at the workspace root. Isn't that in your chatmode.md? -->

# Gardner Harvesting — Current Architecture Guide: the Good, the Bad, and the Ugly

Date: 2025-09-06

## Scope
- App type: Expo (React Native) with Expo Router
- Platforms: Android, iOS, Web
- Backend: Firebase (Auth, Firestore, Realtime Database, Storage)
- Repo: `gardner-harvesting`

## High-level Architecture
- UI built with Expo Router tabs: `Harvest`, `Participation`, `User`.
- Contexts provide Firebase clients and participation flag across the app (`context.ts`).
- Data stores:
  - Firestore: authoritative harvest documents, measures, people, gardens, crops, units.
  - Realtime Database: per-day/garden/crop stream of harvest entries for quick aggregation.
  - Storage: optional harvest images.
- Authentication: Firebase Email/Password; React Native persistence for native, in-memory for web.

### Diagram (logical)
- App (Expo RN)
  - Firebase Context → Auth, Firestore, Storage, Realtime
  - Tabs
    - Index: select garden, start harvesting, log participation
    - Participation: calendar, log participation
    - User: signup/login/manage profile
- Firestore
  - people/{uid}
    - participation/{date}
  - gardens/{gardenId}
  - crops/{cropId}
    - units/{required|optional} -> DocumentReference to cropUnits/{unitId}
  - cropUnits/{unitId}
  - harvests/{harvestId}
    - measures/{autoId}
- Realtime DB
  - harvests/{YYYY-MM-DD}/{gardenId}/{cropId}/{autoId} -> { person, measures[] }
- Storage
  - harvests/{harvestId} (image)

## Data Model (observed)
- User: { firstName, lastName, role, admin, gardener, developer }
- Garden: { streetName, houseNumber, nickname }
- Crop: { ezID, name[locale].value, units[id].value }
- Unit: { abbreviation, fractional, ezID }
- Harvest: { date, person(ref), garden(ref), crop(ref) }
- HarvestMeasure: { unit(ref), measure:number }
- RealtimeHarvest: { person:uid, measures: [ { unit:path, measure } ] }
- Date format: `YYYY-MM-DD` via `getDateString()`

## Data Flow (key paths)
- Harvest submission (`components/HarvestForm.tsx`)
  1) User selects garden and crop
  2) Fetch crop units; required + optional
  3) Enter measures (pounds with optional ounces special UI)
  4) Realtime DB: set([...existing]) list at `harvests/date/garden/crop`
  5) Firestore: add harvest doc, then add measures subcollection
  6) Optional: upload image to Storage
  7) If needed: log participation for today
- Participation logging (multiple places)
  - `addDoc` under `people/{uid}/participation` with shape { date, garden:ref }
- Index screen
  - Reads custom claims, lists gardens, controls harvesting state
- User screen
  - Email/password sign-up, sign-in, password reset
  - Creates `people/{uid}` on first login

## Strengths (the Good)
- Clear separation between authoritative Firestore data and per-day realtime aggregation.
- Minimal and readable components with single-purpose screens.
- i18n wired with fallback; Spanish coverage for most keys.
- Form UX handles pounds/ounces split with controlled inputs.
- Realtime “Total today” is computed from live DB feed.

## Risks and Issues (the Bad/Ugly)
- Realtime list overwrite: `set([...existing])` can clobber writes under contention.
- Duplicate participation: `addDoc` creates multiple entries per day per user.
- Web auth persistence uses in-memory persistence → sessions reset on refresh.
- N+1 Firestore reads for crop names and units per locale; inefficient and latency-prone.
- Welcome effect runs on every render (no deps) → repeated Firestore read and potential setState after unmount.
- Total today sums only first measure (assumes one primary unit) → misleading if optional units are filled.
- Image uploads lack metadata/contentType validation.
- No Firestore/Realtime/Storage security rules in repo; unknown protection level.
- Secrets/config are committed (expected for native configs, but TS web config is in source) and API key restrictions unknown.
- Tests and CI absent; `jest` configured but no tests.

## Security Posture
- Auth-only access implied in code, but rules not versioned.
- Participation should be idempotent and enforce per-user-per-date uniqueness in rules.
- Realtime path should require authenticated writes and validate measure structure and unit ids.
- Storage should restrict writes and require valid content types (image/jpeg|png) and size limits.

## Performance Notes
- Garden and crop lists pulled fully on every view; cache per session or denormalize.
- Locale-specific names fetched individually; prefer localized fields on parent doc or preload.
- useList on realtime path is appropriate, but current write strategy increases race risk and bandwidth.

## Maintainability Observations
- Types are present but Firestore reads cast via `as`; add Firestore converters for safety.
- Contexts are simple and adequate; consider provider to manage auth persistence setup.
- Mixed naming (translate vs t) and some magic strings; centralize constants.
- i18n key mismatch: en has `signUp`, es only `signup`.

## Step-by-step Hardening Plan
1) Fix realtime append and total computation
   - Replace `set([...existing])` with `push` to append atomically.
   - Update total calculation to sum all measures for the required unit or clearly label as “primary unit only”.

2) Make participation writes idempotent
   - Use `setDoc(doc(people/{uid}/participation/{YYYY-MM-DD}))`.
   - Add Firestore rule to only allow write to that doc id and prevent duplicates.

3) Improve auth persistence on web
   - Use `browserLocalPersistence` via `setPersistence(auth, browserLocalPersistence)` on web.

4) Reduce N+1 reads for localized names
   - Option A: store localized fields on crop and unit docs: `name: { en, es }`.
   - Option B: add an in-app cache per locale; fetch once and reuse.

5) Version and harden Firebase rules
   - Add local `firestore.rules`, `database.rules.json`, `storage.rules` with CI deploy.
   - Enforce auth, data validation, and per-user constraints.

6) Add minimal tests and CI
   - Jest tests: date helper, pounds/ounces parser/combiner, participation doc-id function.
   - GitHub Actions: install, typecheck, lint, test on PR; optional web export smoke on main.

7) Configuration hygiene
   - Move web config into runtime env (Expo app.config) and restrict API keys by domain/package.
   - Document EAS/FB linkage and required SHA fingerprints.

8) Type safety and a11y polish
   - Add Firestore DataConverters; remove `as` casts.
   - Ensure `Button` exposes accessibility props.

## Firestore/Realtime Rules Sketch (reference)
- Firestore (people/participation):
  - allow write: if request.auth.uid == resource.path.segments[1] && resource.id matches YYYY-MM-DD
  - validate date pattern and garden reference.
- Realtime (`harvests`):
  - allow write: auth != null; validate per-entry schema; limit total nodes per day per path.
- Storage:
  - allow write: auth != null && path == `harvests/{harvestId}` && contentType in [image/jpeg, image/png] && size <= 5MB.

## Concrete Code Changes (diff summaries)
- HarvestForm: use `push()` for realtime, not `set([...])`.
- Participation (3 places): `setDoc(.../{date})` instead of `addDoc`.
- Welcome: add effect dependency array and guard on missing user.
- i18n: add `signUp` to Spanish keys.
- firebaseConfig (web): replace `inMemoryPersistence` with `browserLocalPersistence`.

Example snippet (Participation idempotency):
- Before:
  `addDoc(collection(db, 'people', uid, 'participation'), { date, garden })`
- After:
  `setDoc(doc(db, 'people', uid, 'participation', date), { date, garden })`

Example snippet (Realtime append):
- Before:
  `set(ref(db, path), [newEntry, ...existing])`
- After:
  `await push(ref(db, path), newEntry)`

## Backlog (prioritized)
1) Quick fixes bundle — realtime append + total, participation idempotency, web auth persistence, Welcome effect, i18n key parity
  - Quick fix: Yes
  - References: Risks and Issues → “Realtime list overwrite”, “Duplicate participation”, “Web auth persistence…”, “Welcome effect runs on every render”, “i18n key mismatch”; Step-by-step Hardening Plan → items 1, 2, 3; Concrete Code Changes → all bullets in that section.

2) Security rules versioning and CI deploy
  - Quick fix: No (medium effort)
  - References: Security Posture; Step-by-step Hardening Plan → item 5; Firestore/Realtime Rules Sketch.

3) Data fetch optimization for localized names/units (remove N+1 reads)
  - Quick fix: No (requires small schema or client caching change)
  - References: Performance Notes → “Locale-specific names fetched individually”; Step-by-step Hardening Plan → item 4; Data Model (observed) → Crop/Unit structure.

4) Tests + GitHub Actions workflow
  - Quick fix: No (small but foundational)
  - References: Step-by-step Hardening Plan → item 6; package.json → jest preset; Maintainability Observations.

5) Configuration hardening and secrets hygiene
  - Quick fix: No (medium; needs Expo config + Firebase console settings)
  - References: Security Posture; Step-by-step Hardening Plan → item 7; firebaseConfig.ts; README notes on EAS/Firebase linkage.

6) Type safety (Firestore DataConverters) + accessibility polish
  - Quick fix: No (incremental refactor)
  - References: Maintainability Observations → casts and Button a11y; Step-by-step Hardening Plan → item 8.

7) Image upload validation (content type, size) + stricter Storage rules
  - Quick fix: No (small code + rules changes)
  - References: Risks and Issues → “Image uploads lack metadata/contentType validation”; Security Posture; Firestore/Realtime Rules Sketch → Storage guidance; `components/HarvestForm.tsx` upload path.

8) i18n parity check script and process
  - Quick fix: Yes
  - References: Maintainability Observations → i18n key mismatch; `i18n.ts`; Concrete Code Changes → “i18n: add signUp to Spanish keys”.

## Appendix: Key Files and Responsibilities
- `firebaseConfig.ts`: Firebase initialization and persistence
- `context.ts`: Firebase and participation contexts
- `components/HarvestForm.tsx`: crop/unit loading, submit flow, realtime writes
- `components/MeasureInput.tsx`: numeric input + pounds/ounces UX
- `app/(tabs)/index.tsx`: garden selection, harvesting flow, claims
- `app/(tabs)/participation.tsx`: participation calendar and logging
- `app/(tabs)/user.tsx`: authentication and profile
- `i18n.ts`: translations and context
- `types/firestore.ts`: data contracts
- `utility/functions.ts`: date helpers

## Known Gaps / Assumptions
- Assumed Firebase rules exist but are not versioned here.
- Assumed crops and units collections contain locale sub-docs; suggested denormalization will require a migration.
- No Sentry or analytics configured; consider adding later.
