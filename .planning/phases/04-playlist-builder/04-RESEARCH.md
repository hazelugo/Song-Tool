# Phase 4: Playlist Builder - Research

**Researched:** 2026-03-10
**Domain:** dnd-kit drag-and-drop, fractional indexing, Drizzle playlist queries, Camelot harmonic wheel, Next.js dynamic routes
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAY-01 | User can save a filtered/ordered song list as a named playlist | `POST /api/playlists` with name + song IDs + initial positions from PlaylistBuilder component |
| PLAY-02 | User can open a saved playlist and see songs in saved order with streaming links | `GET /api/playlists/[id]` with `with: { songs: { with: { song: true }, orderBy: asc(position) } }`; streaming links rendered from song.youtubeUrl / song.spotifyUrl |
| PLAY-03 | User can drag songs to a new position and order persists after reload | dnd-kit `SortableContext` + `arrayMove` on drag end; `PUT /api/playlists/[id]/songs` with updated positions; `generateRank(prev, next)` for fractional midpoint |
| PLAY-04 | User can click YouTube or Spotify link and it opens in new tab | `target="_blank" rel="noopener"` on anchor tag; links from song.youtubeUrl and song.spotifyUrl |
| PLAY-05 | User can remove a song from a playlist without deleting the song | `DELETE /api/playlists/[id]/songs/[songId]` — deletes from `playlistSongs` join table only; `songs` row untouched |
| PLAY-06 | User can delete a playlist and it disappears | `DELETE /api/playlists/[id]` — soft delete (sets deletedAt); playlist list excludes soft-deleted rows |
</phase_requirements>

---

## Summary

Phase 4 builds the complete playlist workflow. Two separate components handle playlist creation vs. management: `PlaylistBuilder` (inline, for creating new playlists from search results) and `PlaylistEditor` (on the playlist detail page, for managing existing playlists). The data layer is already partially in place from Phase 1 schema — `playlists` and `playlistSongs` tables exist with the correct column types including fractional position.

The primary technical challenge is drag-and-drop with persistent position ordering. dnd-kit is the recommended library (smaller than react-beautiful-dnd, actively maintained, works with React 19). Fractional indexing via `generateRank(prev, next)` avoids rewriting all positions on every reorder — only the moved item's row is updated.

A bonus feature — Camelot harmonic compatibility suggestions — was planned as an enhancement. The Camelot Wheel maps each of the 17 enharmonic keys to a number (1–12) and letter (A=minor, B=major). Compatible keys are: same position (exact match), same number different letter (relative major/minor), or adjacent number same letter (±1 on the wheel). This scoring logic lives in `src/lib/camelot.ts`.

---

## Standard Stack

### New Packages Required

| Library | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop sensors, DndContext, DragOverlay |
| `@dnd-kit/sortable` | ^10.0.0 | useSortable hook, SortableContext, verticalListSortingStrategy, arrayMove |
| `@dnd-kit/utilities` | ^3.2.2 | CSS.Transform.toString helper |

### Already Installed (No New Installs)

| Library | Purpose |
|---------|---------|
| `drizzle-orm` | Playlist CRUD queries, JOIN with songs |
| `zod` | Validate create/update request bodies |
| `next` | Dynamic routes for /playlists/[id] |
| All shadcn UI components | Dialog, Button, Input, Badge, DropdownMenu already installed |

---

## Key Technical Decisions

### Fractional Indexing
- `position` stored as `real` (PostgreSQL float) in `playlistSongs`
- `generateRank(prev, next)` returns `(prev + next) / 2` for inserting between two items
- `rebalanceRanks(items)` resets all positions to `(index+1) * 10000` when precision degrades
- On drag end: `arrayMove` for optimistic UI, then `PUT /api/playlists/[id]/songs` with full ordered songId array; server recalculates sequential positions

### dnd-kit Pattern
- `DndContext` wraps the sortable list
- `SortableContext` with `verticalListSortingStrategy` and `items={songs.map(s => s.id)}`
- Each song row uses `useSortable({ id: song.id })`
- `DragOverlay` renders a ghost copy of the dragging row for smooth visual feedback
- Keyboard sensor + Pointer sensor for accessibility

### Playlist Routes
- `PATCH /api/playlists/[id]` for rename (name field only, minimal surface area)
- `PUT /api/playlists/[id]/songs` for reorder (accepts full ordered songId array, recalculates positions server-side)
- `POST /api/playlists/[id]/songs` for adding songs (accepts songId array, appends at end)

### Camelot Suggestions
- `GET /api/playlists/[id]/suggestions` — computes playlist average BPM + dominant key; queries catalog excluding playlist songs; scores each candidate by BPM ±15 (1 pt) + Camelot compatibility (2-3 pts); returns top 10 sorted by score
