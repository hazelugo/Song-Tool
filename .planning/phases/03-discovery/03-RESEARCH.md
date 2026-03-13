# Phase 3: Discovery - Research

**Researched:** 2026-03-10
**Domain:** Drizzle ORM parameterized filtering, PostgreSQL FTS (tsvector), TanStack Table sorting, Next.js 15 filter state management
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User can filter songs by BPM range (set minimum and maximum BPM values) | `gte(songs.bpm, min)` + `lte(songs.bpm, max)` combined with `and()` in dynamic filter array |
| DISC-02 | User can filter songs by musical key (select from 12-key dropdown) | `eq(songs.musicalKey, key)` with existing `musicalKeyEnum` values; reuse `MUSICAL_KEYS` const from validations |
| DISC-03 | User can filter songs by key signature (major or minor) | `eq(songs.keySignature, sig)` with existing `keySignatureEnum`; "major" / "minor" values |
| DISC-04 | User can filter songs by chord progression (keyword text match against the chord progressions field) | `sql\`${songs.chordProgressions}::text ILIKE ${\`%${keyword}%\`}\`` — JSONB column cast to text then ILIKE |
| DISC-05 | User can search songs by lyric keyword or phrase (full-text search) | `sql\`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${term})\`` — GIN-indexed tsvector column, no ILIKE |
| DISC-06 | User can filter songs by tag | EXISTS subquery: `exists(db.select({id:sql\`1\`}).from(tags).where(and(eq(tags.songId, songs.id), ilike(tags.name, tag))))` |
| DISC-07 | User can apply multiple filters simultaneously and see AND-combined results | Dynamic filter array: `const conditions: SQL[] = []; ... db.select().from(songs).where(and(...conditions, isNull(songs.deletedAt)))` |
| DISC-08 | User can sort filtered results by any column (BPM, name, key, etc.) in ascending or descending order | TanStack Table `getSortedRowModel` client-side OR column map + `asc()`/`desc()` in Drizzle; client-side is simpler for v1 |
</phase_requirements>

---

## Summary

Phase 3 builds the filter-sort engine that is the product's core value proposition. It has two clearly bounded plans: (1) a server-side query layer that accepts BPM range, key, key signature, chord keyword, lyric FTS, and tag as URL query parameters and returns an AND-combined filtered result set, and (2) a filter panel UI on the `/discovery` page wired to that query layer with sort controls.

The foundation is already in place: the `songs` table has a GIN-indexed `lyricsSearch` tsvector generated column, `musicalKey` and `keySignature` as enums, `chordProgressions` as JSONB, and a separate `tags` table. Phase 2 built the complete query infrastructure for fetching songs. Phase 3 extends the GET endpoint with filter params — or adds a dedicated `/api/songs/search` route — and adds TanStack Table client-side sorting on the discovery page.

The most important technical choices for Phase 3 are: (a) use `websearch_to_tsquery` (not `to_tsquery`) for lyric FTS because user input won't be formatted with FTS syntax operators; (b) use `sql\`${songs.chordProgressions}::text ILIKE '%keyword%'\`` for chord keyword matching against the JSONB array (safe and simple for v1); (c) use an EXISTS subquery for tag filtering rather than a JOIN that would duplicate rows; and (d) keep sort client-side with TanStack Table `getSortedRowModel` rather than adding a sort API parameter — the dataset is small enough (under 500 songs) that fetching all filtered results and sorting in-browser is fast and avoids URL/API complexity.

**Primary recommendation:** Extend the existing `GET /api/songs` to accept filter query params, use the dynamic `and(...conditions)` Drizzle pattern with `undefined`-safe conditions, keep sort client-side with TanStack Table. No new npm packages required beyond what Phase 2 installed.

---

## Standard Stack

### Core — Already Installed (No New Installs Needed)

