---
phase: 02-song-catalog
plan: "01"
subsystem: api
tags: [drizzle, zod, nextjs, react-hook-form, tanstack-table, playwright]

# Dependency graph
requires: [01-02]
provides:
  - Drizzle relations (songs ↔ tags, playlists ↔ playlistSongs)
  - Zod schemas for song form and API validation (songSchema, songApiSchema, SongFormValues, MUSICAL_KEYS)
  - GET /api/songs — returns all non-deleted songs with tags (JSON array)
  - POST /api/songs — creates song + tags in a single transaction, returns 201
  - GET /api/songs/[id] — returns single song with tags
  - PUT /api/songs/[id] — updates song fields, reconciles tags (delete-all-reinsert), returns updated song
  - DELETE /api/songs/[id] — soft deletes (sets deletedAt), returns 200
  - E2E test stubs for SONG-01 through SONG-06 in tests/e2e/songs.spec.ts
affects: [02-02, 02-03, 03-01]

# Tech tracking
tech-stack:
  added:
    - react-hook-form@7.71.2
    - "@hookform/resolvers@5.2.2"
    - zod@4.3.6
    - "@tanstack/react-table@8.21.3"
  patterns:
    - Drizzle query.songs.findMany with { with: { tags: true } } for joins
    - Tags reconcile pattern: delete-all then reinsert in same transaction
    - Zod safeParse for API validation; return 422 on failure
    - parseChordProgressions: split comma/whitespace, trim, filter empty

key-files:
  created:
    - src/lib/validations/song.ts
    - src/app/api/songs/route.ts
    - src/app/api/songs/[id]/route.ts
    - tests/e2e/songs.spec.ts
  modified:
    - src/db/schema.ts (added relations: songsRelations, tagsRelations, playlistsRelations, playlistSongsRelations)
    - package.json (react-hook-form, @hookform/resolvers, zod, @tanstack/react-table)

key-decisions:
  - "Tags reconciled via delete-all-reinsert in transaction — simpler than diff-based update for v1 scale"
  - "Chord progressions parsed from comma/whitespace-separated string to string[] before DB insert"
  - "Soft delete: sets deletedAt, returns 200 (not 204) — client can show confirmation"
  - "Zod safeParse returns 422 with flattened errors — consistent shape for client error display"

requirements-completed: [SONG-01, SONG-02, SONG-03, SONG-04, SONG-05]

# Metrics
duration: ~45min
completed: 2026-03-10
---

# Phase 2 Plan 01: Song CRUD API and Validation Schema

**Drizzle relations, Zod validation schemas, complete song CRUD API routes, and Playwright e2e test stubs for SONG-01 through SONG-06**

## Accomplishments

- Added Drizzle relations to `schema.ts` (songs ↔ tags, playlists ↔ playlistSongs)
- Created `src/lib/validations/song.ts` with `songSchema` (form), `songApiSchema` (API), `MUSICAL_KEYS` array, and `SongFormValues` TypeScript type
- Built `GET/POST /api/songs` — GET returns all active songs with tags; POST creates song + tags atomically
- Built `GET/PUT/DELETE /api/songs/[id]` — GET returns single song with tags; PUT reconciles tags; DELETE soft-deletes
- Created `tests/e2e/songs.spec.ts` with stubs for SONG-01 through SONG-06 (tests run but skipped pending UI)
- Installed: `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-table`

## Files Created/Modified

- `src/db/schema.ts` — Added Drizzle relations definitions
- `src/lib/validations/song.ts` — Shared Zod schemas for form and API; MUSICAL_KEYS const
- `src/app/api/songs/route.ts` — GET (list all with tags) + POST (create with tags)
- `src/app/api/songs/[id]/route.ts` — GET (single) + PUT (update + reconcile tags) + DELETE (soft)
- `tests/e2e/songs.spec.ts` — Playwright stubs for all 6 SONG requirements

## Decisions Made

- **Tag reconciliation**: Delete all tags for song, reinsert — avoids complex diff logic for v1 scale
- **Chord progressions**: `parseChordProgressions()` splits comma/whitespace input → `string[]` for JSONB
- **Soft delete returns 200**: Client can display confirmation message (vs 204 which has no body)

## Self-Check: PASSED

- FOUND: src/lib/validations/song.ts exports songSchema, songApiSchema, MUSICAL_KEYS
- FOUND: GET /api/songs returns SongWithTags[]
- FOUND: POST /api/songs creates atomically in transaction
- FOUND: PUT /api/songs/[id] reconciles tags
- FOUND: DELETE /api/songs/[id] sets deletedAt (soft delete)
- FOUND: tests/e2e/songs.spec.ts with SONG stubs

---
*Phase: 02-song-catalog*
*Completed: 2026-03-10*
