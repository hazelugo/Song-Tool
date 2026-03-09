# Phase 1: Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy a Next.js 15 app to Vercel with a correct database schema (4 tables, proper column types), Supabase connection, and a full nav skeleton UI. No feature functionality — just a working foundation for all subsequent phases to build on.

</domain>

<decisions>
## Implementation Decisions

### App Shell Structure
- Full nav skeleton with three sections: **Songs**, **Discovery**, **Playlists** — all phases fill into this structure
- Left sidebar navigation
- Clean/minimal visual aesthetic with a dark mode toggle (system default to light)
- App name: "Song Tool" in the sidebar header
- Placeholder pages for each section (empty state with section name) — no feature UI yet

### Chord Progression Storage
- User input format: comma-separated (e.g. "G, D, Em, C")
- Schema: JSONB array — stored as `["G", "D", "Em", "C"]` (parse comma-separated on save)
- Enables v1 structured matching: `chord_progressions @> '["Em"]'::jsonb` (contains chord)
- No false positives from text search (ILIKE "%G%" would match Gmaj7, G7, etc.)

### Open Access Policy
- v1 is fully open — anyone with the URL can add, edit, and view songs and playlists
- No authentication gate, no URL tokens, no HTTP password
- Deletes (songs, playlists) require a double-confirm dialog (soft protection against accidental deletion)
- Full auth and accounts deferred to v2

### Schema Design (from prior decisions)
- All PKs are UUIDs
- Musical key: constrained enum (12 keys — C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B)
- Key signature: major/minor enum
- `songs.deleted_at` timestamp for soft deletes (deleted songs don't break playlist references)
- `songs.lyrics_search` tsvector generated column with GIN index for full-text lyric search
- `playlist_songs.position` uses fractional indexing (float) — single-row UPDATE per drag reorder
- No `user_id` FK on songs or playlists in v1 (shared open database, no ownership)

### Claude's Discretion
- Exact Tailwind/shadcn/ui component choices for nav and layout
- Dark mode implementation (next-themes or CSS variables)
- Exact Drizzle migration file structure
- Supabase project naming and region

</decisions>

<specifics>
## Specific Ideas

- The sidebar should list "Songs", "Discovery", "Playlists" — these are the exact section names
- Clean/minimal aesthetic like Notion or Linear — not heavy like music production software
- Dark mode toggle should be accessible from the sidebar (not buried in settings)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — this phase establishes the patterns all subsequent phases follow

### Integration Points
- Supabase connection: will be initialized in `src/lib/supabase.ts` or equivalent
- Drizzle schema: will live in `src/db/schema.ts`
- Nav layout: will be a root layout component wrapping all pages

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 1 scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-09*
