# Phase 2: Song Catalog - Research

**Researched:** 2026-03-09
**Domain:** Next.js 15 App Router CRUD — forms, tables, API routes, Drizzle ORM
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Song Form Layout**
- Slide-out sheet (right side) — Sheet component already installed, no new dependency needed
- Same sheet for both Add and Edit: empty on add, pre-filled on edit
- "Add Song" button lives at the top of the song list page
- Lyrics field is collapsed by default behind an "Add lyrics" toggle — keeps the form compact since lyrics can be very long
- All other fields (name, BPM, key, key signature, chord progressions, URLs, tags) visible by default in the sheet

**Tag Input UX**
- Chip/pill input: user types a tag, presses Enter, it becomes a pill with an × to remove
- No autocomplete or suggestions in v1 — free entry only
- Normalization on save: lowercase, trim whitespace, deduplicate per song (e.g. "Ballad" → "ballad"; duplicates dropped)
- Tags visible in the song table as colored pills (not hidden until edit)

**Song Table Design**
- Default columns: Name, BPM, Key, Key Signature, Tags
- Chord progressions, lyrics, and URLs are accessible by opening the sheet — not shown in the table
- 25 rows per page, paginator below the table
- Click anywhere on a row to open the edit sheet (full-row click target — no separate edit button)
- Delete action lives inside the edit sheet at the bottom, with a double-confirm dialog (soft protection against accidental deletion)

**Empty State**
- Centered message ("No songs yet" or similar) with an "Add your first song" button
- No illustration — clean and functional

### Claude's Discretion
- Exact Tailwind styling, typography, and spacing
- react-hook-form + Zod validation implementation details
- TanStack Table configuration and column definition patterns
- Chord progressions field: textarea or custom chip input (CSV input parsed to JSONB array on save)
- Exact pagination component design

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 2 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SONG-01 | User can add a song with required fields: name, BPM (integer), key (dropdown of 12 keys), key signature (major/minor dropdown), chord progressions (free text) | react-hook-form + Zod v4 schema validation; shadcn Select for dropdowns; POST /api/songs with Drizzle insert |
| SONG-02 | User can add optional fields per song: lyrics (long text), YouTube URL, Spotify URL | Optional Zod fields (`.optional()`); Textarea component for lyrics; URL validation with `z.url().optional()` |
| SONG-03 | User can add one or more freeform tags to a song (e.g. "opener", "ballad", "crowd-pleaser") | Controlled tag state array; Enter-key chip input pattern; tags table insert in same transaction as song |
| SONG-04 | User can edit any field of an existing song | Same sheet pre-filled via `defaultValues`; PUT /api/songs/[id] with Drizzle update + tag reconciliation |
| SONG-05 | User can delete a song from the database | Soft delete: `SET deleted_at = NOW()`; double-confirm Dialog inside sheet; no FK cascade breaks playlists |
| SONG-06 | User can view all songs in a paginated table with key metadata columns visible | TanStack Table v8 client-side pagination; 25 rows/page via `initialState.pagination.pageSize = 25`; GET /api/songs returns all non-deleted songs + their tags |
</phase_requirements>

---

## Summary

Phase 2 builds the complete song CRUD on top of Phase 1's schema and nav shell. The three major surfaces are: (1) a songs API layer (`GET /api/songs`, `POST /api/songs`, `PUT /api/songs/[id]`, `DELETE /api/songs/[id]`), (2) a TanStack Table v8 data table with client-side pagination at 25 rows per page, and (3) a slide-out Sheet form handling both add and edit with react-hook-form + Zod v4.

The key complexity points are: tag management (insert/delete rows in the `tags` table alongside song saves), the chord progressions field (textarea input that serializes to JSONB `string[]` on save), and the delete flow (soft delete via `deletedAt` timestamp with a double-confirm Dialog). All three packages needed (react-hook-form, @hookform/resolvers, @tanstack/react-table) plus two shadcn components (select, table) must be installed as the first task in Wave 0.

