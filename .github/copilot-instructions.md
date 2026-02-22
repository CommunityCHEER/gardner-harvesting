In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of conciseness.
## Project Overview


### Project Context
*   **Team:** Solo, human developer (automation and self-documentation prioritized) with an agentic coding workflow
*   **Development Principles:**
    *   **TDD is the top priority** for all code changes. BDD is a product/design concern, not enforced in codebase.
    *   **Refactoring** should be included in PRs when it improves clarity or maintainability.
    *   **Automation:** PRs introducing new automation are always welcome.
    *   **Readable, self-documenting code:** Code should be easy to follow, with clear function/variable names and adherence to the single responsibility principle.
*   **Deployment:**
    *  Codebase is hosted on GitHub.

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
