## Chatmodes Index & Governance (Draft)

Purpose: Provide a single discovery & governance hub for role chatmodes without duplicating their embedded instructions.

### Existing Chatmodes
| Role | File | Primary Focus | Notes |
|------|------|---------------|-------|
| Architect | Architect.chatmode.md | Translate PRDs → tech specs | Mirrors architectural standards |
| Product Manager | ProductManager.chatmode.md | PRDs & acceptance criteria | References existing PRD templates |
| Systems Analyst | SystemsAnalyst.chatmode.md | Codebase analysis & improvement guidance | Flags anti-patterns |
| Problem Solver (Engineer) | ProblemSolver.chatmode.md | Issue triage & fixes | Emphasizes using tasks |
| Reviewer | Reviewer.chatmode.md | Code/spec review lens | Add future rubric |
| Tech Spec Reviewer | TechSpecReviewer.chatmode.md | Deep critique & risk mapping | Uses search + usages |

### Shared Conventions (Do Not Repeat Per File)
| Area | Convention | Source |
|------|-----------|--------|
| Package Mgmt | Yarn Berry PnP only | package-manager-policy.md |
| Backend Build | Use `dotnet` CLI, no MSBuild exe | Various techspecs |
| styling | Tailwind utilities unprefixed (as of 2025-10-13; prefix removed due to v4 incompatibility) | incremental-tailwind-adoption-techspec.md, 20251013_tailwind-prefix-removal-incident.md |
| Error Model | ProblemDetails normalized | implement-proper-error-handling-techspec.md |
| Secrets | No hard-coded connection strings | eliminate-hard-coded-connection-strings-techspec.md |
| Type Safety | Progressive enhancement, type guards over `any` assertions, 10% warning reduction per sprint | type-safety-improvements-autocomplete-grid-techspec.md |
| Quality Gates | Use VS Code tasks (`client: lint typed (warn/enforce)`), validate critical tasks exist | environment-contract.json + workflow-matrix.md |

### Planned Additions
- Shared snippet library (common logging fields, correlation example)
- Automated validation: ensure each chatmode file includes description/tools/model keys.
- Lint step: detect drift vs environment-contract.json (tool list mismatches).
- Style audit automation (referenced in workflow-matrix.md answers)
- Accessibility gate integration (Cypress visual regression in Extended gate)
- Security scan task integration (when scripts exist)

### Governance Flow
1. Propose change (small: PR directly; large: add ADR stub).
2. Update relevant techspec BEFORE broad code change.
3. Regenerate environment-contract snapshot if tasks/tools impacted.

### Open Questions
| Question | Notes | Answer |
|----------|-------|--------|
| Should we add a Meta Orchestrator mode? | Could route tasks to role modes dynamically | Yes, it could improve task management |
| How to version chatmode behavior changes? | Consider semantic chatmode versioning | Use semantic versioning guidelines |

### Versioning Policy (Adopted)
Semantic versioning per chatmode file:
| Level | Triggers | Examples |
|-------|----------|----------|
| MAJOR | Breaking change to role scope/tool removal/contract shift | Remove a tool; change persona purpose |
| MINOR | Backwards-compatible capability addition | Add tool, new guidance section |
| PATCH | Non-behavioral edits | Typos, formatting, link fix |

Each chatmode frontmatter now includes `version`. Update version consistent with changes. For MAJOR changes append `!` in commit message (e.g., `chatmode(Architect)!: drop obsolete task`).

### Meta Orchestrator (Heuristic Selector)
Added `MetaOrchestrator.chatmode.md` implementing non-invasive routing. It never edits code—only normalizes intent and suggests the correct role + improved prompt.

### Type Safety Strategy Governance (Adopted)
Formal approach to managing TypeScript warning reduction and type safety improvements:

**Warning Count Targets:**
- **Baseline**: Current count as starting point (320 warnings as of 2025-09-12)
- **Target**: 10% reduction per iteration minimum
- **Threshold**: >10 new warnings in a PR = blocking review required
- **Goal**: <100 total warnings across typed scope

