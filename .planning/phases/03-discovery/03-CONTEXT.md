# Phase 3: Discovery - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the filter and sort engine — the product's core value proposition. Users find songs that share musical DNA by filtering on BPM range, key, key signature, chord progression text, lyric keywords, and tags, with results sortable by any column.

Requirements: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08

</domain>

<decisions>
## Implementation Decisions

### Filter Architecture
- Server-side filtering: extend existing `GET /api/songs` to accept filter query params
- Dynamic AND filter array using Drizzle's `and(...conditions)` — conditions not pushed (absent params) are safely ignored
- Zod `safeParse` for filter params — invalid values silently ignored, no 422 errors for filter requests
- BPM filter: `gte(bpmMin)` + `lte(bpmMax)` — always a range, never exact match
- Musical key: `eq(musicalKey, key)` using existing `musicalKeyEnum` values
- Chord keyword: `chordProgressions::text ILIKE '%keyword%'` — cast JSONB to text, then ILIKE
- Lyric FTS: `websearch_to_tsquery` (NOT `to_tsquery`) — handles raw user input without FTS syntax errors
- Tag filter: EXISTS subquery against `tags` table — avoids row duplication from JOIN when multiple tags match

### Sort
- Client-side with TanStack Table `getSortedRowModel()` — dataset is small enough (under 500 songs) that sorting in-browser avoids URL/API complexity

### UI Approach (Deviation from original plan)
- Filter controls (`SongFilters` component) placed on the **Songs page** `/songs` (not the Discovery page) — reused for both song management and discovery use case
- `/discovery` page became an AI-powered natural language search interface (`prompt` → `POST /api/discovery`)
- Note: `/api/discovery` endpoint was not implemented in Phase 3; Discovery AI search is deferred

### Filter State Management
- URL searchParams — bookmarkable, no external state lib, works with Next.js App Router
- `useSearchParams` hook + `router.replace` to update filter params
- Text inputs debounced at 300ms to avoid excessive API calls

</decisions>

<specifics>
## Specific Ideas

- `websearch_to_tsquery` chosen specifically because raw user input ("love song") would throw with `to_tsquery`
- EXISTS subquery for tag filter avoids row duplication when a song has multiple matching tags
- Chord ILIKE against JSONB::text is safe for v1 scale; v2 can add `@>` containment queries for exact matching

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 2)
- `src/app/api/songs/route.ts` — existing GET handler to extend with filter params
- `src/lib/validations/song.ts` — MUSICAL_KEYS const reusable for filter dropdowns
- `src/components/songs/song-table.tsx` — SongTable already has TanStack Table; getSortedRowModel to add for sort
- All shadcn UI components needed (Input, Select, Label, Button, Badge, Separator) already installed

### Integration Points
- `src/db/schema.ts` — `songs.lyricsSearch` tsvector GIN column already exists; `musicalKey`/`keySignature` enums already exist; `chordProgressions` is JSONB
- Phase 2 SongFilters will live on `/songs` page, covering Phase 3 filter requirements
- `/discovery` page reserved for AI natural language search (future)

### Not Yet Installed
- None — all required packages already present from Phase 2

</code_context>

<deferred>
## Deferred Ideas

- `/api/discovery` POST endpoint (AI natural language search) — implementation deferred to Phase 4+
- Chord containment queries using JSONB `@>` operator — ILIKE::text sufficient for v1

</deferred>

---

*Phase: 03-discovery*
*Context gathered: 2026-03-10*
