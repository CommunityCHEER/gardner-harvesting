<!-- Original Prompt: We have a new PRD. Create a new tech spec based on it. (See <attachments> above for file contents. You may not need to search or read the file again.) -->

# Quick Fixes Bundle — Technical Design Specification

Date: 2025-09-06  
Status: Draft

## Summary
Stabilize critical data paths and UX for Gardner Harvesting with a focused set of low-risk, high-value fixes. This spec translates the PRD into concrete technical decisions, contracts, and a step-by-step guide that can be implemented without altering database schemas or security rules.

In-scope fixes:
- Realtime DB: change write semantics from overwrite to append; ensure "Total today" accuracy.
- Web authentication: persist sessions across reloads (browserLocalPersistence).
- Welcome screen: stop repeated Firestore reads and avoid setState-after-unmount.
- i18n: ensure key parity between English and Spanish.

Out of scope (per PRD): security rules changes, schema migrations, CI/tests addition, major performance refactors, new features/UX redesigns.

## Goals and Success Metrics
- No lost or overwritten harvest entries under concurrency; in-app totals match Realtime data.
- Web users remain signed in after reloads.
- Welcome screen triggers no redundant reads.
- Spanish UI has full parity with English keys (no missing/mismatched keys).
 - No regressions in image uploads or sign-in flows.

## Assumptions and Clarifications
- Assumption A1: “Total today” should aggregate entries for the crop/garden/date in the required/base unit. If pounds/ounces are used, ounces are converted to pounds and summed.
- Assumption A2: Existing Realtime nodes may contain array-style historical values. Reader logic will handle both array and keyed-child formats during transition; we won’t migrate historical nodes in this bundle.
 - Assumption A3: No Firestore/Storage/Realtime rules updates in this change set; all validation is client-side only for now.
- Clarify C1: Confirm required/base unit per crop (e.g., pounds) for totals. If a crop’s required unit varies, totals remain per-crop base unit without cross-unit conversion beyond the pounds/ounces special case.
- Clarify C2: Confirm whether Welcome screen should cache user data for the app session, and when to invalidate (logout or explicit refresh only).

## Architectural Decisions (ADRs)
 - AD-1 Realtime append semantics: Use per-entry child appends at the daily path; do not overwrite a list/array. Reader computes totals by iterating children.
 - AD-2 Web auth persistence: On web, set Firebase Auth persistence to browserLocalPersistence during initialization; native keeps RN-specific persistence.
 - AD-3 Welcome effect discipline: Effects must include stable dependency arrays and unmounted guards; fire only when user exists and data isn’t already loaded.
 - AD-4 i18n parity rule: English keys define the canonical namespace. Spanish localization must provide values for every English key; missing keys fail a dev-time runtime check (warn) and fall back to English for users.
 - AD-5 Backward-compat reader: Harvest list readers must accept both legacy array-shaped nodes and new child-keyed nodes.
 - AD-6 Correlation tracing: Each submission flow propagates a correlationId across logs and payload metadata fields to aid triage; Firebase has no headers, so we embed as fields.

## Constraints
- No backend rules or schema changes; all behavior shifts are client-side.
- Preserve all existing data and flows; no destructive migrations.
- Keep UI unchanged aside from correctness and minor latency improvements.

## Interfaces and Contracts

### Realtime Harvest Path Contract
- Path shape: `harvests/{YYYY-MM-DD}/{gardenId}/{cropId}`
- Write model (new): append a child under the path.
- Child entry fields:
  - correlationId: string (UUID-like)
  - personUid: string (required)
  - measures: array of { unitPath: string, value: number } (>=1 item)
  - createdAt: ISO timestamp string (client clock)
- Reader fallback model (legacy): if the node at crop path is an array, treat each array element as if it were a child entry lacking a key; include them in totals.
- Invariants:
  - Authenticated user required (client assumption).
  - measures array contains only positive finite numbers.

### Auth Persistence Contract (Web)
- Initialization must set persistence to browserLocalPersistence before any sign-in attempts or listeners rely on persisted state.
- Success criteria: Refreshing the browser preserves the authenticated user, and auth state listeners fire with the current user without requiring user interaction.

### Welcome Screen Data Fetch Contract
- Triggers fetch only when:
  - user is authenticated, and
  - relevant user/garden data isn’t already present in context/cache.
- Must include:
  - dependency arrays for effects,
  - cancel/ignore pattern on unmount to avoid setState-after-unmount.

### i18n Parity Contract
- Canonical namespace: English (`en`).
- Spanish (`es`) must include every key present in English with a non-empty string value.
- Dev-time runtime check: during development builds, warn once per missing key with the key path; production falls back silently to English.

## Provider/Middleware Ordering (App Shell)
- ErrorBoundary (outermost)
- Log/Telemetry Provider (sets correlationId context and sinks logs)
- i18n Provider
- Firebase Provider (initializes auth, sets persistence on web, exposes clients)
- App Router (Expo Router tabs)

Rationale: ensure logging and error handling wrap all child providers; i18n is needed before rendering UI; Firebase depends on platform detection for persistence.

## Logging Schema and Fields
- Common fields (all events):
  - eventName: string
  - correlationId: string
  - timestamp: ISO string
  - userUid: string | null
  - platform: `ios|android|web`
  - screen: string (e.g., `Harvest`, `Welcome`)
  - outcome: `success|failure|skipped`
  - errorCode: string | null
  - errorDetail: string | null
  - durationMs: number | null

- Events:
  - harvest_submit_attempt/success/failure
    - gardenId, cropId, date, measuresCount, firestoreHarvestId (on success), realtimeChildKey (on success)
  - auth_persistence_set
    - persistence: `browserLocal|native`
  - welcome_fetch_skipped
    - reason: `no-user|already-loaded`

