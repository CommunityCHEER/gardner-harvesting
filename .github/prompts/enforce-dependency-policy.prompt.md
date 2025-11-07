---
mode: SystemsAnalyst
model: GPT-4.1
tools: ['search/codebase', 'search/searchResults', 'problems']
description: 'Automated audit of modified files to enforce Yarn Berry (PnP) package manager policy.'
---

# Package Manager Policy Enforcement Workflow

## Context Loading
1.  **Scope:** Identify all newly added or modified files within the current Pull Request (PR) or working set.
2.  **Policy:** Acknowledge the critical constraint: Mandatory use of **Yarn Berry (PnP)**; prohibition of `npm`, `pnpm`, `node_modules`, and `package-lock.json`.

## Deterministic Execution (Audit)
1.  **Action:** Scan all scoped files (source code, configuration, documentation) for explicit references to or commands invoking `npm`, `pnpm`, or `npx`.
2.  **Action:** Scan for instructions or code paths that assume the existence or creation of a `node_modules` directory or `package-lock.json`.
3.  **Finding Generation:** If any violations are detected, raise a finding immediately.

## Structured Output Requirements
*   **Audit Report:** Produce a report listing all violations found, using the standard finding format (Title, Severity, Evidence, Proposed Fix).
*   **Proposed Fix:** For any violating command (e.g., `npm install`), propose the equivalent `yarn` or `yarn workspace` command.
*   **Compliance Statement:** Conclude with a statement of compliance status for the Package Manager Policy.