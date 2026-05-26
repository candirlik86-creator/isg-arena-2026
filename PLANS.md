# PLANS.md — Execution Plan Template

For complex or multi-step work, write a short plan before editing code.

## 1. Goal
What user-visible outcome are we trying to achieve?

## 2. Context
Relevant routes, files and existing behavior.

## 3. Constraints
What must not change?
Which flows are protected?

## 4. Implementation Steps
Small ordered steps.
Avoid large refactors.

## 5. Test Plan
Commands:
- npm run typecheck
- npm run build

Manual checks:
- affected route opens
- existing protected flows still work

## 6. Risks
Possible regressions, data risks, auth risks, production risks.

## 7. Done Criteria
Clear checklist for completion.
