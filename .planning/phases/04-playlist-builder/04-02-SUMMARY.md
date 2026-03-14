---
phase: 04-playlist-builder
plan: "02"
subsystem: ui
tags: [playlist-builder, dnd-kit, songs-page, discovery-page, playlists-page]

# Dependency graph
requires: [04-01]
provides:
  - PlaylistBuilder: full-screen inline component for creating a new playlist from a song set; dnd-kit sortable, name input, remove/add songs, Save → POST /api/playlists → redirect to /playlists/[id]
  - PlaylistItem type: { id: string, song: Song, rank: number }
  - Playlists list page: lists all saved playlists (name, song count, last updated); "New Playlist" button; delete playlist; navigate to detail on click
  - "Save results as Playlist" button wired on Songs page and Discovery page
affects: [04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PlaylistBuilder as full-screen inline view (replaces page content, not a modal) — avoids navigation for quick playlist creation
    - dnd-kit useSortable + DndContext + SortableContext for builder drag-sort
    - generateRank / rebalanceRanks used to assign initial ranks from array index
    - Playlists list page is 'use client' — fetches from GET /api/playlists on mount

key-files:
  created:
    - src/components/playlist-builder.tsx
  modified:
    - src/app/playlists/page.tsx (replaced placeholder with full list UI + PlaylistBuilder integration)
    - src/app/songs/page.tsx (wired "Save results as Playlist" → PlaylistBuilder)
    - src/app/discovery/page.tsx (wired "Save results as Playlist" → PlaylistBuilder)

key-decisions:
  - "PlaylistBuilder is an inline full-screen component, not a modal — feels more like a dedicated creation flow"
  - "PlaylistBuilder accepts availableSongs + initialItems — Songs page passes filtered results; Discovery passes search results"
  - "Initial ranks assigned as (index + 1) * 10000 — rebalanceRanks pattern from ranking.ts"
  - "Playlists page uses client-side fetch (useEffect) — playlists are user-specific and change frequently"

requirements-completed: [PLAY-01]

# Metrics
duration: ~50min
completed: 2026-03-10
---

# Phase 4 Plan 02: PlaylistBuilder and Playlists List Page

**PlaylistBuilder component for creating playlists, "Save as Playlist" wired on Songs and Discovery pages, and Playlists list page**

## Accomplishments

- Built `PlaylistBuilder` — full-screen inline component with:
  - Drag-sortable song list (dnd-kit `useSortable` + `verticalListSortingStrategy`)
  - "Playlist name" input field
  - Remove song (× button) from builder
  - "Add more songs" section from `availableSongs` prop
  - Save button — calls `onSave(name, items)` prop → POST /api/playlists → navigate to /playlists/[id]
  - Back/Close button → `onClose()` prop → returns to previous view
- Exported `PlaylistItem` type: `{ id: string, song: Song, rank: number }`
- Wired `PlaylistBuilder` on `/songs` page via "Save results as Playlist" button (passes filtered songs as both `availableSongs` and `initialItems`)
- Wired `PlaylistBuilder` on `/discovery` page via "Save results as Playlist" button (passes search results)
- Rebuilt `/playlists` page with real UI: fetches playlist list, shows name/song count/last updated, delete button, click to navigate to detail, "New Playlist" button that opens PlaylistBuilder with all songs

## Files Created/Modified

- `src/components/playlist-builder.tsx` — PlaylistBuilder component + PlaylistItem type
- `src/app/playlists/page.tsx` — Full playlists list UI
- `src/app/songs/page.tsx` — Wired Save as Playlist button
- `src/app/discovery/page.tsx` — Wired Save as Playlist button

## Decisions Made

- **Inline component (not modal)**: PlaylistBuilder replaces page content when activated, giving it the full viewport for the song list — appropriate for a playlist that might have many songs
- **initialItems pattern**: Songs and Discovery pages pass their current results as `initialItems` — builder opens pre-populated, user just names and saves

## Self-Check: PASSED

- FOUND: src/components/playlist-builder.tsx exports PlaylistBuilder, PlaylistItem
- FOUND: src/app/playlists/page.tsx with playlist list and New Playlist button
- VERIFIED: Songs page has "Save results as Playlist" button
- VERIFIED: Discovery page has "Save results as Playlist" button
- VERIFIED: Save calls POST /api/playlists and navigates to /playlists/[id]

---
*Phase: 04-playlist-builder*
*Completed: 2026-03-10*
