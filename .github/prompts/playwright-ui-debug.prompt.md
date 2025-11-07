---
mode: ProblemSolver
model: GPT-4.1
tools: ['search/codebase', 'runCommands', 'testFailure', 'Playwright MCP server'] 
description: 'Structured UI issue diagnosis and fix proposal using Playwright MCP server.'
---

# UI Bug Triage Workflow

## Context Loading
1.  **Issue Input:** Review the user-provided bug report and description of the UI issue (e.g., overlapping elements, incorrect spacing, broken navigation).
2.  **Tool Setup:** Ensure the Playwright MCP server is configured and running to enable browser inspection.

## Diagnosis and Analysis
1.  **Visual Inspection:** Use Playwright MCP tools (e.g., `browser_navigate`, `browser_snapshot`, `browser_resize`) to load the affected pages (Client URL: http://localhost:51075).
2.  **Replication:** Simulate necessary user actions (e.g., `browser_click`) to replicate the bug across specified contexts (e.g., different viewports, authenticated/unauthenticated).
3.  **Root Cause Analysis:** Scan the codebase to identify the files and components responsible for the observed layout issue.

## Proposed Fix and TDD Alignment
1.  **Proposal:** Generate a detailed markdown response that outlines the **Problem Description**, **Evidence** (files/functions), and **Proposed Fix** steps (no source code, as Problem Solver mandate is generally to propose, not implement).
    *   *Constraint:* Ensure the fix respects the **API URL Policy** regarding React Router navigation.
2.  **Test Requirement:** For the proposed fix, define the expected behavior and immediately outline the first failing test (RED state) that would validate the successful fix.
3.  **Refinement:** If the user provides additional requirements or constraints (e.g., "must not extend beyond the fold"), incorporate them and refine the proposed fix and corresponding test plan.

### Human Validation Gate
🚨 **STOP**: Present the root cause analysis, the proposed fix, and the initial failing test plan to the user for explicit approval before proceeding with implementation or delegating to the Engineer.