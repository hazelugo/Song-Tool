---
phase: 05-gap-compile-find-similar
plan: 01
subsystem: discovery
tags: [find-similar, discovery, cleanup, routing]
dependency_graph:
  requires: []
  provides: [find-similar-seedId-flow, clean-discovery-api]
  affects: [src/app/songs/page.tsx, src/app/discovery/page.tsx, src/app/api/discovery/route.ts]
tech_stack:
  added: []
  patterns: [useSearchParams + useEffect for URL-param-driven init, cancellable async effect]
key_files:
  created: []
  modified:
    - src/app/songs/page.tsx
    - src/app/discovery/page.tsx
    - src/app/api/discovery/route.ts
  deleted:
    - src/lib/parse-prompt.ts
decisions:
  - "seedId UUID param replaces buildSimilarQuery text query for Find Similar flow"
  - "seedId useEffect placed after startChain declaration to satisfy TypeScript block-scoping rules"
  - "parse-prompt.ts deleted: sole consumer was the removed POST handler"
metrics:
  duration: ~12min
  completed: 2026-04-10
  tasks_completed: 2
  files_changed: 4
---

# Phase 5 Plan 1: Find Similar Flow + Discovery API Cleanup Summary

**One-liner:** Switched Find Similar to seedId-based routing and wired discovery page to auto-start chain via /api/similar, then removed orphaned POST /api/discovery handler and dead parsePrompt utility.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire seedId param — songs page push + discovery page consume | c5b7307 | src/app/songs/page.tsx, src/app/discovery/page.tsx |
| 2 | Remove orphaned POST /api/discovery and dead parsePrompt | e6849e3 | src/app/api/discovery/route.ts, src/lib/parse-prompt.ts |

## What Was Built

**Task 1 — Find Similar flow:**
- Songs page `onFindSimilar` now pushes `/discovery?seedId={song.id}` instead of `/discovery?q=buildSimilarQuery(song)`
- Removed `buildSimilarQuery` import from songs page
- Discovery page reads `seedId` via `useSearchParams`, fires a cancellable async `useEffect` on mount
- Effect fetches `GET /api/similar?songId={seedId}`, reads `{ seed, results }` response, calls `startChain(seed)` to pre-populate column 0 and column 1
- If fetch fails or seed is null, chain opens empty (D-04 behavior preserved)

**Task 2 — API cleanup:**
- Removed entire `POST` export from `src/app/api/discovery/route.ts` — file is now 5 lines (GET only)
- Deleted `src/lib/parse-prompt.ts` — 155 lines of dead code removed; sole consumer was the POST handler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Moved seedId useEffect after startChain declaration**
- **Found during:** Task 2 TypeScript check (TS2448 + TS2454: block-scoped variable used before declaration)
- **Issue:** Plan specified placing the useEffect after the connector-paths useEffect (line ~346), but `startChain` is defined further down via `useCallback` at line ~408. TypeScript correctly rejects referencing a `const` before its declaration.
- **Fix:** Removed the early useEffect block and re-added it immediately after the `startChain = useCallback(...)` declaration.
- **Files modified:** src/app/discovery/page.tsx
- **Commit:** e6849e3

## Known Stubs

None — the seedId flow is fully wired end-to-end. The `{ seed }` field in `/api/similar` response is an existing production field (not stubbed).

## Threat Flags

None — no new network endpoints introduced. The POST /api/discovery removal reduces attack surface (T-05-02 mitigated per plan threat model).

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/app/songs/page.tsx exists | FOUND |
| src/app/discovery/page.tsx exists | FOUND |
| src/app/api/discovery/route.ts exists | FOUND |
| src/lib/parse-prompt.ts deleted | CONFIRMED |
| Commit c5b7307 exists | FOUND |
| Commit e6849e3 exists | FOUND |
