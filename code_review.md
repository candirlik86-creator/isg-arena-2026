# code_review.md — ISG Arena Review Checklist

Use this checklist before approving any change.

## Scope
- Are only necessary files changed?
- Is the change small and focused?
- Are unrelated refactors avoided?

## Protected flows
Check that these are not broken:
- /admin auth
- /screen display
- /play join/answer
- /join redirect
- /api/game-state
- /api/uploads
- /api/media/[...path]

## Game behavior
- PIN behavior preserved?
- Team join preserved?
- Answer submission preserved?
- Timer preserved?
- Score/leaderboard preserved?
- Final/forklift flow preserved?

## Media
- Upload still works?
- Images/videos still render in admin and screen?
- Same-origin /api/media route still used?

## Data
- localStorage library not accidentally wiped?
- Supabase game-state hardening preserved?
- No old test data hardcoded?

## Security
- Admin-only actions still require admin session?
- Public player actions still work?
- Service role key not exposed to client?

## Checks
- npm run typecheck passed?
- npm run build passed?
- Manual route test done?

## Decision
- Safe to commit?
- Safe to push?
- Safe to PR?
- Safe to merge?
