**Key Risk Closed First**
1. Deployment target mismatch identified and resolved in plan:
1. Admin backend repo default project is currently cheer-harvest-reporting.
2. New runbook requires explicit deploy targeting cheer-app-prototype on every deployment command and active project selection before deploy.

**Detailed Runbook (Execution Order)**

**Phase A: Preflight**
1. Confirm two repos are available locally:
1. Mobile app repo.
2. Admin backend repo.
2. In deployment shell, force project selection to cheer-app-prototype.
3. Do not rely on default Firebase project from config.
4. Confirm Node 22 active for functions runtime.
5. Capture checkpoint:
1. Current git status in backend repo.
2. Current deployed functions list/logs snapshot.

**Phase B: Backend API Contract**
1. Callable endpoint 1: getParticipationRoster.
2. Request shape: date only.
3. Response shape per user:
1. uid
2. email
3. firstName
4. lastName
5. roles from custom claims
6. hasParticipation for that date.
4. Callable endpoint 2: toggleParticipationForUser.
5. Request shape:
1. target uid
2. date
3. gardenId.
6. Response shape:
1. uid
2. date
3. hasParticipation after toggle.
7. Server validation on both endpoints:
1. Caller authenticated.
2. Caller has admin claim.
3. Date is not future.
4. Required fields present.

**Phase C: Backend Implementation**
1. Implement both callables in the existing Firebase Functions TypeScript project.
2. Add shared server validators:
1. strict YYYY-MM-DD parser.
2. no-future-date assertion.
3. admin-caller assertion.
3. For roster:
1. Use Admin SDK Auth user listing with pagination.
2. Read custom claims admin, gardener, developer from Auth records.
3. Merge people-doc names as display metadata only.
4. For participation toggle:
1. Deterministic doc path by date.
2. If exists, delete and return false.
3. If missing, set and return true.
5. Add structured logging for deny and validation paths.

**Phase D: Backend Tests**
1. Admin allowed, non-admin denied.
2. Unauthenticated denied.
3. Future date rejected.
4. Toggle on then off returns expected state.
5. Role mapping reflects Auth claims, not people role fields.

**Phase E: Deploy**
1. Authenticate tooling:
1. Google ADC.
2. Firebase CLI.
2. Set active Firebase project to cheer-app-prototype.
3. Run functions lint and build.
4. Deploy functions with explicit project flag.
5. Record:
1. function names
2. region
3. deployment time
4. log links.

**Phase F: Smoke Test in Target Project**
1. Admin account:
1. roster call succeeds.
2. toggle today succeeds.
3. toggle persists on reread.
2. Non-admin account:
1. both endpoints denied.
3. Future date:
1. denied by backend for both endpoints.

**Phase G: Mobile Integration (Only After Backend Pass)**
1. Keep admin gating from current user token claim only.
2. Add admin modal in Participation tab app/(tabs)/participation.tsx/participation.tsx).
3. Replace people-role filtering with callable roster response.
4. Wire tap-to-toggle to backend callable.
5. Keep regular user flow unchanged.
6. Add localization strings in i18n.ts.
7. Add typed payloads in firestore.ts if needed.
8. Keep existing self-participation and harvest behavior stable.

**Phase H: Rollback**
1. Backend regression:
1. redeploy prior known-good backend commit.
2. keep explicit project targeting.
2. Mobile regression:
1. hide admin modal entrypoint behind temporary flag.
2. ship mobile hotfix without touching backend if needed.
3. Security issue:
1. disable admin UI access path immediately.
2. patch backend authorization first, then re-enable UI.

**Verification Checklist**
1. Backend deploy hit correct project cheer-app-prototype.
2. Endpoint denies non-admin and unauthenticated callers.
3. Endpoint denies future dates.
4. Roster roles match Auth claims after claim update.
5. Admin toggles persist across app restart and reread.
