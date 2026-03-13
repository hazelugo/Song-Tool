# Roadmap: Song Tool

## Overview

Four phases from empty repo to a working music database and playlist builder. Phase 1 lays the foundation (schema, hosting, project scaffolding) that every other phase depends on. Phase 2 delivers the song catalog — add, edit, delete, and view songs with all musical metadata. Phase 3 delivers discovery — the filter-sort engine that is the product's core value. Phase 4 completes the workflow — saving filtered results as named playlists with drag-and-drop ordering and streaming links. v1 is a shared open database (no auth); authentication and multi-tenancy ship in v2.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffolding, database schema, and Vercel deployment (completed 2026-03-09)
- [x] **Phase 2: Song Catalog** - Full CRUD for songs with all musical metadata fields
- [x] **Phase 3: Discovery** - Filter and sort engine — find songs by shared musical properties
- [ ] **Phase 4: Playlist Builder** - Save, view, reorder, and use playlists from filtered results (IN PROGRESS)

## Phase Details

### Phase 1: Foundation

**Goal**: A deployed Next.js app on Vercel with the correct database schema — including all four tables, correct column types (JSONB for chord progressions, enum for musical key, tsvector GIN index for FTS, soft-delete column), and a working Supabase connection. No UI beyond a health-check page.
**Depends on**: Nothing (first phase)
**Requirements**: None directly — this phase is infrastructure that all other phases depend on. Schema decisions here determine whether the product's core filtering feature works at all.
**Success Criteria** (what must be TRUE):

1. Visiting the live Vercel URL returns a working web page (not a 404 or build error)
2. All four database tables exist in Supabase with correct column types: `songs.chord_progressions` is JSONB, `songs.musical_key` is a constrained enum, `songs.deleted_at` exists for soft deletes, all PKs are UUIDs
3. Drizzle migration files are committed to the repo and run cleanly against the Supabase database
4. A GIN index on the `songs` tsvector column exists and a test lyric query returns results
   **Plans**: 2 plans

Plans:

- [ ] 01-01-PLAN.md — Next.js 15 project scaffold, nav shell (Songs/Discovery/Playlists sidebar), dark mode, health endpoint, Vercel deploy
- [ ] 01-02-PLAN.md — Drizzle schema (4 tables, JSONB/pgEnum/tsvector/GIN index), migrations to Supabase, health endpoint wired to db

### Phase 2: Song Catalog

**Goal**: Users can add, view, edit, and delete songs with all musical metadata fields. The song library is the foundation on which discovery and playlists are built.
**Depends on**: Phase 1
**Requirements**: SONG-01, SONG-02, SONG-03, SONG-04, SONG-05, SONG-06
**Success Criteria** (what must be TRUE):

1. User can add a song by filling a form with required fields (name, BPM as integer, key from 12-key dropdown, key signature as major/minor, chord progressions as free text) and the song appears in the list
2. User can add optional fields to a song (lyrics, YouTube URL, Spotify URL) and one or more freeform tags (e.g. "opener", "ballad")
3. User can open an existing song, change any field, save, and see the updated values reflected immediately in the song list
4. User can delete a song and it no longer appears in the song list (soft delete — does not break existing playlists)
5. User can see all songs in a paginated table with name, BPM, key, key signature, and tags visible as columns
   **Plans**: 3 plans

Plans:

- [ ] 02-01-PLAN.md — Package installs, Drizzle relations, Zod validation schema, song CRUD API routes, e2e test stubs
- [ ] 02-02-PLAN.md — Song form components (TagInput, SongForm, DeleteConfirm, SongSheet slide-out)
- [ ] 02-03-PLAN.md — SongTable with TanStack pagination, songs page wired end-to-end, e2e tests passing

### Phase 3: Discovery

**Goal**: Users can find songs that share musical DNA by filtering on BPM range, key, key signature, chord progression text, lyric keywords, and tags — with results sortable by any column. This is the product's core value proposition.
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08
**Success Criteria** (what must be TRUE):

1. User can set a BPM range (min and max) and see only songs whose BPM falls within that range (range query, not exact match)
2. User can filter by musical key (dropdown), key signature (major/minor), or chord progression keyword and see only matching songs
3. User can search by lyric keyword or phrase and see songs whose lyrics contain that text (full-text search via tsvector, not ILIKE)
4. User can filter by tag and see only songs with that tag
5. User can apply multiple filters simultaneously and see the AND-combined results (e.g. BPM 80-100 AND key of G AND tag "ballad")
6. User can sort any filtered result set by any column (name, BPM, key, key signature) in ascending or descending order
   **Plans**: 2 plans

Plans:

- [ ] 03-01-PLAN.md — Zod filter schema + extended GET /api/songs with dynamic AND filter conditions (BPM range, key, key sig, chord ILIKE, lyric FTS, tag EXISTS) + e2e test stubs
- [ ] 03-02-PLAN.md — FilterPanel + DiscoveryTable (TanStack sort) + /discovery page wired end-to-end

### Phase 4: Playlist Builder

**Goal**: Users can save any filtered and ordered song list as a named playlist, open saved playlists, reorder songs within them via drag-and-drop, open streaming links, and remove or delete playlists. This completes the filter-sort-drag-save workflow.
**Depends on**: Phase 3
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07
**Success Criteria** (what must be TRUE):

1. User can type a name and save the current filtered and sorted song list as a named playlist — the playlist appears in the playlists list immediately
2. User can open a saved playlist and see all its songs in the saved order, with name, BPM, key, and streaming links visible
3. User can drag songs within an open playlist to a new position and the order persists after page reload (fractional indexing, single-row UPDATE per reorder)
4. User can click a YouTube or Spotify link on any song in a playlist and it opens in a new tab
5. User can remove a song from a playlist without deleting the song from the database
6. User can delete a playlist and it disappears from the playlists list
   **Plans**: TBD

Plans:

- [ ] 04-01: Playlist data layer (playlist CRUD, playlist_songs join table with fractional position, ownership-safe queries)
- [ ] 04-02: Save playlist flow (save button on filter results, name prompt, confirmation)
- [ ] 04-03: Playlist view UI (playlist list, open playlist, song rows with streaming links, remove-from-playlist action, delete playlist)
- [ ] 04-04: Drag-and-drop reorder (dnd-kit sortable, fractional indexing on drop, UI rollback on persist failure)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase               | Plans Complete | Status      | Completed  |
| ------------------- | -------------- | ----------- | ---------- |
| 1. Foundation       | 2/2            | Complete    | 2026-03-10 |
| 2. Song Catalog     | 3/3            | Complete    | -          |
| 3. Discovery        | 2/2            | Complete    | -          |
| 4. Playlist Builder | 1/4            | In Progress | -          |