**Primary recommendation:** Client-side data fetching with `useState`/`useEffect` (or a simple fetch wrapper) — no TanStack Query needed for v1. All data lives in one GET call. Mutations call the API and refresh with a re-fetch. This keeps the implementation simple and avoids adding another dependency for v1's single-page use case.

---

## Standard Stack

### Core — Must Install

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-hook-form` | ^7.54+ | Form state, validation integration | Industry standard for React forms; works directly with Zod via resolver |
| `@hookform/resolvers` | ^5.2.2 | Bridge between react-hook-form and Zod | Required to connect Zod v4 schemas to useForm |
| `@tanstack/react-table` | ^8.21.3 | Headless table logic (pagination, row model, column defs) | Standard for data tables in Next.js; shadcn data table guide targets this library |

### Core — Already Installed

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `zod` | 4.3.6 (installed as transitive dep) | Schema validation for form AND API routes | Must add to package.json as direct dependency |
| `lucide-react` | ^0.577.0 | Icons (X for tag pills, ChevronLeft/Right for pagination) | Already installed |

### shadcn Components — Must Add via CLI

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| `table` | `npx shadcn add table` | HTML table primitives used with TanStack Table |
| `select` | `npx shadcn add select` | Musical key and key signature dropdowns |
| `textarea` | `npx shadcn add textarea` | Lyrics field (expanded) and chord progressions |
| `dialog` | `npx shadcn add dialog` | Delete confirmation double-confirm |
| `label` | `npx shadcn add label` | Form field labels |
| `badge` | `npx shadcn add badge` | Tag pills in the table and form |

All use `base-nova` style (base-ui primitives, matching existing Sheet component).

### Already Installed shadcn Components

| Component | File | Phase 2 Use |
|-----------|------|-------------|
| `sheet` | `src/components/ui/sheet.tsx` | Add/edit song form slide-out |
| `button` | `src/components/ui/button.tsx` | "Add Song", Save, Delete triggers |
| `input` | `src/components/ui/input.tsx` | Name, BPM, YouTube URL, Spotify URL fields |
| `skeleton` | `src/components/ui/skeleton.tsx` | Table loading state |

### Installation

```bash
npm install react-hook-form @hookform/resolvers @tanstack/react-table zod
npx shadcn add table select textarea dialog label badge
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── songs/
│   │       ├── route.ts          # GET (list) + POST (create)
│   │       └── [id]/
│   │           └── route.ts      # PUT (update) + DELETE (soft delete)
│   └── songs/
│       └── page.tsx              # Song list page (client component)
├── components/
│   └── songs/
│       ├── song-table.tsx        # TanStack Table + pagination
│       ├── song-sheet.tsx        # Add/edit slide-out form
│       ├── song-form.tsx         # react-hook-form fields
│       ├── tag-input.tsx         # Chip/pill tag input
│       └── delete-confirm.tsx    # Double-confirm dialog
└── lib/
    └── validations/
        └── song.ts               # Zod schemas (shared by form + API)
```

### Pattern 1: Zod v4 Schema (form + API validation)

Define once, use in both the form resolver and API route body validation.

```typescript
// src/lib/validations/song.ts
import { z } from 'zod'

// Musical key values from schema enum
export const MUSICAL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'] as const

export const songSchema = z.object({
  name: z.string().min(1, 'Song name is required').max(255),
  bpm: z.number({ error: 'BPM must be a number' }).int().min(1).max(500),
  musicalKey: z.enum(MUSICAL_KEYS, { error: 'Select a key' }),
  keySignature: z.enum(['major', 'minor'], { error: 'Select major or minor' }),
  chordProgressions: z.string(),  // raw textarea input — parsed to array on submit
  lyrics: z.string().optional(),
  youtubeUrl: z.string().url({ error: 'Invalid YouTube URL' }).optional().or(z.literal('')),
  spotifyUrl: z.string().url({ error: 'Invalid Spotify URL' }).optional().or(z.literal('')),
  tags: z.array(z.string()),  // managed separately in form state
})

