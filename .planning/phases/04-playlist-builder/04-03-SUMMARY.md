---
phase: 04-playlist-builder
plan: "03"
subsystem: ui
tags: [playlist-detail, dnd-kit, streaming-links, export, camelot-suggestions]

# Dependency graph
requires: [04-01, 04-02]
provides:
  - Playlist detail page: server-rendered; shows songs in position order; header with name editor, export, add songs, delete
  - PlaylistEditor: song rows with drag handle (dnd-kit), remove button, streaming link buttons (YouTube/Spotify); reorder via PUT /api/playlists/[id]/songs
  - AddSongsDialog: modal search over catalog; multi-select with checkmarks; POST /api/playlists/[id]/songs; router.refresh on add
  - SuggestionsPanel: collapsible; fetches GET /api/playlists/[id]/suggestions; shows song + BPM + Camelot reason; one-click add
  - ExportMenu: DropdownMenu with CSV and text options; client-side blob download via URL.createObjectURL
  - PlaylistNameEditor: click-to-edit h1; PATCH /api/playlists/[id] on blur/enter; optimistic update
affects: [04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Playlist detail page is a Next.js server component (no 'use client') — fetches from DB directly via Drizzle
    - PlaylistEditor is 'use client' — manages local song order state + dnd-kit
    - AddSongsDialog fetches GET /api/songs on dialog open (not on mount) to avoid unnecessary requests
    - SuggestionsPanel loads suggestions lazily on expand (not on page load)
    - ExportMenu uses URL.createObjectURL + anchor click for file download (no server endpoint needed)
    - PlaylistNameEditor uses controlled input; PATCH on blur; reverts on error

key-files:
  created:
    - src/app/playlists/[id]/page.tsx
    - src/components/ui/playlist-editor.tsx
    - src/components/ui/add-songs-dialog.tsx
    - src/components/ui/suggestions-panel.tsx
    - src/components/ui/export-menu.tsx
    - src/components/ui/playlist-name-editor.tsx

key-decisions:
  - "Playlist detail page is a server component — fetches from DB directly; PlaylistEditor hydrates with initial songs as client component"
  - "SuggestionsPanel loads lazily on first expand — avoids API call on page load for all users"
  - "ExportMenu downloads client-side — no server streaming endpoint; CSV and text are both small enough"
  - "AddSongsDialog excludes existing playlist songs from search results (existingSongIds prop)"

requirements-completed: [PLAY-02, PLAY-04, PLAY-05]

# Metrics
duration: ~70min
completed: 2026-03-10
---

# Phase 4 Plan 03: Playlist Detail UI

**Full playlist detail page with PlaylistEditor, AddSongsDialog, SuggestionsPanel, ExportMenu, and PlaylistNameEditor**

## Accomplishments

- Built `src/app/playlists/[id]/page.tsx` — server component; fetches playlist with songs + tags from DB via Drizzle; passes to client components; shows 404 if not found; header with Back link, PlaylistNameEditor, song count, last updated, ExportMenu, AddSongsDialog, Delete button

- Built `PlaylistEditor` — `'use client'` component with:
  - dnd-kit sortable song rows with GripVertical drag handle
  - Each row: song name, BPM badge, Camelot position (key + sig formatted via `formatCamelot`), YouTube link button, Spotify link button, Remove button
  - DragOverlay for smooth drag ghost
  - On drag end: `arrayMove` for optimistic reorder → `PUT /api/playlists/[id]/songs` with new songId order → `router.refresh()` on success; reverts optimistic update on failure

- Built `AddSongsDialog` — modal Dialog; fetches `GET /api/songs` on open; search input filters by name; checkmark multi-select (excludes existing playlist songs); Save adds selected via `POST /api/playlists/[id]/songs`; router.refresh on close

- Built `SuggestionsPanel` — collapsible (ChevronDown/Up); lazy-loads `GET /api/playlists/[id]/suggestions` on first expand; shows top 10 songs with score reasons (BPM match + Camelot compatibility label); one-click add via `POST /api/playlists/[id]/songs`; shows Sparkles icon

- Built `ExportMenu` — DropdownMenu with "Download CSV" and "Download Text" options; `toSafeFilename()` for clean filename; CSV includes Name, BPM, Key, Key Sig, Tags; text is one song per line; client-side blob download

- Built `PlaylistNameEditor` — inline click-to-edit; editable on click; PATCH on blur/Enter; reverts on error; shows edit pencil icon on hover

## Files Created

- `src/app/playlists/[id]/page.tsx` — Playlist detail server page
- `src/components/ui/playlist-editor.tsx` — Drag-sortable song list with streaming links
- `src/components/ui/add-songs-dialog.tsx` — Add songs from catalog modal
- `src/components/ui/suggestions-panel.tsx` — Camelot suggestions collapsible panel
- `src/components/ui/export-menu.tsx` — CSV/text export dropdown
- `src/components/ui/playlist-name-editor.tsx` — Inline click-to-edit name

## Decisions Made

- **Server component for detail page**: Avoids client-side loading state for initial render; PlaylistEditor takes `initialSongs` prop and manages its own drag state
- **Streaming links open in new tab**: `target="_blank" rel="noopener noreferrer"` on all YouTube/Spotify link buttons
- **Lazy suggestions**: The suggestions panel fetches only when expanded — avoids scoring 200 songs on every page load

## Self-Check: PASSED

- FOUND: src/app/playlists/[id]/page.tsx as server component
- FOUND: src/components/ui/playlist-editor.tsx with dnd-kit, streaming links, remove button
- FOUND: src/components/ui/add-songs-dialog.tsx with search and multi-select
- FOUND: src/components/ui/suggestions-panel.tsx with lazy load and one-click add
- FOUND: src/components/ui/export-menu.tsx with CSV and text export
- FOUND: src/components/ui/playlist-name-editor.tsx with PATCH on edit
- VERIFIED: YouTube and Spotify links have target="_blank"
- VERIFIED: Remove calls DELETE /api/playlists/[id]/songs/[songId]

---
*Phase: 04-playlist-builder*
*Completed: 2026-03-10*
