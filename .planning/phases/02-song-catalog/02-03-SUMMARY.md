---
phase: 02-song-catalog
plan: "03"
subsystem: ui
tags: [tanstack-table, react, songs-page, playwright]

# Dependency graph
requires: [02-01, 02-02]
provides:
  - SongTable: TanStack Table v8 with 5-column definitions (Name, BPM, Key, Key Sig, Tags), client-side pagination at 25 rows, row-click-to-edit handler
  - Songs page: wired end-to-end with SongSheet, Add Song button, filter integration via URL searchParams
  - SongFilters: debounced filter controls (BPM min/max, Key dropdown, Key Sig dropdown, Lyric FTS, Tag, Chord keyword) using URL searchParams — placed on Songs page (not Discovery)
  - E2e tests filled in for SONG-01 through SONG-06 (all passing)
affects: [03-02]

# Tech tracking
tech-stack:
  added:
    - use-debounce@10.1.0
  patterns:
    - TanStack Table getCoreRowModel + getPaginationRowModel for 25-row pages
    - URL searchParams pattern for filter state — useSearchParams + router.replace for each filter change
    - SongFilters wrapped in Suspense (required for useSearchParams in Next.js App Router)
    - loadSongs wrapped in useCallback(deps: [searchParams]) so filter changes auto-refetch

key-files:
  created:
    - src/components/songs/song-table.tsx
    - src/components/songs/song-filters.tsx
  modified:
    - src/app/songs/page.tsx (wired SongTable + SongSheet + SongFilters + "Add Song" button + "Save as Playlist" button)
    - tests/e2e/songs.spec.ts (filled in stubs with real Playwright interactions)

key-decisions:
  - "Filter state via URL searchParams — bookmarkable, no extra state lib, works with Next.js SSR"
  - "SongFilters placed on Songs page (not /discovery) — DISC filter controls reused on /songs to reduce duplication"
  - "Debounce 300ms on text inputs (lyric, tag, chord) — prevents excessive API calls while typing"
  - "Save results as Playlist button added to Songs page header — opens PlaylistBuilder inline"

requirements-completed: [SONG-01, SONG-02, SONG-03, SONG-04, SONG-05, SONG-06]

# Metrics
duration: ~60min
completed: 2026-03-10
---

# Phase 2 Plan 03: SongTable, Songs Page, and E2E Tests

**TanStack Table with pagination, Songs page wired end-to-end (filters + sheet + table), and all SONG e2e tests passing**

## Accomplishments

- Built `SongTable` — TanStack Table with columns: Name, BPM, Key, Key Sig, Tags (Badge pills); 25-row pagination with Previous/Next; row click opens edit sheet; empty state with "Add your first song" button
- Built `SongFilters` — filter bar with BPM min/max (number inputs), Key (Select dropdown), Key Sig (Select), Lyric search (text, FTS), Tag (text), Chord keyword (text); all via debounced URL searchParams updates; wrapped in Suspense
- Wired `/songs` page with: `Add Song` button → empty SongSheet; row click → pre-filled SongSheet; `SongFilters`; `SongTable` fetching from `/api/songs?{searchParams}`; "Save results as Playlist" button → inline PlaylistBuilder
- Filled in all 6 e2e tests in `tests/e2e/songs.spec.ts` with real Playwright interactions (add song, optional fields, tags, edit song, delete song, pagination)
- Installed: `use-debounce`

## Files Created/Modified

- `src/components/songs/song-table.tsx` — TanStack Table + pagination
- `src/components/songs/song-filters.tsx` — Filter bar (URL searchParams, debounced)
- `src/app/songs/page.tsx` — Full songs page wiring
- `tests/e2e/songs.spec.ts` — All 6 SONG tests filled and passing

## Decisions Made

- **Filters on Songs page**: The filter controls (BPM, key, key sig, lyric, tag, chord) were placed on the Songs page rather than a separate Discovery page. This allows users to find songs in the same view where they manage them. The `/discovery` page became a separate AI-powered search feature (see Phase 3 Plan 02 deviation note).
- **URL searchParams for filter state**: No extra state management library; filters are bookmarkable and survive page reload
- **PlaylistBuilder inline**: "Save results as Playlist" shows a full-screen inline playlist builder rather than navigating away

## Self-Check: PASSED

- FOUND: src/components/songs/song-table.tsx with 5 column definitions and pagination
- FOUND: src/components/songs/song-filters.tsx with all 7 filter controls
- FOUND: src/app/songs/page.tsx wired end-to-end
- FOUND: tests/e2e/songs.spec.ts — 6 tests passing
- VERIFIED: Row click opens edit sheet
- VERIFIED: Empty state visible when no songs

---
*Phase: 02-song-catalog*
*Completed: 2026-03-10*
