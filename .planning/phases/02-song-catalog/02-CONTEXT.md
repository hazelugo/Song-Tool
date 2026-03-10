# Phase 2: Song Catalog - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Full CRUD for songs with all musical metadata fields. Users can add, view, edit, and delete songs. The song library is the foundation on which discovery and playlists are built — those are separate phases.

Requirements: SONG-01, SONG-02, SONG-03, SONG-04, SONG-05, SONG-06

</domain>

<decisions>
## Implementation Decisions

### Song Form Layout
- Slide-out sheet (right side) — Sheet component already installed, no new dependency needed
- Same sheet for both Add and Edit: empty on add, pre-filled on edit
- "Add Song" button lives at the top of the song list page
- Lyrics field is collapsed by default behind an "Add lyrics" toggle — keeps the form compact since lyrics can be very long
- All other fields (name, BPM, key, key signature, chord progressions, URLs, tags) visible by default in the sheet

### Tag Input UX
- Chip/pill input: user types a tag, presses Enter, it becomes a pill with an × to remove
- No autocomplete or suggestions in v1 — free entry only
- Normalization on save: lowercase, trim whitespace, deduplicate per song (e.g. "Ballad" → "ballad"; duplicates dropped)
- Tags visible in the song table as colored pills (not hidden until edit)

### Song Table Design
- Default columns: Name, BPM, Key, Key Signature, Tags
- Chord progressions, lyrics, and URLs are accessible by opening the sheet — not shown in the table
- 25 rows per page, paginator below the table
- Click anywhere on a row to open the edit sheet (full-row click target — no separate edit button)
- Delete action lives inside the edit sheet at the bottom, with a double-confirm dialog (soft protection against accidental deletion)

### Empty State
- Centered message ("No songs yet" or similar) with an "Add your first song" button
- No illustration — clean and functional

### Claude's Discretion
- Exact Tailwind styling, typography, and spacing
- react-hook-form + Zod validation implementation details
- TanStack Table configuration and column definition patterns
- Chord progressions field: textarea or custom chip input (CSV input parsed to JSONB array on save)
- Exact pagination component design

</decisions>

<specifics>
## Specific Ideas

- Aesthetic reference: Notion/Linear — clean and minimal, not heavy like music production software (carried from Phase 1)
- Double-confirm on delete was explicitly decided in Phase 1 and carries into this phase
- Chord progressions storage decision (Phase 1): comma-separated input → JSONB array on save (`["G", "D", "Em", "C"]`)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/sheet.tsx` — slide-out sheet component, ready to use for the add/edit song form
- `components/ui/button.tsx` — primary action button for "Add Song" trigger
- `components/ui/input.tsx` — text inputs for name, BPM, URLs
- `components/ui/skeleton.tsx` — loading skeleton already available for table loading state
- `components/ui/sidebar.tsx`, `components/app-sidebar.tsx` — nav shell already wired to `/songs` route

### Established Patterns
- Tailwind v4 + shadcn/ui v4: styling uses the existing component tokens and class patterns
- `SidebarMenuButton render={<Link href=... />}` pattern for nav items (Phase 1 discovery)
- `ThemeProvider` wraps root layout — all new components get dark mode for free
- Drizzle ORM: all DB access via typed Drizzle queries against Supabase (postgres driver with `prepare: false`)
- Next.js 15 App Router: API routes in `src/app/api/`, page components in `src/app/songs/`

### Integration Points
- `src/db/schema.ts` — `songs` and `tags` tables already defined with correct types; `Song`, `Tag`, `InsertSong`, `InsertTag` types exported
- `src/app/songs/` directory exists (placeholder page) — Phase 2 fills this with real UI
- `src/app/api/` directory exists — song CRUD routes go here (`/api/songs`, `/api/songs/[id]`)
- Musical key enum (`musicalKeyEnum`) and key signature enum (`keySignatureEnum`) already in schema — use for dropdown options

### Not Yet Installed (needs adding)
- `react-hook-form` — form state and validation
- `zod` — schema validation (also needed for API route input validation)
- TanStack Table (`@tanstack/react-table`) — song list table

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 2 scope

</deferred>

---

*Phase: 02-song-catalog*
*Context gathered: 2026-03-09*