export type SongFormValues = z.infer<typeof songSchema>
```

**Zod v4 note:** The `error` property replaces `message` in v4. `z.string().min(1, { error: '...' })` is the v4 idiom. The `import { z } from 'zod'` still works in v4.3.6 (root export is v4).

### Pattern 2: react-hook-form with zodResolver

```typescript
// src/components/songs/song-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { songSchema, type SongFormValues } from '@/lib/validations/song'

export function SongForm({ defaultValues, onSubmit }: SongFormProps) {
  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: defaultValues ?? {
      name: '',
      bpm: undefined,
      musicalKey: undefined,
      keySignature: undefined,
      chordProgressions: '',
      lyrics: '',
      youtubeUrl: '',
      spotifyUrl: '',
      tags: [],
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* fields */}
    </form>
  )
}
```

**Key:** Pass `defaultValues` for edit mode — react-hook-form pre-fills correctly.

### Pattern 3: TanStack Table with Client-Side Pagination

```typescript
// src/components/songs/song-table.tsx
'use client'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SongTable({ data, onRowClick }: SongTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  })

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.def, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </>
  )
}
```

### Pattern 4: Column Definitions

```typescript
const columns: ColumnDef<SongWithTags>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'bpm',
    header: 'BPM',
  },
  {
    accessorKey: 'musicalKey',
    header: 'Key',
  },
  {
    accessorKey: 'keySignature',
    header: 'Key Sig.',
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue('keySignature')}</span>
    ),
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags: Tag[] = row.getValue('tags')
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((t) => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}
        </div>
      )
    },
  },
]
```

### Pattern 5: Next.js 15 API Route — params as Promise

```typescript
// src/app/api/songs/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // Next.js 15: params is a Promise
) {
  const { id } = await params  // MUST await in Next.js 15
  const body = await request.json()
  // validate with songSchema.parse(body), then update
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // soft delete: SET deleted_at = NOW()
}
```

### Pattern 6: Drizzle ORM — Songs with Tags Query

```typescript
// GET /api/songs — fetch all non-deleted songs with their tags
import { db } from '@/db'
import { songs, tags } from '@/db/schema'
import { isNull, eq } from 'drizzle-orm'

const result = await db
  .select()
  .from(songs)
  .where(isNull(songs.deletedAt))

// Then fetch tags separately and group by song_id (or use Drizzle relational queries)
const allTags = await db
  .select()
  .from(tags)
  .where(inArray(tags.songId, result.map(s => s.id)))
```

**Alternative — Drizzle relational API (cleaner):**
```typescript
const songsWithTags = await db.query.songs.findMany({
  where: isNull(songs.deletedAt),
  with: { tags: true },
  orderBy: [desc(songs.createdAt)],
})
```

### Pattern 7: Soft Delete

```typescript
// DELETE /api/songs/[id] — soft delete only
import { eq } from 'drizzle-orm'

await db
  .update(songs)
  .set({ deletedAt: new Date() })
  .where(eq(songs.id, id))