| Library | Version | Purpose | Why It Covers This Phase |
|---------|---------|---------|--------------------------|
| `drizzle-orm` | ^0.45.1 | Parameterized filter queries (`and`, `gte`, `lte`, `eq`, `ilike`, `exists`, `sql`) | Full filter operator suite is built-in |
| `@tanstack/react-table` | ^8.21.3 | Client-side sort with `getSortedRowModel` | Already installed; `getSortedRowModel` is the standard sort model |
| `zod` | ^4.3.6 | Validate and coerce filter query params from URL strings | Already in use for song form; same validators apply to filter params |
| `next` | 16.1.6 | URL `searchParams` for filter state; `useSearchParams` hook client-side | Built into Next.js App Router — no extra library needed |

### No New shadcn Components Required

All needed shadcn components for filter UI are already installed:
- `select.tsx` — key and key signature dropdowns
- `input.tsx` — BPM min/max number inputs, lyric keyword text input, chord keyword input, tag filter input
- `badge.tsx` — tag filter pill display (optional)
- `button.tsx` — "Clear filters" action
- `label.tsx` — form field labels
- `separator.tsx` — visual divider between filter panel and results

### Installation

```bash
# No new packages needed for Phase 3.
# All dependencies are installed from Phase 2.
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── songs/
│   │       └── route.ts          # Extend GET to accept filter query params
│   └── discovery/
│       └── page.tsx              # Discovery page — filter panel + result table
├── components/
│   └── discovery/
│       ├── filter-panel.tsx      # Filter controls (BPM range, key, key sig, chord, lyric, tag)
│       └── discovery-table.tsx   # TanStack Table with sort + filtered data display
└── lib/
    └── validations/
        └── filter.ts             # Zod schema for filter query params
```

### Pattern 1: Dynamic AND Filter Query (Drizzle)

Build a conditions array, push each filter as a SQL expression when the param is present, combine with `and()`. Drizzle ignores `undefined` entries in `and()`.

```typescript
// src/app/api/songs/route.ts (extended GET)
import { db } from '@/db'
import { songs, tags } from '@/db/schema'
import { and, isNull, gte, lte, eq, ilike, exists, sql, asc, desc } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const bpmMin  = searchParams.get('bpmMin')
  const bpmMax  = searchParams.get('bpmMax')
  const key     = searchParams.get('key')
  const keySig  = searchParams.get('keySig')
  const chord   = searchParams.get('chord')
  const lyric   = searchParams.get('lyric')
  const tag     = searchParams.get('tag')

  const conditions: SQL[] = [isNull(songs.deletedAt)]

  if (bpmMin) conditions.push(gte(songs.bpm, parseInt(bpmMin, 10)))
  if (bpmMax) conditions.push(lte(songs.bpm, parseInt(bpmMax, 10)))
  if (key)    conditions.push(eq(songs.musicalKey, key as typeof songs.musicalKey.dataType))
  if (keySig) conditions.push(eq(songs.keySignature, keySig as typeof songs.keySignature.dataType))

  // JSONB chord progressions — cast column to text and ILIKE keyword
  if (chord) {
    conditions.push(sql`${songs.chordProgressions}::text ILIKE ${'%' + chord + '%'}`)
  }

  // FTS lyric search — GIN-indexed tsvector column
  if (lyric) {
    conditions.push(
      sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${lyric})`
    )
  }

  // Tag filter — EXISTS subquery (avoids row duplication from JOIN)
  if (tag) {
    const tagSubquery = db
      .select({ id: sql<number>`1` })
      .from(tags)
      .where(and(eq(tags.songId, songs.id), ilike(tags.name, tag)))
    conditions.push(exists(tagSubquery))
  }

  const result = await db.query.songs.findMany({
    where: and(...conditions),
    with: { tags: true },
    orderBy: (songs, { desc }) => [desc(songs.createdAt)],
  })

  return Response.json(result)
}
```

**Source:** [Drizzle ORM Conditional Filters Guide](https://orm.drizzle.team/docs/guides/conditional-filters-in-query) (HIGH confidence — official docs)

### Pattern 2: websearch_to_tsquery for Lyric FTS

Use `websearch_to_tsquery` instead of `to_tsquery` for user input. `to_tsquery` requires FTS syntax operators and throws a Postgres error if the user types something like "love and war" — the word "and" would be treated as the boolean operator but without proper quoting it fails. `websearch_to_tsquery` accepts natural language input.

```typescript
// For lyric keyword: "love and war" → websearch_to_tsquery handles it correctly
sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${lyricTerm})`

// plainto_tsquery is also safe but joins all words with AND implicitly
// websearch_to_tsquery additionally supports: "exact phrase", OR, - (NOT)
// → websearch_to_tsquery is the right choice for user-facing FTS
```

