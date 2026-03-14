---
phase: 04-playlist-builder
plan: "01"
subsystem: api
tags: [drizzle, nextjs, playlists, camelot, fractional-indexing, dnd-kit]

# Dependency graph
requires: [01-02]
provides:
  - GET/POST /api/playlists — list all playlists; create playlist with optional initial songs
  - GET/PATCH/DELETE /api/playlists/[id] — playlist detail with songs; rename; soft delete
  - POST/PUT /api/playlists/[id]/songs — add songs to playlist; reorder all songs (full position rewrite)
  - DELETE /api/playlists/[id]/songs/[songId] — remove song from playlist (join table only)
  - GET /api/playlists/[id]/suggestions — Camelot + BPM compatibility scoring, returns top 10
  - src/lib/ranking.ts: generateRank(prev?, next?) for fractional midpoint; rebalanceRanks(items) for precision reset
  - src/lib/camelot.ts: full Camelot Wheel (17 enharmonic keys); getCamelotPosition, getKeyCompatibility (score 0-3), formatCamelot
  - tests/e2e/playlists.spec.ts: Playwright stubs for PLAY-01 through PLAY-06
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
  patterns:
    - Hardcoded USER_ID "f47ac10b-58cc-4372-a567-0e02b2c3d479" for v1 open access
    - verifyPlaylistOwner() helper to check playlist ownership before mutations
    - Camelot scoring: 3=same key, 2=adjacent/relative major-minor, 0=incompatible; BPM ±15 adds 1 pt
    - Suggestions: fetch candidates (not in playlist, not deleted, limit 200), score each, return top 10
    - POST /api/playlists/[id]/songs uses max(position) + 1 for appending; onConflictDoNothing for duplicates

key-files:
  created:
    - src/lib/ranking.ts
    - src/lib/camelot.ts
    - src/app/api/playlists/route.ts
    - src/app/api/playlists/[id]/route.ts
    - src/app/api/playlists/[id]/songs/route.ts
    - src/app/api/playlists/[id]/songs/[songId]/route.ts
    - src/app/api/playlists/[id]/suggestions/route.ts
    - tests/e2e/playlists.spec.ts
  modified:
    - package.json (added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)

key-decisions:
  - "Hardcoded USER_ID for v1 — all playlists owned by same UUID; auth is v2"
  - "position stored as real (float) — fractional indexing; generateRank returns midpoint between neighbors"
  - "POST /api/playlists/[id]/songs uses onConflictDoNothing — safe to add a song already in playlist"
  - "Camelot suggestions filter BPM ±15 in JS (not SQL) — avoids complex SQL; candidate pool bounded at 200"
  - "Suggestions return top 10 by score — BPM match (1pt) + Camelot compatibility (2-3pt)"

requirements-completed: [PLAY-01, PLAY-02, PLAY-05, PLAY-06]

# Metrics
duration: ~60min
completed: 2026-03-10
---

# Phase 4 Plan 01: Playlist Data Layer

**Complete playlist API routes (9 endpoints), fractional indexing library, Camelot harmonic compatibility library, and Playwright e2e stubs**

## Accomplishments

- Created `src/lib/ranking.ts` — `generateRank(prev?, next?)` for fractional midpoint; `rebalanceRanks(items)` resets all positions to `(index+1) * 10000` when precision degrades
- Created `src/lib/camelot.ts` — Camelot Wheel with all 17 enharmonic key mappings; `getKeyCompatibility()` scores pairs as 3 (same), 2 (adjacent/relative), or 0 (incompatible); `formatCamelot()` for display
- Built 9 API routes:
  - `GET /api/playlists` — lists all playlists for USER_ID ordered by updatedAt
  - `POST /api/playlists` — creates playlist + inserts initial songs in transaction
  - `GET /api/playlists/[id]` — full playlist with songs (via Drizzle relations), ordered by position
  - `PATCH /api/playlists/[id]` — renames playlist (name field only)
  - `DELETE /api/playlists/[id]` — soft deletes (sets deletedAt), returns 204
  - `POST /api/playlists/[id]/songs` — adds songs at end (max position + 1, onConflictDoNothing)
  - `PUT /api/playlists/[id]/songs` — reorders songs (full ordered songId array → sequential positions)
  - `DELETE /api/playlists/[id]/songs/[songId]` — removes song from join table only
  - `GET /api/playlists/[id]/suggestions` — Camelot + BPM scoring, top 10 suggestions
- Created `tests/e2e/playlists.spec.ts` with stubs for PLAY-01 through PLAY-06
- Installed: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Files Created/Modified

- `src/lib/ranking.ts` — Fractional indexing utilities
- `src/lib/camelot.ts` — Camelot Wheel and key compatibility scoring
- `src/app/api/playlists/route.ts` — List + Create
- `src/app/api/playlists/[id]/route.ts` — Get + Rename + Soft Delete
- `src/app/api/playlists/[id]/songs/route.ts` — Add Songs + Reorder
- `src/app/api/playlists/[id]/songs/[songId]/route.ts` — Remove Song
- `src/app/api/playlists/[id]/suggestions/route.ts` — Camelot suggestions
- `tests/e2e/playlists.spec.ts` — Playwright stubs
- `package.json` — Added dnd-kit packages

## Decisions Made

- **Hardcoded USER_ID**: v1 is an open shared database — all API routes use the same UUID; auth and per-user playlists are v2
- **BPM filter in JS**: Suggestions API fetches up to 200 candidates from DB, then filters/scores in JS — avoids complex SQL; bounded candidate pool is fast enough
- **onConflictDoNothing for add songs**: Safe idempotent add — adding a song already in the playlist is silently ignored

## Self-Check: PASSED

- FOUND: src/lib/ranking.ts exports generateRank, rebalanceRanks
- FOUND: src/lib/camelot.ts exports getCamelotPosition, getKeyCompatibility, formatCamelot
- FOUND: All 9 API route handlers
- FOUND: tests/e2e/playlists.spec.ts with PLAY stubs
- VERIFIED: POST /api/playlists creates in transaction
- VERIFIED: Suggestions route uses getKeyCompatibility scoring

---
*Phase: 04-playlist-builder*
*Completed: 2026-03-10*
