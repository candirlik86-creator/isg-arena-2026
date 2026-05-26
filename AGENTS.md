# AGENTS.md — ISG Arena 2026

## Project
ISG Arena 2026 is a Kahoot-like live OHS/İSG quiz platform built with Next.js 15, TypeScript, React and Tailwind.

Local project folder:
~/Projects/isg-arena-2026

Main commands:
- npm run dev
- npm run typecheck
- npm run build

## Current production baseline
PR #19 is merged to main and production.
The game-state hardening code is production-ready:
- admin-only game-state mutations are protected by admin session cookie
- public player actions remain available
- Supabase optimistic concurrency retry is used to reduce concurrent write loss
- local and Vercel Preview stress tests passed with 50 joins and 50 answers

Do not weaken or bypass this behavior.

## Critical routes
Protect these routes and flows:
- /
- /admin
- /screen
- /play
- /join
- /api/game-state
- /api/uploads
- /api/media/[...path]

## Must preserve
Do not break:
- admin authentication
- PIN generation and stability
- lobby flow
- team join
- late join behavior
- quiz intro
- answer submission
- answer locking
- timer
- scoring
- leaderboard
- final/forklift challenge
- competition library
- media upload
- media proxy route
- Supabase game-state hardening

## Media rules
Do not change media upload/proxy unless the task explicitly asks for it.

Important files:
- src/app/api/uploads/route.ts
- src/app/api/media/[...path]/route.ts
- src/components/ContentFlowEditor.tsx
- src/app/admin/admin-page-client.tsx
- src/app/screen/page.tsx

Uploaded media should be served through same-origin app route:
- /api/media/uploads/...

Do not return client-facing Supabase public URLs as the main rendering path.

## Work rules
- Use small branches.
- Use small PRs.
- Do not combine unrelated tasks.
- Do not add new packages unless explicitly approved.
- Do not make large refactors during demo/event hardening work.
- Do not commit .DS_Store or temporary test scripts.
- Do not commit/push/PR before reporting changed files and checks.

## Required checks
After code changes run:
- npm run typecheck
- npm run build

For UI/game-flow changes, manually test the affected route.

## Done means
Before asking for merge approval, report:
- changed files
- what changed
- typecheck result
- build result
- manual test result if applicable
- risks or assumptions

## Event priority
The June live event must not be put at risk.
SaaS, AI generation, payment and large DB migrations are separate phases.
