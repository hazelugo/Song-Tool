---
phase: 03-discovery
plan: "01"
subsystem: api
tags: [drizzle, zod, fts, filtering]

# Dependency graph
requires: [02-01]
provides:
  - filterSchema: Zod schema coercing/validating 7 filter params (bpmMin, bpmMax, key, keySig, chord, lyric, tag); exports FilterParams type
  - Extended GET /api/songs: dynamic AND filter conditions, all 7 filter types active, backward-compatible (no params = all songs)
  - E2e test stubs in tests/e2e/discovery.spec.ts for DISC-01 through DISC-08
affects: [03-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dynamic conditions array: SQL[] pushed conditionally, combined with and(...conditions)
    - websearch_to_tsquery (not to_tsquery) for lyric FTS — handles raw user input safely
    - EXISTS subquery for tag filter: avoids JOIN row duplication when song has multiple matching tags
    - Zod safeParse for filter params — invalid values silently ignored (no 422 for filter requests)
    - JSONB::text ILIKE for chord keyword match — casts chordProgressions array to text then ILIKE

key-files:
  created:
    - src/lib/validations/filter.ts
    - tests/e2e/discovery.spec.ts
  modified:
    - src/app/api/songs/route.ts (extended GET with filter conditions)

key-decisions:
  - "websearch_to_tsquery chosen over to_tsquery — raw user input (e.g. 'love song') throws in to_tsquery but not websearch"
  - "EXISTS subquery for tag: avoids duplicate rows if a song has two tags both matching the filter string"
  - "filterSchema uses safeParse (not parse) — filter requests should degrade gracefully, not 422"
  - "Backward compatible: GET /api/songs with no params returns all songs (existing Phase 2 behavior preserved)"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07]

# Metrics
duration: ~30min
completed: 2026-03-10
---

# Phase 3 Plan 01: Filter API Layer

**Zod filterSchema + extended GET /api/songs with 7 dynamic AND filter conditions + Discovery e2e test stubs**

## Accomplishments

- Created `src/lib/validations/filter.ts` with `filterSchema` — coerces URL strings to correct types (bpmMin/bpmMax as numbers), validates enum values, exports `FilterParams` TypeScript type
- Extended `GET /api/songs` to build a dynamic `conditions: SQL[]` array — each filter param pushes a condition; `and(...conditions)` combines them; missing params are simply not pushed
- 7 filter types implemented:
  1. BPM range: `gte(songs.bpm, bpmMin)` + `lte(songs.bpm, bpmMax)`
  2. Musical key: `eq(songs.musicalKey, key)` using existing enum
  3. Key signature: `eq(songs.keySignature, keySig)` using existing enum
  4. Chord keyword: `` sql`${songs.chordProgressions}::text ILIKE ${'%' + chord + '%'}` ``
  5. Lyric FTS: `` sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${lyric})` ``
  6. Tag: EXISTS subquery against `tags` table with `ilike(tags.name, tag)`
  7. Multiple filters: AND-combined by `and(...conditions)` — all active at once
- Created `tests/e2e/discovery.spec.ts` with stubs for DISC-01 through DISC-08

## Files Created/Modified

- `src/lib/validations/filter.ts` — filterSchema + FilterParams type
- `src/app/api/songs/route.ts` — Extended GET handler with dynamic filter conditions
- `tests/e2e/discovery.spec.ts` — Playwright stubs for all 8 DISC requirements

## Decisions Made

- **websearch_to_tsquery**: `to_tsquery('english', 'love song')` throws a syntax error; `websearch_to_tsquery` handles raw user input by treating it as a phrase query
- **Backward compatible**: GET /api/songs with no params returns all songs — Phase 2 song table and filter behavior unaffected

## Self-Check: PASSED

- FOUND: src/lib/validations/filter.ts exports filterSchema, FilterParams
- FOUND: GET /api/songs route uses filterSchema.safeParse
- FOUND: GET /api/songs route contains websearch_to_tsquery
- FOUND: GET /api/songs route contains exists(tagSq)
- FOUND: tests/e2e/discovery.spec.ts with DISC-01 references

---
*Phase: 03-discovery*
*Completed: 2026-03-10*
