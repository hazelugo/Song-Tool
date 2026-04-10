---
phase: 04-playlist-builder
plan: 05
subsystem: ui, api
tags: [drizzle, left-join, next.js, react, playlist]

# Dependency graph
requires:
  - phase: 04-playlist-builder
    provides: Playlist list page, PlaylistBuilder component, /api/playlists GET/POST endpoints
provides:
  - Song count per playlist via LEFT JOIN aggregate in GET /api/playlists
  - "Last updated" labeled date in playlist rows
  - Correct save redirect: builder dismissed then router.push to /playlists/[id]
affects: [04-playlist-builder]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LEFT JOIN + GROUP BY aggregate for count in Drizzle ORM select
    - setShowBuilder(false) before router.push to clear full-screen overlay before navigation

key-files:
  created: []
  modified:
    - src/app/api/playlists/route.ts
    - src/app/playlists/page.tsx
    - src/components/playlist-builder.tsx

key-decisions:
  - "Dismiss PlaylistBuilder overlay (setShowBuilder false) before router.push — overlay conditional rendering blocks navigation otherwise"
  - "Save button in PlaylistBuilder awaits onSave to prevent race condition mid-unmount"
  - "sql<number> cast used for Drizzle LEFT JOIN count to ensure integer type in response"

patterns-established:
  - "LEFT JOIN aggregate pattern: select count from joined table via sql template, groupBy primary table id"

requirements-completed: [PLAY-01, PLAY-02]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 4 Plan 05: Playlists List Display Fixes Summary

**Playlists list now shows per-playlist song counts (LEFT JOIN aggregate) and labeled dates; save navigates to the new playlist detail page by dismissing the builder overlay first**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-09T06:45:06Z
- **Completed:** 2026-04-09T06:53:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- GET /api/playlists uses LEFT JOIN to playlistSongs and returns `songCount` per playlist
- Playlist rows display "N songs" and "Last updated [date]" metadata
- Saving a new playlist dismisses the builder overlay before navigating to /playlists/[id]

## Task Commits

Each task was committed atomically:

1. **Task 1: Add song count to playlists API and fix list display** - `f3a1839` (feat)
2. **Task 2: Fix save redirect — dismiss builder before navigation** - `7e97aa4` (fix)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/app/api/playlists/route.ts` - Added LEFT JOIN to playlistSongs with count aggregate; added `sql` import from drizzle-orm
- `src/app/playlists/page.tsx` - Updated PlaylistSummary interface with songCount; song count and labeled date in row markup; setShowBuilder(false) before router.push in handleSave
- `src/components/playlist-builder.tsx` - Save button onClick now async and awaits onSave

## Decisions Made
- Used `sql<number>\`cast(count(${playlistSongs.songId}) as integer)\`` for type-safe count in Drizzle LEFT JOIN — consistent with Drizzle pattern for raw SQL expressions
- `setShowBuilder(false)` placed before `router.push` because the builder renders as a full-screen conditional overlay — without dismissing it, the navigation push does not visually take effect
- Save button made async/await to prevent race conditions between save completion and component unmount

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - pre-existing `sonner` TypeScript declaration errors exist in the codebase but are unrelated to this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Playlist list page is fully functional with song counts and labeled dates
- Save flow correctly navigates to the new playlist's detail page
- Ready for plan 04-06

---
*Phase: 04-playlist-builder*
*Completed: 2026-04-09*