```

The `playlist_songs.song_id` FK has no cascade (confirmed Phase 1) — soft-deleted songs remain accessible in playlists.

### Pattern 8: Tag Management on Save (Insert/Delete)

Tags are a separate table — on edit, reconcile the diff:

```typescript
// On song update: delete old tags, insert new tags
await db.transaction(async (tx) => {
  // Update the song
  await tx.update(songs).set(songData).where(eq(songs.id, id))

  // Delete all existing tags
  await tx.delete(tags).where(eq(tags.songId, id))

  // Insert new tags (normalized)
  const normalizedTags = [...new Set(tagNames.map(t => t.toLowerCase().trim()))]
  if (normalizedTags.length > 0) {
    await tx.insert(tags).values(
      normalizedTags.map(name => ({ songId: id, name }))
    )
  }
})
```

This delete-all-then-reinsert pattern is simpler than diffing for v1. Tags table has no business logic beyond name and FK.

### Pattern 9: Chord Progressions — Textarea to JSONB

User types: `G, D, Em, C` or `G D Em C` (accept both comma and space separated).

```typescript
// On submit: parse textarea value to string[]
function parseChordProgressions(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

// On load: convert string[] back to display string
function formatChordProgressions(chords: string[]): string {
  return chords.join(', ')
}
```

### Pattern 10: Tag Chip Input

A controlled component using React state. NOT a react-hook-form field — manage tags separately and pass to the submit handler.

```typescript
function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const normalized = inputValue.toLowerCase().trim()
      if (!value.includes(normalized)) {
        onChange([...value, normalized])
      }
      setInputValue('')
    }
  }

  const removeTag = (tag: string) => onChange(value.filter(t => t !== tag))

  return (
    <div className="flex flex-wrap gap-1 border rounded-md p-2 min-h-10">
      {value.map(tag => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button type="button" onClick={() => removeTag(tag)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? 'Add tag, press Enter' : ''}
        className="flex-1 outline-none text-sm bg-transparent min-w-20"
      />
    </div>
  )
}
```

### Pattern 11: Delete Double-Confirm

```typescript
// Inside the edit sheet footer
const [showConfirm, setShowConfirm] = useState(false)

{!showConfirm ? (
  <Button variant="destructive" onClick={() => setShowConfirm(true)}>
    Delete Song
  </Button>
) : (
  <div className="flex gap-2">
    <span className="text-sm text-destructive">Are you sure?</span>
    <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Button>
    <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
  </div>
)}
```

This inline pattern (no modal) keeps it simpler than a Dialog and still provides double-confirmation. A Dialog component is also viable if a more prominent confirmation is desired.

### Anti-Patterns to Avoid

- **Do NOT use server components for the songs page.** The table, sheet open/close, and tag input all require client state. Mark `songs/page.tsx` as `'use client'`.
- **Do NOT forget to `await params`** in Next.js 15 dynamic route handlers — `params` is a Promise.
- **Do NOT use Server Actions** for the song mutations. The CONTEXT.md established REST API routes (`/api/songs`, `/api/songs/[id]`). Route Handlers are the pattern.
- **Do NOT query deleted songs.** Always filter with `where(isNull(songs.deletedAt))` in GET routes.
- **Do NOT render the entire song list without the TanStack `getPaginationRowModel`.** All 1000 songs would render without it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom state + error objects | react-hook-form + zodResolver | Handles touched state, blur/submit validation, error clearing, nested field errors |
| Dropdown primitives | `<select>` HTML element | shadcn Select (base-ui) | Accessible, keyboard-navigable, styled to match app design tokens |
| Table pagination | Manual slice/index math | TanStack `getPaginationRowModel` | Built-in `getCanNextPage`, `getPageCount`, page size management |
| URL validation | Regex | `z.url()` from Zod | Handles all edge cases; already installed |
| Tag deduplication | Manual `Array.includes` comparison | `new Set(...)` after normalize | Handles case differences after `.toLowerCase()` normalization |

**Key insight:** The form + table stack (react-hook-form + TanStack Table) is the standard pairing in the Next.js/shadcn ecosystem. The shadcn documentation explicitly builds data tables on TanStack Table.

---

## Common Pitfalls

### Pitfall 1: Zod v4 Error API Change

**What goes wrong:** Using `z.string().min(1, 'Song name is required')` (v3 style shorthand) in Zod v4 — this still works but the object form changed from `{ message: '...' }` to `{ error: '...' }`.
**Why it happens:** Zod v4 unified error customization with a single `error` param, replacing `message`, `invalid_type_error`, and `required_error`.
**How to avoid:** Use `z.string().min(1, { error: 'Song name is required' })` for consistent v4 style. Plain string shorthand (e.g. `.min(1, 'required')`) still works in v4.
**Warning signs:** TypeScript errors when using `{ message: '...' }` — it's no longer the correct shape.

### Pitfall 2: Next.js 15 Params Must Be Awaited

**What goes wrong:** `const { id } = params` in a route handler throws a runtime error.
**Why it happens:** Next.js 15 made `params` a `Promise<{ id: string }>` for streaming support.
**How to avoid:** Always use `const { id } = await params` in dynamic route handlers (`[id]/route.ts`).
**Warning signs:** TypeScript error on `params.id` without await, or runtime error "params is not iterable."

### Pitfall 3: Tags Not Included in GET Response

**What goes wrong:** The `songs` table has no `tags` column — tags are in a separate table. A plain `db.select().from(songs)` returns no tag data.
**Why it happens:** Tags are a one-to-many relation in a separate `tags` table.
**How to avoid:** Use Drizzle relational queries (`db.query.songs.findMany({ with: { tags: true } })`) OR join + group in SQL. The Drizzle relational API requires the schema to define `relations()` — confirm or add this before writing the GET handler.
**Warning signs:** Empty tags array on every song despite data in DB.

### Pitfall 4: react-hook-form `defaultValues` and Undefined

**What goes wrong:** Opening the edit sheet sometimes shows empty fields or stale data.
**Why it happens:** react-hook-form caches `defaultValues` on mount. If the sheet component doesn't unmount between add/edit, `reset()` must be called explicitly.
**How to avoid:** Call `form.reset(defaultValues)` inside a `useEffect` when the `song` prop changes, OR key the component on the song ID (`<SongForm key={song?.id ?? 'new'} />`).
**Warning signs:** Edit form shows data from the previously viewed song.

### Pitfall 5: BPM Input Type Coercion

**What goes wrong:** HTML `<input type="number">` returns a string value; Zod `z.number()` fails because `"120"` is not a number.
**Why it happens:** react-hook-form passes string values from HTML inputs by default.
**How to avoid:** Use `z.coerce.number().int()` which coerces the string `"120"` to `120` before validation. OR use `valueAsNumber: true` in the register options.
**Warning signs:** BPM field always fails validation even when a number is entered.

### Pitfall 6: Tag Chips — Enter Key Submits Form

**What goes wrong:** Pressing Enter inside the tag input field submits the entire form instead of adding a chip.
**Why it happens:** Enter key propagates to the wrapping `<form>` submit handler.
**How to avoid:** Call `e.preventDefault()` in the tag input `onKeyDown` handler before calling `onChange`.
**Warning signs:** Form submits when user presses Enter to add a tag.

### Pitfall 7: Drizzle Relations Not Defined

**What goes wrong:** `db.query.songs.findMany({ with: { tags: true } })` throws a runtime error.
**Why it happens:** Drizzle relational queries require explicit `relations()` definitions in the schema. The current `schema.ts` does not define `relations()`.
**How to avoid:** Add relations to `schema.ts` before using the relational API, OR use an explicit join + group instead.
**Warning signs:** TypeScript error on `.findMany({ with: { tags: true } })` — `tags` not recognized as a relation.

---

## Code Examples

### Drizzle Relational Query Setup (needed if using `with: { tags: true }`)

```typescript
// Add to src/db/schema.ts
import { relations } from 'drizzle-orm'

export const songsRelations = relations(songs, ({ many }) => ({
  tags: many(tags),
}))

export const tagsRelations = relations(tags, ({ one }) => ({
  song: one(songs, { fields: [tags.songId], references: [songs.id] }),
}))
```

### GET /api/songs — Return SongsWithTags

```typescript
// src/app/api/songs/route.ts
import { db } from '@/db'
import { songs } from '@/db/schema'
import { isNull } from 'drizzle-orm'

export async function GET() {
  const result = await db.query.songs.findMany({
    where: isNull(songs.deletedAt),
    with: { tags: true },
    orderBy: (songs, { desc }) => [desc(songs.createdAt)],
  })
  return Response.json(result)
}
```

### POST /api/songs — Create Song + Tags

```typescript
// src/app/api/songs/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = songApiSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { tags: tagNames, chordProgressions: rawChords, ...songData } = parsed.data
  const chordProgressions = parseChordProgressions(rawChords)

  const song = await db.transaction(async (tx) => {
    const [newSong] = await tx.insert(songs).values({ ...songData, chordProgressions }).returning()
    const normalizedTags = [...new Set(tagNames.map(t => t.toLowerCase().trim()))].filter(Boolean)
    if (normalizedTags.length > 0) {
      await tx.insert(tags).values(normalizedTags.map(name => ({ songId: newSong.id, name })))
    }
    return newSong
  })

  return Response.json(song, { status: 201 })
}
```

### PUT /api/songs/[id] — Update Song + Tags

```typescript
// src/app/api/songs/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Next.js 15: must await
  const body = await request.json()
  const parsed = songApiSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { tags: tagNames, chordProgressions: rawChords, ...songData } = parsed.data
  const chordProgressions = parseChordProgressions(rawChords)

  await db.transaction(async (tx) => {
    await tx.update(songs).set({ ...songData, chordProgressions }).where(eq(songs.id, id))
    await tx.delete(tags).where(eq(tags.songId, id))
    const normalizedTags = [...new Set(tagNames.map(t => t.toLowerCase().trim()))].filter(Boolean)
    if (normalizedTags.length > 0) {
      await tx.insert(tags).values(normalizedTags.map(name => ({ songId: id, name })))
    }
  })

  return Response.json({ ok: true })
}
```

### DELETE (Soft) /api/songs/[id]

```typescript
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.update(songs).set({ deletedAt: new Date() }).where(eq(songs.id, id))
  return Response.json({ ok: true })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod v3 `{ message: '...' }` error param | Zod v4 `{ error: '...' }` unified param | Zod v4 (2025) | Only cosmetic in simple cases; matters for `invalid_type_error` / `required_error` which are removed |
