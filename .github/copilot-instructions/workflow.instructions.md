---
applyTo: "**/*test*.{ts,tsx,js,jsx}"
description: "TDD and Quality Assurance Workflow for Expo/React Native"
---

## TDD Workflow (MANDATORY)

All code changes MUST follow the Red-Green-Refactor cycle. **No exceptions.**

### The Cycle

1. RED: Write a Failing Test First
   - Define expected behavior in a test
   - Run test and **confirm it fails** (proves test is valid)
   - Failure should indicate missing behavior, not syntax errors

2. GREEN: Implement Minimum Code to Pass
   - Write only enough code to make the test pass
   - Avoid adding extra features or "nice-to-haves"
   - Run test and **confirm it passes**

3. REFACTOR: Improve Without Breaking
   - Clean up implementation (extract methods, improve names, remove duplication)
   - Run tests after each change to ensure behavior unchanged
   - Keep tests passing throughout

**Rule:** Tests ALWAYS come before implementation. Period.

### Test Commands
- **Run all**: `npx jest`
- **Run all (no coverage)**: `npx jest --no-coverage`
- **Watch mode**: `npx jest --watchAll`
- **Single file**: `npx jest path/to/test.test.tsx`

### Test Structure
- Component tests: `components/__tests__/*.test.tsx`
- Hook tests: `hooks/__tests__/*.test.ts`
- Setup/mocks: `jest.setup.js`
- Config: `jest.config.js`

### Quality Assurance
- Run tests before AND after changes
- If previously passing tests fail, investigate root cause before proceeding
- Never skip the RED step — a test that doesn't fail first proves nothing
