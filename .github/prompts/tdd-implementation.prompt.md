---
mode: Engineer
model: GPT-4.1
tools: ['search/codebase', 'edit/editFiles', 'runCommands', 'runTasks', 'testFailure']
description: 'Systematic execution of the MANDATORY Red-Green-Refactor TDD workflow for feature implementation.'
---

# TDD Feature Implementation Workflow

## Context Loading Phase
1. Load and thoroughly review the Technical Specification: [Spec File]($specPath)
2. Review relevant domain instructions (e.g., frontend.instructions.md or backend.instructions.md) to ensure React Query/API Policy compliance.
3. Run all existing tests to confirm a clean baseline before starting work.

## Deterministic Execution (Red-Green-Refactor Cycle)

### 1. 🔴 RED: Write Failing Test
*   **Action:** Write the minimal test code necessary to define the *new expected behavior*.
*   **Validation:** Execute the test run (e.g., `dotnet test` or `yarn workspace emoda.client test`) and **confirm it fails** due to missing implementation, not syntax errors.
*   **Checkpoint:** If the test passes, stop immediately and raise a finding; the test is invalid.

### 2. 🟢 GREEN: Implement Minimum Code
*   **Action:** Write *only* the minimum implementation code required to make the failing test pass.
*   **Validation:** Execute the test run and **confirm it passes**.
*   **Policy Enforcement:** Check implementation for violations of the **API URL Policy** (e.g., leading slashes in React Router navigation or direct `fetch()` without `APP_BASE_URL`) and raise a finding if found [19, 20].

### 3. 🔵 REFACTOR: Improve Code Quality
*   **Action:** Refactor the implementation to improve clarity, maintainability, and adherence to the single responsibility principle.
*   **Validation:** Execute all tests again after each refactoring change to ensure behavior remains unchanged and all tests **pass**.

## Structured Output Requirements
*   Provide a summary of the implemented changes and confirmation that the TDD cycle was followed.
*   Document any findings related to policy violations or outdated documentation.