| `@hookform/resolvers` v3 (Zod v3 only) | `@hookform/resolvers` v5.2.2 (Zod v4 + v3) | June 2025 | Must install v5+ to get Zod v4 resolver support |
| Next.js 14 `params` as sync object | Next.js 15 `params` as `Promise<{...}>` | Next.js 15 (Oct 2024) | All dynamic route handlers must `await params` |
| Radix UI shadcn components | Base UI (base-nova) shadcn components | Jan 2026 shadcn release | This project uses `base-nova` style — use `npx shadcn add` which auto-selects base-ui |
| `zod/v4` import path during transition | `zod` root export (is v4 in 4.x) | Zod 4.0+ stable | `import { z } from 'zod'` gives v4; `zod/v4` path also works |

**Deprecated/outdated:**
- Zod `required_error` and `invalid_type_error` object options: removed in v4, replaced by unified `error` param
- `@hookform/resolvers` v3.x: does not support Zod v4 — install v5.2.2

---

## Open Questions

1. **Drizzle Relations Definition**
   - What we know: The `schema.ts` defines tables but no `relations()` calls
   - What's unclear: Whether the planner should add `relations()` to `schema.ts` as a Wave 0 task or use plain join queries instead
   - Recommendation: Add `relations()` in Wave 0 — the relational API is cleaner and needed by Phase 3 discovery filtering anyway

