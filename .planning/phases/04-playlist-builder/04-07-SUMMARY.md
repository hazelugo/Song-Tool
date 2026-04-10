---
phase: 04-playlist-builder
plan: "07"
subsystem: playlist-detail
tags: [playlist, streaming-links, export, suggestions, ux]
dependency_graph:
  requires: [04-03, 04-04]
  provides: [streaming-links-in-editor, artist-timesig-in-export, suggestions-header-button]
  affects: [src/components/ui/playlist-editor.tsx, src/components/ui/export-menu.tsx, src/components/ui/suggestions-panel.tsx, src/app/playlists/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [controlled-panel-component, server-to-client-reactnode-passthrough, client-wrapper-for-server-page]
key_files:
  created:
    - src/components/ui/playlist-actions.tsx
  modified:
    - src/components/ui/playlist-editor.tsx
    - src/components/ui/export-menu.tsx
    - src/components/ui/suggestions-panel.tsx
    - src/app/playlists/[id]/page.tsx
decisions:
  - PlaylistActions client wrapper isolates open/close state while keeping page.tsx as server component
  - SuggestionsPanel converted to fully controlled component (open/onOpenChange props)
  - Streaming link icons are inline SVG (no external icon library dependency) — YouTube red, Spotify green
  - liveLink passed as ReactNode from server component to PlaylistActions client component
metrics:
  duration_seconds: 532
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_modified: 5
---

# Phase 04 Plan 07: Playlist Detail Enhancements Summary

**One-liner:** YouTube/Spotify icon buttons in playlist rows, Artist+TimeSignature in all export formats, and Suggestions surfaced as a prominent header button instead of a hidden collapsible.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add YouTube/Spotify buttons to PlaylistEditor and update exports | 308aed2 | playlist-editor.tsx, export-menu.tsx, page.tsx |
| 2 | Surface suggestions as a header button instead of buried collapsible | 9356e39 | suggestions-panel.tsx, playlist-actions.tsx, page.tsx |

## What Was Built

### Task 1: Streaming Links + Export Fields

**PlaylistEditor (`src/components/ui/playlist-editor.tsx`):**
- Added `youtubeUrl`, `spotifyUrl`, and `artist` fields to the `Song` interface
- `ItemRow` now shows YouTube (red on hover) and Spotify (green on hover) icon link buttons between song info and the remove button — visible on mobile always, hover-only on desktop (matching remove button pattern)
- Artist name is shown below song title as small muted text when present
- Links use `e.stopPropagation()` to prevent accidental drag activation

**ExportMenu (`src/components/ui/export-menu.tsx`):**
- Added `artist` and `timeSignature` to `ExportSong` interface
- CSV export: headers now include Artist and Time Signature columns in correct positions
- JSON export: includes `artist` and `timeSignature` in each song object
- Print setlist: table has new Time Sig column; artist shown below song name
- Print with lyrics: artist shown in song header, Time Signature shown in metadata line

**Playlist detail page (`src/app/playlists/[id]/page.tsx`):**
- ExportMenu receives `artist` and `timeSignature` from query results
- PlaylistEditor receives `youtubeUrl`, `spotifyUrl`, and `artist` from query results

### Task 2: Suggestions Header Button

**SuggestionsPanel (`src/components/ui/suggestions-panel.tsx`):**
- Converted from self-managed open state to fully controlled component
- New props: `open: boolean`, `onOpenChange: (open: boolean) => void`
- Removed internal collapsible header button
- Added panel header with "Suggested Songs" label and X close button
- Suggestions load via `useEffect` when `open` changes to `true` (lazy — only fetches once)
- Returns `null` when `open` is false (no DOM presence)

**PlaylistActions (`src/components/ui/playlist-actions.tsx`):**
- New client component that owns `showSuggestions` state
- Renders all header action buttons: Live (as ReactNode prop), Suggest songs, Export, Add Songs
- "Suggest songs" button uses Sparkles icon from lucide-react
- SuggestionsPanel renders conditionally below song list when triggered
- `hasSongs` prop gates the Suggest songs button (empty playlist hides it)

**Playlist detail page (`src/app/playlists/[id]/page.tsx`):**
- Replaced inline action buttons with `<PlaylistActions>` client wrapper
- Page remains a server component — passes Live link as ReactNode prop
- Removed standalone `<SuggestionsPanel>` from bottom of page

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all wired to real data from Drizzle query.

## Self-Check: PASSED

Files exist:
- src/components/ui/playlist-actions.tsx — FOUND
- src/components/ui/playlist-editor.tsx — FOUND (modified)
- src/components/ui/export-menu.tsx — FOUND (modified)
- src/components/ui/suggestions-panel.tsx — FOUND (modified)
- src/app/playlists/[id]/page.tsx — FOUND (modified)

Commits exist:
- 308aed2 — feat(04-07): add YouTube/Spotify buttons to playlist editor and update exports
- 9356e39 — feat(04-07): surface suggestions via header button instead of buried collapsible