**Source:** [PostgreSQL Documentation: Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html) (HIGH confidence — official docs)

### Pattern 3: JSONB Chord Keyword Match

The `chordProgressions` column is `jsonb` (a `string[]`). To do a keyword substring search across all items in the array, cast the entire column to `text` and use ILIKE. This is correct and safe for v1's use case (the array is short, typically 3-8 chords).

```typescript
// Matches if ANY chord in the array contains the keyword as a substring
// e.g. chord="Em7" matches ["Am", "Em7", "D"] because "Em7" appears in the JSON text
sql`${songs.chordProgressions}::text ILIKE ${'%' + chord + '%'}`

// Note: This matches chord name anywhere in the serialized JSON string.
// For v1 this is acceptable — false positives are unlikely with chord notation.
// The Drizzle sql`` template automatically parameterizes the value — no SQL injection risk.
```

**Source:** Drizzle ORM `sql` operator docs + Drizzle docs JSONB guides (MEDIUM confidence — verified pattern from Drizzle docs)

### Pattern 4: Tag EXISTS Subquery

Do NOT use `innerJoin(tags, ...)` for tag filtering. An INNER JOIN returns one row per matching tag — if a song has two tags that both match, the song appears twice in results. Use `exists()` instead.

```typescript
import { exists, and, eq, ilike, sql } from 'drizzle-orm'

const tagSubquery = db
  .select({ id: sql<number>`1` })
  .from(tags)
  .where(
    and(
      eq(tags.songId, songs.id),  // correlated subquery — links to outer songs row
      ilike(tags.name, tagFilter) // case-insensitive exact match (or ILIKE '%tag%' for substring)
    )
  )

conditions.push(exists(tagSubquery))
```

