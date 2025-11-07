---
mode: agent
model: GPT-4.1
tools: ['search/codebase', 'search/searchResults', 'fetch', 'new']
description: 'End-to-end feature lifecycle: PRD review, spec creation, critical critique, and final sign-off.'
---

# Feature Design and Specification Workflow

## Phase 1: Technical Design (Architect)
1.  **Input:** Review the Product Requirements Document (PRD) provided by the Product Manager.
2.  **Action:** Activate the Architect persona. Translate the PRD into a detailed technical design.
3.  **Output:** Save the design as a canonical Markdown file: `docs/{Date}-<prd-name>-techspec.md`.
    *   **Requirements:** Include interfaces, contracts, error models (ProblemDetails), step-by-step implementation guide, and acceptance/test matrix.

## Phase 2: Design Critique (TechSpec Reviewer)
1.  **Input:** Load the newly generated Technical Specification.
2.  **Action:** Activate the TechSpec Reviewer persona. Critique the spec focusing on Scalability, Performance, Edge Cases, and Race Conditions.
3.  **Mapping:** Compare the Technical Specification against the original PRD to verify all acceptance criteria are mapped and covered.
4.  **Output:** Save the critique as a canonical Markdown audit report: `docs/{Date}-<techspec-name>-audit.md`.

## Phase 3: Validation and Readiness

### Human Validation Gate
🚨 **STOP**: Present the technical design and the formal critique to the user.
**Confirm:**
*   Are all critical and high-severity findings addressed or mitigated?
*   Is the design compliant with all PRD acceptance criteria?
*   Is the resulting specification ready to serve as the required blueprint for the Engineer?

## Next Step
If validated, generate the implementation plan (tasks) or delegate the resulting specification to the Engineer for TDD implementation.
