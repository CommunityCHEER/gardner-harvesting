In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of conciseness.
## Project Overview
**EMODA**: Enterprise Management and Operations Data Application - A full-stack solution for managing Procurement workflows and operational data with comprehensive user management and approval processes.


### Project Context
*   **Team:** Solo, human developer (automation and self-documentation prioritized) with an agentic coding workflow; onboarding a second developer soon.
*   **Development Principles:**
    *   **TDD is the top priority** for all code changes. BDD is a product/design concern, not enforced in codebase.
    *   **Refactoring** should be included in PRs when it improves clarity or maintainability.
    *   **Automation:** PRs introducing new automation are always welcome.
    *   **Readable, self-documenting code:** Code should be easy to follow, with clear function/variable names and adherence to the single responsibility principle.
*   **Deployment:**
    *  Codebase is hosted on Azure DevOps (repo only); no Azure DevOps CI/CD pipelines.
    *  Application is hosted on IIS (Windows, virtual directory, SSO-protected, may be public-facing).
    *  Build/package/deploy is manual or via PowerShell scripts; automation is a future goal.
*   **Security:** Internal app, but SSO is the main protection; treat as potentially public-facing.

## Environment & Shell
**Runtime**: Windows (10/11) with PowerShell (pwsh). Do NOT assume Linux/bash.
- Use PowerShell syntax for commands (e.g., `$env:ASPNETCORE_ENVIRONMENT = 'Development'`)
- Prefer cross‑platform dotnet/Yarn invocations (they already work in pwsh) and avoid bash‑only constructs.
- Avoid `export`, `source`, bash-only pipe tricks
- For chained actions prefer separate steps; if chaining, use `;` (not `&&`)
- Read env vars with `$env:VAR` (never `$VAR`)
- Avoid prescribing package installs via `apt`, `yum`, `brew`
- Use forward slashes in paths where acceptable (`EMODA.Server/EMODA.Server.csproj`)
- Don't suggest editing `~/.bashrc`
- Path separators: use / or escaped \ (avoid unescaped backslashes in JSON / markdown examples).


### Localhost Ports
- **Client (Vite dev server):** `http://localhost:51075`
- **Server HTTP:** `http://localhost:5238`
- **Server HTTPS:** `https://localhost:7023`

### Development Environment
- **Solution**: `EMODA.sln` - Multi-project Visual Studio solution
- **Startup**: Dual startup projects (API at :7023, Client at :51075)
- **Debugging**: VS Code launch configurations for both frontend and backend
  - Policy: Use Yarn Berry (PnP) only. Do not use `npm`/`pnpm`. Do not create `node_modules` or `package-lock.json`.

#### Package Manager Policy
*  Use Yarn Berry (PnP) and dlx across the workspace. Avoid npm/pnpm/npx wherever possible.
*  Do not generate node_modules or package-lock.json.

#### API URL Policy (Critical)
This application runs under different base paths in different environments:
*  Local: / (root)
*  Dev/Production: /emoda/
*  Stage: /emodastage/
**For React Router Navigation (Links, Breadcrumbs, Routes):** MUST NOT use leading slash. Always use relative paths without leading slash.
**For API Calls:** Always use `apiClient.apiRequest()` which handles base URL resolution automatically. For special cases requiring direct fetch(), use the `APP_BASE_URL` constant.
**Rationale:**
*  React Router: Leading slash resolves from server root, omitting base path segment, breaking navigation in non-local environments.
*  API calls: `apiClient` prepends correct base URL. For direct fetch(), use `APP_BASE_URL` constant.
**Enforcement:** If you see leading slashes in React Router navigation or direct fetch() without `APP_BASE_URL`, correct it and raise it as a finding.


### TDD Workflow (MANDATORY)

Before making any changes, run all existing tests to ensure a clean baseline.
All code changes MUST follow the Red-Green-Refactor cycle. **No exceptions.**

**Rule:** Tests ALWAYS come before implementation. Period.

#### TDD Workflow (MANDATORY)
All code changes MUST follow the Red-Green-Refactor cycle. **No exceptions.**
##### The Cycle
1. 🔴 **RED: Write a Failing Test First**
    *  Define expected behavior in a test
    *  Run test and **confirm it fails** (proves test is valid)
    *  Failure should indicate missing behavior, not syntax errors
2. 🟢 **GREEN: Implement Minimum Code to Pass**
    *  Write only enough code to make the test pass
    *  Avoid adding extra features or "nice-to-haves"
    *  Run test and **confirm it passes**
3. 🔵 **REFACTOR: Improve Without Breaking**
    *  Clean up implementation (extract methods, improve names, remove duplication)
    *  Run tests after each change to ensure behavior unchanged
    *  Keep tests passing throughout

**Rule:** Tests ALWAYS come before implementation. Period.

##### Process Violations
If TDD process is violated:
*  ✅ Stop immediately
*  ✅ Document violation as a finding
*  ✅ Decide: Accept as learning experience OR revert and re-implement properly
*  ✅ Never proceed silently when process is broken

#### Quality (First) Assurance
*  Before making any changes, run all existing tests to ensure a clean baseline.
*  After implementing changes, run all tests again to verify nothing is broken.
*  If any tests that were previously passing now fail, investigate and fix the root cause.

**Reference:** See `docs/20251016-tdd-workflow-guide.md` for complete workflow examples, anti-patterns, and technology-specific guidance (if available).

#### Rules (Validation Gates)
*  If ever you are attempting something based on existing documentation within the workspace, and that documentation is out of date or incorrect or if I correct you and seem to contradict our documentation, please raise this as a finding in your response.
*  If ever you find yourself apologizing or I point out something you should have done differently, let me know if it would be appropriate to modify any `.instructions.md` files or, if you have one, your `.chatmode.md` file.
* When generating markdown with code blocks, always use ``` (three backticks), never \\\ (three backslashes)
* Code review should catch markdown syntax errors in documentation

## Session & Token Management Guidelines

- Monitor the length and complexity of the conversation to estimate token usage.
- Assume a soft limit of 100,000 tokens per session to avoid hitting the model's context window.
- Every ~5,000 tokens or 10–15 messages, prompt the user with:
  - A summary of the conversation so far.
  - A suggestion to checkpoint or commit progress.
  - A reminder that starting a new session may improve clarity and performance.
- If the conversation becomes too long or confusing, recommend summarizing and starting a new context.
- When summarizing, preserve key decisions, code snippets, and unresolved questions.