**Source:** [Drizzle ORM - Select parent rows with at least one related child row](https://orm.drizzle.team/docs/guides/select-parent-rows-with-at-least-one-related-child-row) (HIGH confidence — official docs)

### Pattern 5: TanStack Table Client-Side Sort

Sorting is done client-side. The API returns all filtered results; TanStack sorts them in the browser. Given that filtered results are typically under 50-100 songs (and the full dataset is under 500), client-side sort is fast and eliminates sort params from the API.

```typescript
// src/components/discovery/discovery-table.tsx
'use client'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState } from 'react'

export function DiscoveryTable({ data }: { data: SongWithTags[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),   // <-- adds sort capability
    initialState: { pagination: { pageSize: 25 } },
  })

  return (/* ... table JSX ... */)
}
```

**Source:** [TanStack Table v8 Sorting Guide](https://tanstack.com/table/v8/docs/guide/sorting) (HIGH confidence — official docs)

### Pattern 6: Sortable Column Headers

Column definitions trigger sort toggle on header click. The `getIsSorted()` return value drives the sort indicator icon.

```typescript
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const columns: ColumnDef<SongWithTags>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground"
        onClick={column.getToggleSortingHandler()}
      >
        Name
        {column.getIsSorted() === 'asc'  && <ArrowUp className="h-4 w-4" />}
        {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
        {!column.getIsSorted()           && <ArrowUpDown className="h-4 w-4 opacity-40" />}
      </button>
    ),
  },
  {
    accessorKey: 'bpm',
    header: ({ column }) => (
      <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1">
        BPM
        {/* same icon pattern */}
      </button>
    ),
  },
  // musicalKey, keySignature columns similarly
  {
    accessorKey: 'tags',
    header: 'Tags',
    enableSorting: false,  // tags array is not meaningfully sortable
  },
]
```

**Source:** [TanStack Table v8 Sorting APIs](https://tanstack.com/table/v8/docs/api/features/sorting) (HIGH confidence — official docs)

### Pattern 7: Filter State via React useState (v1)

For Phase 3, filter state lives in React `useState` in the discovery page component. When filters change, re-fetch by calling the API with the current filter params. This is the simplest approach and is sufficient for v1.

URL search params are a good-developer-experience improvement but add complexity (nuqs library or manual `useRouter`/`useSearchParams` wiring). Defer URL param persistence to v2 unless explicitly requested.

```typescript
// src/app/discovery/page.tsx
'use client'
import { useState, useEffect } from 'react'

interface FilterState {
  bpmMin: string
  bpmMax: string
  key: string
  keySig: string
  chord: string
  lyric: string
  tag: string
}

const EMPTY_FILTERS: FilterState = {
  bpmMin: '', bpmMax: '', key: '', keySig: '', chord: '', lyric: '', tag: '',
}

export default function DiscoveryPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [songs, setSongs] = useState<SongWithTags[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })

    setIsLoading(true)
    fetch(`/api/songs?${params.toString()}`)
      .then(r => r.json())
      .then(setSongs)
      .finally(() => setIsLoading(false))
  }, [filters])

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} />
      <DiscoveryTable data={songs} isLoading={isLoading} />
    </>
  )
}
```

### Pattern 8: Filter Param Validation (Zod)

The API route validates incoming query params with Zod to safely coerce and bound BPM values. Invalid params are ignored rather than crashing.

```typescript
// src/lib/validations/filter.ts
import { z } from 'zod'
import { MUSICAL_KEYS } from './song'

export const filterSchema = z.object({
  bpmMin: z.coerce.number().int().min(1).max(500).optional(),
  bpmMax: z.coerce.number().int().min(1).max(500).optional(),
  key:    z.enum(MUSICAL_KEYS).optional(),
  keySig: z.enum(['major', 'minor'] as const).optional(),
  chord:  z.string().max(100).optional(),
  lyric:  z.string().max(500).optional(),
  tag:    z.string().max(100).optional(),
})

export type FilterParams = z.infer<typeof filterSchema>
```

### Anti-Patterns to Avoid

- **Do NOT use `to_tsquery` directly with user input.** User input like "love and war" will throw a Postgres syntax error unless correctly formatted. Always use `websearch_to_tsquery` or `plainto_tsquery` for user-provided lyric search terms.
- **Do NOT use ILIKE on the lyrics text column for lyric search.** Requirements spec FTS via tsvector specifically. The GIN index on `lyricsSearch` makes FTS fast; ILIKE on the raw `lyrics` column would do a full table scan.
- **Do NOT use INNER JOIN for tag filtering.** A song with two matching tags would appear twice in results, breaking count and pagination. Use `exists()` subquery instead.
- **Do NOT add a sort API param.** Sort client-side with TanStack `getSortedRowModel`. The dataset is small enough that this is faster and far simpler than adding sort params to the query layer.
- **Do NOT use the relational `db.query.songs.findMany()` API with complex computed WHERE conditions involving subqueries.** When the WHERE clause involves `exists()` or `sql` expressions referencing outer columns, use `db.select().from(songs).where(...)` instead and join tags separately, or use `findMany` with the `where` callback but include a raw SQL expression.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FTS user input parsing | Custom tokenizer / string splitting | `websearch_to_tsquery('english', input)` | Handles quotes, OR, NOT, stemming, stop words correctly |
| JSONB array text search | Loop over elements client-side | `sql\`${songs.chordProgressions}::text ILIKE ...\`` | Server-side, uses existing JSONB column, one query |
| Column sort logic | Custom array sort comparators | TanStack `getSortedRowModel` | Handles string/number/date types, multi-column sort, asc/desc toggle |
| Dynamic WHERE construction | String concatenation of SQL | Drizzle `and(...conditions)` with undefined-safe array | Parameterized, type-safe, injection-proof |
| Filter param type coercion | `parseInt(raw, 10)` with no validation | Zod `z.coerce.number().int().min(1).max(500)` | Bounds-checks, handles empty string, prevents negative BPM |
| Tag filtering | Substring match on denormalized tag string | EXISTS subquery against `tags` table | Tags are in a normalized table; EXISTS is correct and avoids JOIN duplication |

**Key insight:** Drizzle's `and()` operator safely ignores `undefined` values — this is the canonical pattern for dynamic filter queries. Combining this with the `sql` template literal covers all cases this project needs without any custom query builder.

---

## Common Pitfalls

### Pitfall 1: `to_tsquery` Fails on Raw User Input

**What goes wrong:** User types "love song" into the lyric search field. The API calls `to_tsquery('english', 'love song')`. Postgres throws: `ERROR: syntax error in tsquery: "love song"` — the space is not a valid FTS operator.
**Why it happens:** `to_tsquery` requires properly formatted tsquery syntax. Bare words separated by spaces are invalid.
**How to avoid:** Use `websearch_to_tsquery('english', userInput)` always. It converts natural language to a valid tsquery.
**Warning signs:** 500 errors from the API when the lyric search field has multiple words.

### Pitfall 2: INNER JOIN Doubles Rows When Multiple Tags Match

**What goes wrong:** A song tagged "ballad" and "opener" is queried with tag filter "a" (matches both). The INNER JOIN returns the song twice in results.
**Why it happens:** SQL JOIN produces a row per match. Two matching tags = two rows for the same song.
**How to avoid:** Use `exists()` subquery for tag filtering. The subquery checks for existence and returns the song row exactly once.
**Warning signs:** Duplicate song rows in results when filtering by a short tag that matches multiple tags on the same song.

### Pitfall 3: `getSortedRowModel` Not Added to `useReactTable`

**What goes wrong:** Clicking a column header does nothing. The sort indicator state toggles (asc/desc) but rows don't reorder.
**Why it happens:** `getSortedRowModel` must be explicitly passed to `useReactTable`. Without it, sort state is tracked but not applied.
**How to avoid:** Always include `getSortedRowModel: getSortedRowModel()` in the table config alongside `getCoreRowModel`.
**Warning signs:** `column.getIsSorted()` returns 'asc'/'desc' correctly but `table.getRowModel().rows` is unsorted.

### Pitfall 4: BPM Range — Partial Range (Only Min or Only Max)

**What goes wrong:** User sets min BPM to 80 but leaves max empty. The query ignores max, but the UI may mislead the user into thinking the max is unconstrained.
**Why it happens:** Each BPM bound is an independent optional filter. Both, one, or neither can be set.
**How to avoid:** The dynamic filter array handles this correctly — only push `gte` when `bpmMin` is present, only push `lte` when `bpmMax` is present. The UI should make the independence clear (two separate inputs labeled "Min BPM" and "Max BPM").
**Warning signs:** User sets min=80 and gets songs at 200 BPM — expected if max is not set; confusing if UI implies a default max.

### Pitfall 5: JSONB Chord Match — False Positives from Serialized JSON

**What goes wrong:** The chord filter "Em" matches a song whose chord list is `["Em", "G", "D"]` — that's correct. But it would also match `["Em7", "G"]` (substring) and theoretically even `["G", "D"]` if the serialized JSON is `"[\"G\", \"D\"]"` and the search term happens to match the bracket characters (not a real risk for chord names).
**Why it happens:** `::text ILIKE '%Em%'` runs against the full serialized JSON string, not individual array elements. Chord "Em" also appears inside "Em7", "Emaj7", etc.
**How to avoid:** This is acceptable for v1. The chord search is documented as "keyword text match" not "exact chord match." If more precision is needed in v2, use `jsonb_array_elements_text()` in a subquery.
**Warning signs:** Searching for "E" returns songs with any chord starting with E — expected behavior, not a bug for v1.

### Pitfall 6: Filter State Losing Data on Mount

**What goes wrong:** User applies filters, then navigates away and back to `/discovery`. All filters are reset because they live in `useState`.
**Why it happens:** Client-side state in `useState` does not persist across navigation.
**How to avoid:** For v1 this is acceptable — requirements don't specify filter persistence. If needed in future, URL search params or `sessionStorage` can be added. Document this as a known limitation.
**Warning signs:** User complains that filters disappear on navigation.

### Pitfall 7: Empty String Filter Params Hit the API

**What goes wrong:** User types in the lyric field, then clears it. `filters.lyric === ''`. The `useEffect` fires and the API receives `?lyric=`. The API passes the empty string to `websearch_to_tsquery` which returns no results (or an error).
**Why it happens:** Empty string is truthy-falsy edge case — `if (lyric)` handles it correctly but the filter state must check `value !== ''` before including in URLSearchParams.
**How to avoid:** When building URLSearchParams from filter state, skip keys with empty string values: `if (v) params.set(k, v)`. The API route also validates with Zod which will reject empty strings for most filter fields.
**Warning signs:** Lyric search field cleared returns 0 results instead of all results.

---

## Code Examples

Verified patterns from official sources:

### Full GET /api/songs with All Filters

```typescript
// Source: Drizzle ORM Conditional Filters Guide + tsvector generated column guide
import { db } from '@/db'
import { songs, tags } from '@/db/schema'
import { and, isNull, gte, lte, eq, ilike, exists, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { filterSchema } from '@/lib/validations/filter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Parse and validate filter params — Zod coerces strings to numbers, validates enums
  const parsed = filterSchema.safeParse(Object.fromEntries(searchParams))
  const f = parsed.success ? parsed.data : {}

  const conditions: SQL[] = [isNull(songs.deletedAt)]

  if (f.bpmMin !== undefined) conditions.push(gte(songs.bpm, f.bpmMin))
  if (f.bpmMax !== undefined) conditions.push(lte(songs.bpm, f.bpmMax))
  if (f.key)    conditions.push(eq(songs.musicalKey, f.key as any))
  if (f.keySig) conditions.push(eq(songs.keySignature, f.keySig as any))

  if (f.chord) {
    conditions.push(sql`${songs.chordProgressions}::text ILIKE ${'%' + f.chord + '%'}`)
  }

  if (f.lyric) {
    conditions.push(
      sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${f.lyric})`
    )
  }

  if (f.tag) {
    const tagSq = db
      .select({ id: sql<number>`1` })
      .from(tags)
      .where(and(eq(tags.songId, songs.id), ilike(tags.name, f.tag)))
    conditions.push(exists(tagSq))
  }

  const result = await db.query.songs.findMany({
    where: and(...conditions),
    with: { tags: true },
    orderBy: (songs, { desc }) => [desc(songs.createdAt)],
  })

  return Response.json(result)
}
```

### Discovery Table with Sort

```typescript
// Source: TanStack Table v8 Sorting Guide
'use client'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { SongWithTags } from '@/db/schema'

