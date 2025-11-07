applyTo: "**/*test*.{cs,tsx,ts,js,jsx,md,mdx}"
description: "Mandatory TDD and Quality Assurance Workflow Guidance"

## TDD Workflow (MANDATORY)

All code changes MUST follow the Red-Green-Refactor cycle. **No exceptions.**

### The Cycle

1. 🔴 **RED: Write a Failing Test First**
   - Define expected behavior in a test
   - Run test and **confirm it fails** (proves test is valid)
   - Failure should indicate missing behavior, not syntax errors

2. 🟢 **GREEN: Implement Minimum Code to Pass**
   - Write only enough code to make the test pass
   - Avoid adding extra features or "nice-to-haves"
   - Run test and **confirm it passes**

3. 🔵 **REFACTOR: Improve Without Breaking**
   - Clean up implementation (extract methods, improve names, remove duplication)
   - Run tests after each change to ensure behavior unchanged
   - Keep tests passing throughout

**Rule:** Tests ALWAYS come before implementation. Period.

### Implementation Workflow

For EACH new behavior:

**Backend Example:**
1. 🔴 Create test in `EMODA.Server.Tests/` → Run `server: test baseline` → **EXPECT FAIL**
2. 🟢 Implement in `EMODA.Server/` → Run `server: test baseline` → **EXPECT PASS**
3. 🔵 Refactor → Run `server: test baseline` → **EXPECT PASS**

**Frontend Example:**
1. 🔴 Create test file `Component.test.tsx` → Run `client: test baseline` → **EXPECT FAIL**
2. 🟢 Implement `Component.tsx` → Run `client: test baseline` → **EXPECT PASS**
3. 🔵 Refactor → Run `client: test baseline` → **EXPECT PASS**

**Reference:** See `docs/20251016-tdd-workflow-guide.md` for complete workflow examples, anti-patterns, and technology-specific guidance (if available).

### Quality Assurance
- Run tests before and after changes.
- After implementing changes, run all tests again to verify nothing is broken.
- If any tests that were previously passing now fail, investigate and fix the root cause.
- Never proceed with implementation without first writing a failing test.