Sinks: console in dev; no remote telemetry in this bundle. Ensure PII minimization (no emails, names).

## Error Model (ProblemDetails-inspired)
- Shape for internal handling/logging:
  - type: URI or string enum (e.g., `about:blank`, `com.app.harvest.writeFailed`)
  - title: short summary
  - detail: description suitable for logs
  - status: optional numeric (map to UI severity)
  - instance: optional correlationId or context id
  - code: optional machine code from SDK
  - cause: optional nested error info

Mapping examples:
- Realtime write failure → `type=com.app.harvest.writeFailed`, include SDK error code.

## Header Conventions and Correlation IDs
- HTTP headers are not applicable for Firebase SDK calls. We standardize on an application-level `correlationId` propagated through:
  - log events
  - Realtime child entry metadata
  - Firestore harvest document metadata (if available from existing implementation)
- If any REST calls are added later, use `X-Correlation-ID: <correlationId>`.

## Step-by-Step Implementation Guide

1) Realtime DB: Append, don’t overwrite
- Replace overwrite of arrays with per-entry child appends at `harvests/{date}/{gardenId}/{cropId}`.
- Ensure the listener that computes “Total today” iterates child entries; if node is an array (legacy), coerce to entries in-memory.
- Convert pounds/ounces to base unit for totals; sum across all child entries.
- Emit `harvest_submit_*` logs with correlationId and durations.

2) Web auth persistence
- During Firebase initialization on web, set auth persistence to browserLocalPersistence before creating listeners/contexts relying on it.
- Verify sign-in survives reloads; log `auth_persistence_set`.

3) Welcome screen effect discipline
- Add proper dependency arrays to effects; fetch only when user exists and data not loaded.
- Add unmount guard pattern to avoid state updates after unmount.
- Emit `welcome_fetch_skipped` when short-circuiting.

4) i18n key parity
- Compare English and Spanish namespaces at startup (dev only) and warn for missing keys.
- Add any currently missing Spanish keys (e.g., `signUp`), aligning casing.
- Ensure user-visible text falls back to English where necessary; avoid rendering raw keys.

## Acceptance Criteria to Implementation Mapping
- Atomic append in Realtime DB → implemented via per-entry child writes and reader update; verified by concurrency test.
- "Total today" accuracy → updated aggregation logic over children.
- Web session persistence → browserLocalPersistence set and validated.
- Welcome screen single-fetch → dependency arrays and unmount guard; logs confirm behavior.
- i18n parity → added keys and dev warnings; manual audit confirms parity.

## Test Matrix

Unit Tests (suggested)
- Date helper: `YYYY-MM-DD` formatter.
- Totals aggregation: given child entries with pounds/ounces, converted totals match expected base-unit sum; legacy array node is handled.
- i18n parity checker: returns missing keys for a fabricated mismatch; none for aligned maps.
- Welcome effect helper: predicate returns false when data cached or user absent.

Integration/Manual Tests
- Concurrency test (two clients) per PRD Addendum: both entries appear; total increments by two; no overwrite.
- Web auth persistence: sign in on web, reload, user remains signed in; listeners fire with user.
- Welcome screen behavior: profile/garden fetched once; subsequent navigations don’t re-fetch; no warnings about setState-after-unmount.
- i18n parity: switch to Spanish locale and navigate all affected screens; no English fallbacks observed; logs show zero missing keys in dev.

Exit Criteria
- All unit checks above pass locally (if implemented).
- Manual tests confirm acceptance criteria; no new errors in console.

## Risks and Mitigations
- Mixed Realtime node shapes (array vs children): reader must support both until legacy nodes are naturally superseded; include telemetry to quantify presence of legacy arrays.
- Hidden dependencies on array shape: audit any other consumers of the Realtime path and adapt them; keep change confined to harvest submission and total computation.
- Auth persistence side effects on native: ensure platform gating so native behavior is unchanged.

## Security and Privacy
- No expansion of data collected; avoid logging PII (names/emails). Prefer ids.
- Client-side validation only; rules remain unchanged (documented in architecture guide for later hardening).
- Correlation IDs are random, non-identifying.

## Performance and Observability
- Append semantics reduce large-list rewrites; expect lower bandwidth usage under concurrency.
- Welcome effect discipline reduces redundant reads and improves perceived latency.
- Lightweight console logging with correlationId for targeted troubleshooting.

## Impacted Files (reference)
- Firebase init: `firebaseConfig.ts`
- App context: `context.ts`
- Harvest submission and total computation: `components/HarvestForm.tsx`
- Welcome screen/effect: `components/Welcome.tsx`
- i18n resources: `i18n.ts`
- Date helpers: `utility/functions.ts`

## Rollout and Backout
- Single release bundle behind a soft feature toggle (config flag) is optional; if issues arise, revert the bundle in VCS.
- No data migrations; rollback is safe.

## Implementation Checklist
- Realtime: child-append writes; child-iteration totals; legacy array compatibility.
- Auth: set browserLocal persistence on web; verify order of initialization.
- Welcome: dependencies and unmount guard; skip logic.
- i18n: ensure Spanish parity; add dev warnings for missing keys.
- Logging: emit standardized events with correlationId.
- Manual test pass and short release notes update.

## Open Questions
- C1: Confirm base unit and conversion rules per crop for totals.
- C2: Confirm desired cache invalidation policy for Welcome screen data.

## Appendix: References
- PRD: `docs/quick-fixes-bundle-prd.md`
- Current architecture report: `docs/gardner-harvesting/gardner-harvesting.client-data-backend/current-architecture-guide-the-good-the-bad-and-the-ugly.md`

---

I can review the implementation PRs for conformance to this spec and update ADRs if decisions evolve during development.
