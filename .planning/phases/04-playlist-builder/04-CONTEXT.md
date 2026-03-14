# Phase 4: Playlist Builder - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can save any song set as a named playlist, view and manage saved playlists, reorder songs via drag-and-drop, open streaming links, add songs to existing playlists, remove songs, and delete playlists. A bonus feature: Camelot harmonic compatibility suggestions surface songs from the catalog that would flow well with the current playlist. This completes the filter-sort-drag-save workflow.

Requirements: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06

</domain>

<decisions>
## Implementation Decisions

### Data Layer
- `playlists` table: id (UUID PK), userId (hardcoded UUID for v1 open access), name (text), createdAt, updatedAt, deletedAt (soft delete)
- `playlistSongs` table: (playlistId, songId) composite PK, position (real/float for fractional indexing)
- Fractional indexing via `src/lib/ranking.ts` — `generateRank(prev, next)` returns midpoint; no full-list rewrite on reorder
- `position` stored as `real` (PostgreSQL) — sufficient precision for fractional indexing at v1 scale

### API Routes
- `GET /api/playlists` — list all playlists for USER_ID, ordered by updatedAt desc
- `POST /api/playlists` — create playlist with optional initial songs (from PlaylistBuilder)
- `GET /api/playlists/[id]` — full playlist with songs + tags, ordered by position
- `PATCH /api/playlists/[id]` — rename playlist (name only)
- `DELETE /api/playlists/[id]` — soft delete (sets deletedAt)
- `POST /api/playlists/[id]/songs` — add songs to existing playlist (appends to end)
- `PUT /api/playlists/[id]/songs` — reorder all songs (full position rewrite on drag drop)
- `DELETE /api/playlists/[id]/songs/[songId]` — remove song from playlist (hard delete from join table)
- `GET /api/playlists/[id]/suggestions` — Camelot-based song suggestions

### Camelot Suggestions (Bonus Feature)
- `src/lib/camelot.ts` — Camelot Wheel mappings (all 17 enharmonic keys → Camelot position); compatibility scoring (3=same key, 2=adjacent/relative, 1=BPM only, 0=incompatible)
- Suggestions API: excludes playlist songs, filters by BPM within ±15 of playlist average, scores by Camelot key compatibility, returns top 10

### UI Architecture
- `PlaylistBuilder` — full-screen inline component for creating a new playlist from a song set; drag-and-drop ordering, name input, save button; used from Songs and Discovery pages
- `PlaylistEditor` — drag-and-drop editor for an existing playlist (dnd-kit sortable); updates position on drag end via PUT /api/playlists/[id]/songs
- `AddSongsDialog` — modal dialog to search and add songs from catalog to an existing playlist
- `SuggestionsPanel` — collapsible panel showing Camelot-compatible songs from catalog; one-click add
- `ExportMenu` — dropdown to export playlist as CSV or text file (client-side blob download)
- `PlaylistNameEditor` — inline click-to-edit name field; PATCH /api/playlists/[id] on save

### Drag-and-Drop
- dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- `verticalListSortingStrategy` for song rows
- DragOverlay for smooth drag ghost rendering
- On drag end: `arrayMove` → `generateRank` for new position → PUT /api/playlists/[id]/songs (full reorder)

</decisions>

<specifics>
## Specific Ideas

- Hardcoded USER_ID `"f47ac10b-58cc-4372-a567-0e02b2c3d479"` for v1 open access — all playlists owned by this UUID
- PlaylistBuilder reused in both Songs page ("Save results as Playlist") and Discovery page
- Export formats: CSV (Name, BPM, Key, Key Sig, Tags) and plain text (one line per song)
- PlaylistNameEditor uses `contentEditable` or an input that appears inline on click

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts` — `playlists` and `playlistSongs` tables already defined with correct types from Phase 1
- `src/components/ui/sheet.tsx`, `dialog.tsx`, `button.tsx`, `input.tsx`, `badge.tsx` — all installed
- `SongTable`, `SongFilters` — reusable in AddSongsDialog search/filter UI
- Fractional indexing pattern established in Phase 1 schema decision

### Integration Points
- Songs page and Discovery page already have "Save results as Playlist" button placeholders from Phase 2/3
- `src/app/playlists/page.tsx` — placeholder page from Phase 1, to be replaced with real UI
- `src/app/playlists/[id]/page.tsx` — to be created as playlist detail page

### New Packages Required
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop

</code_context>

<deferred>
## Deferred Ideas

- `/api/discovery` POST (AI natural language search) — deferred from Phase 3; not in Phase 4 scope
- Authentication and per-user playlists — v2
- Playlist sharing — v2

</deferred>

---

*Phase: 04-playlist-builder*
*Context gathered: 2026-03-10*