**Progression Path:**
- Iteration-by-iteration reduction targets tracked in metrics
- Focus on highest-impact components first (Grid, Autocomplete patterns)
- Use type guard patterns over `any` assertions
- Document patterns in techspecs for reuse

**Warning Treatment:**
- **Blocking**: New `no-unsafe-*` violations in focused components
- **Advisory**: Existing warnings in legacy areas
- **Tracked**: All warnings count toward sprint reduction goals
- **Escalation**: Sustained increases trigger architectural review

### Task Label Standardization (Adopted)
Formal naming conventions and validation requirements for VS Code tasks referenced by chatmodes:

**Naming Convention:**
- **Lint Tasks**: `client: lint` (standard), `client: lint typed (warn)` (type-aware warnings), `client: lint typed (enforce)` (type-aware blocking)
- **Test Tasks**: `[scope]: test baseline` for one-off runs, `[scope]: test watch` for background
- **Build Tasks**: `build-[scope]` with optional variants like `build-client: PRODUCTION`
- **Dev Tasks**: `[scope]: dev` for development servers, `[scope]: run (no watch)` for production-like

**Expected Task Patterns:**
- All scopes must provide: baseline test, baseline build, lint (if applicable)
- Frontend scopes must provide: dev server, type-check, production build variant
- Backend scopes must provide: watch run variant for debugging
- Quality tasks must align with environment-contract.json gate definitions

**Validation Requirements:**
- Critical tasks listed in environment-contract.json must exist before chatmode usage
- Task labels must remain stable (updates require contract regeneration)
- New task patterns require documentation update before broad chatmode reference


### Architectural Decision Lifecycle (Adopted)
Standardize when we author tech specs, how patterns graduate to conventions, and how decisions are reviewed.

**When to Create/Update Tech Specs:**
- Create a tech spec before starting any non‑trivial feature, cross‑cutting refactor, or pattern adoption that affects multiple files or behaviors.
- Update the relevant tech spec when implementation deviates materially from the plan or when experiments yield new guidance.
- For small, localized fixes, a brief PR “Implementation Notes” section is sufficient; graduate to a tech spec if the pattern repeats across areas.

**Graduation Criteria (Experiment → Shared Convention):**
- Used successfully in at least two distinct features/areas (or one feature plus a shared component).
- Demonstrated benefit with a measurable signal (e.g., lint/type warning reduction, performance, bundle size, accessibility, security posture).
- No regressions in tests/metrics over the subsequent iteration after adoption.
- Includes a concise “how‑to” snippet and migration guidance where applicable.
- Reviewed and approved by the Architect role; Systems Analyst flags risks; Reviewer confirms code implications; PM consulted for user‑visible impact.

**Decision Review Process:**
- Open a lightweight ADR stub (docs/adr/YYYY‑MM‑DD‑short‑title.md) capturing context, options, decision, and trade‑offs.
- Link related PRs to the ADR and the relevant tech spec(s).
- If tasks/tools change, update `docs/environment-contract.json` and `.github/workflow-matrix.md` in the same PR.
- Version chatmodes and tech specs per the semantic policy below; mark MAJOR changes with `!` in commit messages.

**Fast‑Track Path (Operational Incidents Only):**
- For urgent fixes with limited blast radius, allow merge only if the developer explicitly confirms urgency/scope in the PR and includes a minimal ADR/tech spec (stub) in the same PR (documentation is the threshold, not time).
- Add label `needs-adr` if the stub is intentionally minimal; CI may warn (non‑blocking) to expand it later, but absence of a stub blocks merge.

**Automation Hooks (Planned):**
- CI check that PRs with label `architecture` reference a tech spec or ADR link (required for merge once enabled).
- Lint step that flags drift between referenced tasks/tools and `environment-contract.json` (warning initially; can become blocking later).


Change Log:
| Date | Change | Author |
|------|--------|--------|
| 2025-09-10 | Initial index draft | AI (Architect) |
| 2025-09-12 | Added answers to open questions | Droddy |
| 2025-09-12 | Added type safety conventions, updated planned additions with workflow matrix insights | AI (Architect) |
| 2025-09-12 | Updated thresholds to iteration-based and set >10 new warnings per PR as blocking; fast‑track made documentation‑based | AI (Architect) |