function SortableHeader({ column, label }: { column: any; label: string }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {column.getIsSorted() === 'asc'  && <ArrowUp className="h-3 w-3" />}
      {column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
      {!column.getIsSorted()           && <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  )
}

const columns: ColumnDef<SongWithTags>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
  },
  {
    accessorKey: 'bpm',
    header: ({ column }) => <SortableHeader column={column} label="BPM" />,
  },
  {
    accessorKey: 'musicalKey',
    header: ({ column }) => <SortableHeader column={column} label="Key" />,
  },
  {
    accessorKey: 'keySignature',
    header: ({ column }) => <SortableHeader column={column} label="Key Sig." />,
    cell: ({ row }) => <span className="capitalize">{row.getValue<string>('keySignature')}</span>,
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    enableSorting: false,
  },
]

export function DiscoveryTable({
  data,
  isLoading,
}: {
  data: SongWithTags[]
  isLoading: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  // ... render same as SongTable but with sortable headers
}
```

### Zod Filter Schema

```typescript
// Source: Phase 2 validated pattern + Zod v4 coerce API
import { z } from 'zod'
import { MUSICAL_KEYS } from './song'

export const filterSchema = z.object({
  bpmMin: z.coerce.number().int().min(1).max(500).optional(),
  bpmMax: z.coerce.number().int().min(1).max(500).optional(),
  key:    z.enum(MUSICAL_KEYS).optional(),
  keySig: z.enum(['major', 'minor'] as const).optional(),
  chord:  z.string().max(100).optional(),
  lyric:  z.string().max(500).optional(),
  tag:    z.string().max(100).optional(),
})

export type FilterParams = z.infer<typeof filterSchema>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `to_tsquery(userInput)` raw | `websearch_to_tsquery(userInput)` | PG 11+ (2018) | Safe for untrusted user input; no FTS syntax knowledge required |
| ILIKE `%keyword%` for text search | `tsvector @@ websearch_to_tsquery` | Always preferred; GIN index from Phase 1 | 10-100x faster on indexed column; correct linguistic matching |
| SQL string concat for dynamic WHERE | Drizzle `and(...conditions)` with undefined-safe array | Drizzle ORM design | Type-safe, injection-proof, composable |
| INNER JOIN for existence check | `exists()` subquery | Standard SQL best practice | No row duplication; correct semantics |
| Server-side sort params | TanStack client-side sort (small dataset) | Always valid at this scale | Simpler API; fast in-browser; no pagination/sort interaction complexity |

**Deprecated/outdated:**
- ILIKE on the raw `lyrics` text column for lyric search: bypasses the GIN index — full table scan on every request. Never use this; the schema was explicitly built for tsvector FTS.
- `to_tsquery` for user-facing search inputs: breaks on multi-word queries without FTS syntax. Replaced by `websearch_to_tsquery`.

---

## Open Questions

1. **Should the API filter endpoint be a new route `/api/songs/search` or extend `GET /api/songs`?**
   - What we know: Phase 2 built `GET /api/songs` returning all songs with no filter params. The songs page uses this. If filter params are added to the same route, the songs page behavior is unchanged (no params = no filters = all songs returned).
   - What's unclear: Whether the songs page should also gain filter capability, or whether filter is discovery-only.
   - Recommendation: Extend `GET /api/songs` with optional filter params. No new route needed. The songs page can ignore filters; the discovery page sends them. This avoids code duplication.

2. **Should the discovery results table allow clicking a row to open the edit sheet?**
   - What we know: The songs page has row-click → edit sheet. Phase 3 requirements say nothing about editing from discovery.
   - What's unclear: Whether the discovery table is read-only or includes the edit sheet.
   - Recommendation: Discovery table is read-only for Phase 3 (filter and sort only). Edit access stays on the Songs page. Phase 4 will add "save as playlist" from discovery results.

3. **Chord filter — exact token match or substring?**
   - What we know: The requirements say "keyword text match against the chord progressions field." The JSONB cast + ILIKE approach matches substrings of the full JSON array text.
   - What's unclear: Whether "Em" should match "Em7" (substring) or only exact chord tokens.
   - Recommendation: Substring match (ILIKE `%keyword%`) for v1. It's simpler and the user expectation is lenient matching. Document the behavior in the UI placeholder text ("e.g. Em7, I-IV-V").

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | `playwright.config.ts` (exists) |
| Quick run command | `npm run test:e2e -- --project=chromium tests/e2e/discovery.spec.ts` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | Set BPM min/max; only songs in range appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-01"` | ❌ Wave 0 |
| DISC-02 | Filter by musical key; only matching songs appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-02"` | ❌ Wave 0 |
| DISC-03 | Filter by key signature (major/minor); only matching songs appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-03"` | ❌ Wave 0 |
| DISC-04 | Filter by chord keyword; only songs with that chord text appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-04"` | ❌ Wave 0 |
| DISC-05 | Search by lyric keyword; only songs containing that text appear; FTS (not ILIKE) | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-05"` | ❌ Wave 0 |
| DISC-06 | Filter by tag; only songs with that tag appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-06"` | ❌ Wave 0 |
| DISC-07 | Apply BPM + key + tag simultaneously; only songs matching ALL conditions appear | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-07"` | ❌ Wave 0 |
| DISC-08 | Click BPM column header; rows sort ascending; click again → descending | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-08"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:e2e -- tests/e2e/health.spec.ts` (existing passing tests stay green)
- **Per wave merge:** `npm run test:e2e` (full suite including songs.spec.ts)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/discovery.spec.ts` — covers DISC-01 through DISC-08; must be written before implementation begins so tests can be run against the implementation
- [ ] No framework changes needed — Playwright config already exists and covers the discovery page URL

---

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM Conditional Filters Guide](https://orm.drizzle.team/docs/guides/conditional-filters-in-query) — `and(...conditions)` undefined-safe dynamic filter array pattern
- [Drizzle ORM Select parent rows with EXISTS](https://orm.drizzle.team/docs/guides/select-parent-rows-with-at-least-one-related-child-row) — EXISTS subquery for tag filtering (no row duplication)
- [Drizzle ORM Full-Text Search with Generated Columns](https://orm.drizzle.team/docs/guides/full-text-search-with-generated-columns) — tsvector GIN column query via `sql` template
- [Drizzle ORM sql`` operator](https://orm.drizzle.team/docs/sql) — parameterized raw SQL expressions for JSONB cast + ILIKE, tsvector @@
- [TanStack Table v8 Sorting Guide](https://tanstack.com/table/v8/docs/guide/sorting) — `getSortedRowModel`, `onSortingChange`, `SortingState`, column `getToggleSortingHandler`
- [TanStack Table v8 Sorting APIs](https://tanstack.com/table/v8/docs/api/features/sorting) — `getIsSorted`, `enableSorting`, sort state shape
- [PostgreSQL Documentation: Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html) — `websearch_to_tsquery` vs `to_tsquery` vs `plainto_tsquery` comparison
- Codebase inspection: `src/db/schema.ts`, `src/app/api/songs/route.ts`, `src/lib/validations/song.ts`, `src/components/songs/song-table.tsx`, `package.json` — all confirmed installed, all confirmed patterns from Phase 2

### Secondary (MEDIUM confidence)

- [Drizzle ORM Filters/Operators](https://orm.drizzle.team/docs/operators) — `gte`, `lte`, `eq`, `ilike`, `exists`, `and`, `isNull` operator signatures verified
- [PostgreSQL JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html) — `::text` cast on JSONB for substring search confirmed valid

### Tertiary (LOW confidence)

- WebSearch: `nuqs` library for URL-based filter state — investigated and deferred (adds dependency not warranted for v1 scale)
- WebSearch: dynamic `orderBy` with column map pattern — consistent with Drizzle's documented operator API but specific example not in official guide

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all libraries confirmed installed in package.json
- Architecture (filter query): HIGH — patterns sourced directly from Drizzle official docs with confirmed Drizzle version
- Architecture (FTS): HIGH — tsvector column confirmed in schema.ts; `websearch_to_tsquery` is official PostgreSQL documentation
- Architecture (sort): HIGH — TanStack Table v8 official docs; same library already used in Phase 2
- Pitfalls: HIGH — each pitfall is a concrete failure mode with a specific cause and verified fix

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries: Drizzle 0.45.x, TanStack Table 8.x, Next.js 16.x are all stable releases)
