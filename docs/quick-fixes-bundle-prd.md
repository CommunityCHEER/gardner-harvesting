<!-- PRD for Backlog Item 1: Quick fixes bundle — see 'current-architecture-guide-the-good-the-bad-and-the-ugly.md' for full context. -->

# Quick Fixes Bundle — Product Requirement Document (PRD)

## Feature Summary
Implement a bundle of high-impact, low-effort fixes to stabilize the Gardner Harvesting app, reduce data loss, and improve user experience. This includes:
- Realtime DB writes: switch from overwrite to append
- Participation logging: make writes idempotent (one per user per day)
- Web authentication: persist sessions across reloads
- Welcome screen: prevent repeated Firestore reads
- i18n: ensure key parity between English and Spanish

## User Stories

### 1. As a user, I want my harvest submissions to be reliably recorded, even if multiple users submit at the same time, so that no data is lost.
- Acceptance Criteria:
  - Harvest entries are appended atomically in Realtime DB (no overwrites).
  - "Total today" reflects all entries for the selected crop/garden/date.
  - No duplicate or missing entries after concurrent submissions.

### 2. As a web user, I want to stay signed in after refreshing the page, so I don’t have to log in repeatedly.
- Acceptance Criteria:
  - Web authentication uses persistent storage (browserLocalPersistence).
  - Session survives browser reloads.

### 3. As a user, I want the Welcome screen to load quickly and not trigger repeated database reads, so the app feels responsive.
- Acceptance Criteria:
  - Welcome screen only fetches user data when needed (not on every render).
  - No unnecessary Firestore reads or setState after unmount.

### 4. As a Spanish-speaking user, I want all UI elements to be translated consistently, so I can use the app in my language.
- Acceptance Criteria:
  - All keys present in English are present in Spanish.
  - No missing or mismatched translation keys (e.g., signUp/signup).

## Notes & Constraints
- See report sections: Risks and Issues (realtime overwrite, web auth, Welcome effect, i18n), Step-by-step Hardening Plan (items 1, 2), Concrete Code Changes.
- No changes to database schema, security rules, or CI in this bundle.
- No new features or UI redesigns; only stabilization and bug fixes.
- Must not break existing data or workflows.

## Deliverables
- Updated source code for:
  - Realtime DB write logic (append, not overwrite)
  - Web auth persistence setup
  - Welcome screen effect dependencies
  - i18n translation keys
- Documentation update summarizing changes

## Out of Scope
- Firebase security rules changes
- Data model/schema migrations
- Automated tests or CI setup
- Performance optimizations beyond those listed
- New features or UI/UX redesigns

## Success Metrics
- No lost or duplicate harvest records in manual and automated tests
- Web users remain signed in after reload
- Welcome screen loads without redundant reads
- Spanish UI matches English for all keys
- No new errors or regressions in affected areas

---

Refer to 'current-architecture-guide-the-good-the-bad-and-the-ugly.md' for technical context and code references.

## Addendum: Concurrency Repro and Verification (Before/After)

Purpose: Provide a shared, repeatable test plan to demonstrate the current data-loss issue under concurrent harvest submissions and to verify the fix.

Context (why this occurs)
- Current behavior constructs a new array `[newEntry, ...harvestsDataSnapshot]` and writes it with `set()` to a shared Realtime DB path.
- Two clients read the same snapshot, each prepends their entry, and both call `set()`. The later write overwrites the earlier one (lost update). Duplicates are not the common failure; missed entries are.

Preconditions
- Two clients (two browsers or devices) logged in with permission to submit harvests.
- Both select the same garden and crop for the same date.

Before Fix: Repro Steps and Expected Result (demonstrates the bug)
1) On both clients, enter a required measure (e.g., 1.0) so Submit is enabled.
2) Press Submit on client A and client B within ~1 second of each other.
3) Observe in-app “Total today”: only increments by one submission, not two.
4) Inspect Realtime DB at `harvests/YYYY-MM-DD/{gardenId}/{cropId}`: only one new child (array overwrite). The other is missing.
5) Inspect Firestore `harvests` collection: likely two new docs exist (one per client), showing divergence between Firestore and Realtime DB.

After Fix: Verification Steps and Expected Result (confirms resolution)
Implementation intent (for reference): use append semantics (e.g., per-entry child push) rather than overwriting the collection, and compute totals by summing children at the path.
1) Repeat the two-client concurrent submission.
2) In-app “Total today” increases by two (both submissions counted).
3) Realtime DB shows two distinct children under `harvests/YYYY-MM-DD/{gardenId}/{cropId}` (no overwritten array).
4) Firestore `harvests` shows two new docs; Realtime DB count matches Firestore count for that crop/garden/date.
5) Refresh both clients; totals remain consistent.

Negative/Edge Checks
- Submitting again from one client adds exactly one additional child and increments total accordingly.
- Network blip retry does not create duplicates (each press yields one entry).

Reviewer Checklist
- Reproduced the bug with pre-fix code (lost update evident in RTDB and UI total).
- Verified the fix removes the overwrite (two children present for concurrent submissions).
- Verified parity between Realtime DB totals and Firestore entry count for the tested crop/garden/date.
- Verified no regressions in image upload and participation logging flows.