2. **SongWithTags Type**
   - What we know: `Song` type exists; `Tag` type exists; there's no combined `SongWithTags` type
   - What's unclear: Where this type lives
   - Recommendation: Define `export type SongWithTags = Song & { tags: Tag[] }` in `src/db/schema.ts` or `src/types/index.ts`

3. **Lyrics Toggle Implementation**
   - What we know: Lyrics should be collapsed behind an "Add lyrics" toggle in the sheet
   - What's unclear: Whether `showLyrics` state should be local to the form or reset when closing the sheet
   - Recommendation: Local `useState` inside the form component; reset via form key change pattern

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | `playwright.config.ts` (exists) |
| Quick run command | `npm run test:e2e -- --project=chromium tests/e2e/songs.spec.ts` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONG-01 | Add song with required fields; appears in list | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "add song"` | ❌ Wave 0 |
| SONG-02 | Add song with optional lyrics, YouTube URL, Spotify URL | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "optional fields"` | ❌ Wave 0 |
| SONG-03 | Add one or more freeform tags; visible as pills in table | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "tags"` | ❌ Wave 0 |
| SONG-04 | Edit any song field; updated values appear in table | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "edit song"` | ❌ Wave 0 |
| SONG-05 | Delete song; no longer in list; soft delete (deletedAt set) | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "delete song"` | ❌ Wave 0 |
| SONG-06 | Songs paginated table; 25 rows per page; next/prev works | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "pagination"` | ❌ Wave 0 |

