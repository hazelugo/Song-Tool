---
phase: 04-playlist-builder
plan: 06
subsystem: ui
tags: [dnd-kit, react, drag-and-drop, useMemo, playlist]

# Dependency graph
requires:
  - phase: 04-playlist-builder
    provides: PlaylistBuilder component with basic drag-and-drop and library panel
provides:
  - Filtered library panel that excludes already-added songs
  - Smooth DragOverlay drag experience with activation constraint in PlaylistBuilder
affects: [04-playlist-builder]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMemo for derived Set exclusion filter (itemSongIds)
    - DragOverlay pattern matching PlaylistEditor for smooth drag UX
    - PointerSensor activationConstraint: { distance: 8 } prevents accidental drags

key-files:
  created: []
  modified:
    - src/components/playlist-builder.tsx

key-decisions:
  - "DragOverlay renders simplified clone (name + BPM + key + shadow); original item uses opacity-30 as placeholder"
  - "itemSongIds Set built with useMemo, filteredSongs also memoized — both depend on items state"
  - "activationConstraint distance:8 matches PlaylistEditor pattern for consistent UX"

patterns-established:
  - "Pattern: DragOverlay + opacity-30 placeholder — same approach as PlaylistEditor for smooth drag"
  - "Pattern: useMemo-derived Set for O(1) exclusion filtering"

requirements-completed: [PLAY-01, PLAY-03]

# Metrics
duration: 12min
completed: 2026-04-09
---

# Phase 04 Plan 06: PlaylistBuilder UX Fixes Summary

**PlaylistBuilder now excludes added songs from the library panel and uses DragOverlay with activation constraint for smooth, jank-free reordering**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-09T00:00:00Z
- **Completed:** 2026-04-09T00:12:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added songs are immediately removed from the library panel (no duplicate confusion)
- Removing a song from the playlist makes it reappear in the library
- Drag-and-drop uses DragOverlay — smooth visual clone follows cursor, placeholder stays in place with reduced opacity
- PointerSensor activation constraint (distance: 8) prevents accidental drags when clicking buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Filter added songs from available pool and add DragOverlay** - `5585134` (feat)

## Files Created/Modified
- `src/components/playlist-builder.tsx` - Added useMemo for itemSongIds Set and filteredSongs, DragStartEvent/DragOverlay imports and implementation, activationConstraint on PointerSensor, activeId state

## Decisions Made
- DragOverlay renders a simplified row (name + BPM + key + shadow) without the remove button — cleaner overlay visual
- itemSongIds uses `useMemo` with `[items]` dependency for efficient recomputation
- filteredSongs uses `useMemo` with `[availableSongs, searchQuery, itemSongIds]` for correct reactivity
- SortablePlaylistItem `isDragging` opacity changed from `opacity-50` to `opacity-30` — DragOverlay is the visual, original is just a subtle placeholder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors for missing `sonner` module in unrelated files — not caused by these changes, not fixed (out of scope).

## Known Stubs

None.

## Next Phase Readiness
- PlaylistBuilder UX issues resolved; ready for further testing or additional gap closure plans

---
*Phase: 04-playlist-builder*
*Completed: 2026-04-09*
