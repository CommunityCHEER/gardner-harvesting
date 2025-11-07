---
mode: Engineer
model: GPT-4.1
tools: ['search/codebase', 'edit/editFiles', 'runCommands', 'runTasks', 'testFailure', 'problems', 'changes', 'new']
description: 'Systematically resolves features found missing or incomplete by the Tech Spec Reviewer, using the mandatory Red-Green-Refactor TDD cycle for all resulting code changes.'
---

# Feature Implementation Gap Resolution

## Context Loading Phase
1. Load and review the original Technical Specification: [Spec File](../../docs/20251022-ca132-intake-edit-endpoints-techspec.md).
2. Load and thoroughly review the Tech Specification Audit Report: [Audit File](../../docs/20251027-ca132-intake-edit-endpoints-audit.md). This report contains specific items marked as **Missing** or **Partially Compliant** in the Compliance Matrix.
3. Confirm current codebase state by running all existing tests to ensure a clean baseline before starting work.

## Deterministic Execution: Addressing Implementation Gaps

Iterate through each item noted in the Audit Report that requires implementation or correction.

For **EACH** feature gap, missing requirement, or policy violation identified (e.g., issues related to the API URL Policy):

### TDD Cycle (MANDATORY) [4, 5]

The Engineer MUST follow the Red-Green-Refactor cycle for every piece of code implemented or changed, without exception.

1.  🔴 **RED: Write the Failing Test First**
    *   **Action:** Write the minimal test code necessary to define the expected behavior of the missing feature.
    *   **Validation:** Execute the test run (e.g., `dotnet test` or `yarn workspace emoda.client test`) and **confirm it fails** due to missing behavior.
    *   **Constraint:** If the proposed change involves fixing an existing policy violation (e.g., an API URL Policy violation), the test must validate the fix (e.g., asserting the correct path format).

2.  🟢 **GREEN: Implement Minimum Code to Pass**
    *   **Action:** Write *only* the minimum implementation code required to resolve the failure defined in the RED state.
    *   **Validation:** Execute the test run and **confirm it passes**.
    *   **Policy Enforcement:** During implementation, strictly adhere to the **API URL Policy**. If you observe or implement leading slashes in React Router navigation or use direct `fetch()` without `APP_BASE_URL`, you **MUST** correct it and **raise a finding** in your output.

3.  🔵 **REFACTOR: Improve Code Quality**
    *   **Action:** Refactor the implementation to improve clarity, maintainability, and single responsibility principle adherence.
    *   **Validation:** Execute all tests again after each refactoring change to ensure behavior remains unchanged and all tests **pass**.

4.  **Verification:** Update the source code, unit/integration tests, and artifacts, ensuring compliance with the original technical specification's contracts (interfaces, error shapes).

## Structured Output Requirements
*   Provide a summary detailing which audit findings were resolved and which files were modified.
*   Explicitly confirm that the **TDD cycle** was followed for every item implemented.
*   If any existing documentation (including the specification) was found to be outdated or incorrect during the resolution process, **raise this as a finding**.
*   Ensure all commands are presented using **PowerShell (pwsh) syntax**.