**Note on test type:** All requirements are UI/user-flow behaviors best covered by e2e tests. There is no Jest/Vitest unit test setup in this project — only Playwright. API-level validation (Zod schema logic) is exercised indirectly through e2e tests.

### Sampling Rate

- **Per task commit:** `npm run test:e2e -- tests/e2e/health.spec.ts` (existing passing tests must stay green)
- **Per wave merge:** `npm run test:e2e` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/songs.spec.ts` — covers SONG-01 through SONG-06
- [ ] No unit test framework setup needed — project uses Playwright e2e only

---

## Sources

### Primary (HIGH confidence)

- Existing codebase (`src/db/schema.ts`, `src/components/ui/sheet.tsx`, `package.json`) — confirmed installed packages, enum values, existing component APIs
- [TanStack Table v8 Pagination Guide](https://tanstack.com/table/v8/docs/guide/pagination) — `initialState.pagination.pageSize`, `getCoreRowModel`, `getPaginationRowModel`, navigation methods
- [shadcn Select component (base-ui)](https://ui.shadcn.com/docs/components/base/select) — `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` imports and usage
- [shadcn Dialog component (base-ui)](https://ui.shadcn.com/docs/components/base/dialog) — Dialog destructive action pattern
- [Zod v4 release notes](https://zod.dev/v4) — error API breaking changes, import path, `z.enum`, `z.object` stability

### Secondary (MEDIUM confidence)

- [@hookform/resolvers GitHub releases](https://github.com/react-hook-form/resolvers/releases) — v5.2.2 confirmed as latest with Zod v4 support (added in v5.1.0, June 2025)
- [Next.js 15 async params](https://nextjs.org/docs/messages/sync-dynamic-apis) — `params` is a Promise; must `await params`
- [shadcn January 2026 base-ui changelog](https://ui.shadcn.com/docs/changelog/2026-01-base-ui) — full base-ui component coverage confirmed

### Tertiary (LOW confidence)

- WebSearch: Drizzle soft delete `isNull(deletedAt)` pattern — cross-verified with official Drizzle filters docs
- WebSearch: Tag chip/pill input Enter-key pattern — standard React controlled input pattern, no library needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from npm/GitHub, package.json verified
- Architecture: HIGH — patterns drawn from official docs (TanStack, shadcn, Zod, Next.js 15)
- Pitfalls: HIGH — Zod v4 error API, Next.js 15 async params, react-hook-form defaultValues stale state are all verified/documented breaking changes
- Validation architecture: HIGH — Playwright config and existing spec file examined directly

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable libraries; Next.js 15 / Zod v4 / TanStack v8 are stable, not fast-moving)
