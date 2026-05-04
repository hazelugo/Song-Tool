# Song Tool — Technical Stack Guide

> **Audience:** Junior developers joining the project. This document explains the full stack, why each technology was chosen, how the pieces connect, and the key architectural decisions that shaped the codebase.

---

## What This App Does

Song Tool is a **music catalog and playlist builder** for working musicians. Users log in, add songs with metadata (BPM, key, chord progressions, lyrics, streaming links), filter their catalog by any combination of those fields, and save the result as a named playlist with drag-and-drop ordering.

The central design constraint is **speed under pressure** — a musician prepping for a gig needs to find the right songs fast. Every architectural decision flows from that.

---

## The Stack at a Glance

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 16 (App Router) | Full-stack: UI pages + API routes in one codebase |
| Language | TypeScript 5 | Type safety end-to-end |
| Database | Supabase (PostgreSQL) | Data store + authentication |
| ORM | Drizzle ORM | Type-safe SQL queries from TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility CSS + copy-paste component library |
| Tables | TanStack Table v8 | Sortable/filterable data tables |
| Drag-and-drop | @dnd-kit | Accessible playlist reordering |
| Forms + Validation | react-hook-form + Zod | Form state + schema validation |
| Testing | Playwright (e2e) + Vitest (unit) | End-to-end and unit coverage |
| Hosting | Vercel | Zero-config Next.js deployment |

---

## Layer 1: Framework — Next.js App Router

### What it is
Next.js is a React framework that handles both the **frontend UI** and **backend API** in one project. There is no separate Express or FastAPI server — the backend lives inside `src/app/api/`.

### App Router vs Pages Router
This project uses the **App Router** (introduced in Next.js 13, default in 15+). The key things to understand:

- **`src/app/` is the routing layer.** Every `page.tsx` file becomes a URL. Every `route.ts` file becomes an API endpoint.
- **Server Components run on the server** — they can query the database directly and never ship their code to the browser. Most pages are Server Components by default.
- **Client Components run in the browser** — anything with interactivity (`useState`, `useEffect`, event handlers) needs `"use client"` at the top of the file.
- **Layouts** (`layout.tsx`) wrap pages — the root layout at `src/app/layout.tsx` sets up the theme provider and sidebar shell that every page shares.

### Route Groups
The `(protected)` folder name in `src/app/(protected)/` is a **route group** — the parentheses mean it doesn't appear in the URL. All routes inside (`/songs`, `/discovery`, `/playlists`, `/chain`) share the protected layout, which checks authentication and redirects to `/login` if the user isn't logged in.

Public routes (no auth required): `/login`, `/metronome`, `/chords`.

### Why Next.js over alternatives
- **One codebase** for frontend and backend eliminates a separate server deployment
- **Vercel-native** — deploying a Next.js app to Vercel is zero-configuration
- **Supabase has official Next.js integration guides** (`@supabase/ssr`) built specifically for the App Router

---

## Layer 2: Language — TypeScript

TypeScript adds static types to JavaScript. The payoff here is catching schema drift early — when the database schema changes, TypeScript errors will surface everywhere that depends on it before the app ever runs.

### The key pattern: `$inferSelect` / `$inferInsert`
Drizzle generates TypeScript types directly from the schema definition:

```typescript
// src/db/schema.ts
export type Song = typeof songs.$inferSelect;       // shape of a DB row
export type InsertSong = typeof songs.$inferInsert; // shape for inserting
export type SongWithTags = Song & { tags: Tag[] };  // extended type used by API
```

These types are shared between the API routes (backend) and React components (frontend). If you add a column to the database, the type updates automatically — TypeScript will tell you every place that needs updating.

---

## Layer 3: Database — Supabase (PostgreSQL)

### What Supabase provides
Supabase is a **managed PostgreSQL host** that also bundles:
- **Authentication** (email/password, JWT sessions) — used for user login
- **Row Level Security** (RLS) — optional database-level access control (not yet enabled; auth is enforced in application code via `requireUser()`)
- **Connection pooling** — the Transaction pool at port 6543 is what the app connects to in production

### Why Supabase was chosen
- Bundles database + auth in one platform — no need for a separate auth service
- PostgreSQL's native `tsvector` handles full-text lyric search without an external service like Algolia
- Free tier covers the app's scale (< 10K songs)
- Built-in support for features that will matter at SaaS scale: RLS policies, per-user row isolation

### Critical gotcha: `prepare: false`
Supabase's shared connection pool runs in **Transaction mode**. PostgreSQL prepared statements require a persistent connection, but Transaction mode tears down connections between queries. The fix is one line in `src/db/index.ts`:

```typescript
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
```

Without this, the app works locally (direct connection) but crashes on Vercel with `"prepared statement already exists"`. This is the most common gotcha with this stack.

---

## Layer 4: ORM — Drizzle

An ORM (Object-Relational Mapper) lets you write database queries in TypeScript instead of raw SQL, with full type safety. Drizzle was chosen over Prisma because:

- **No binary runtime** — Prisma ships a separate query engine binary (~10MB), which slows Vercel cold starts. Drizzle is pure TypeScript.
- **SQL-transparent** — Drizzle generates SQL you can read and reason about. This matters for the complex filter queries in this app (BPM range + key + full-text search combined).

### The schema file: `src/db/schema.ts`
This is the most important file in the project. It defines all 4 database tables as TypeScript objects. When it changes, run `npm run db:generate` → `npm run db:migrate` to apply the changes to the database.

**Tables:**
- `songs` — core catalog: name, BPM, key, key signature, time signature, chord progressions, lyrics, YouTube/Spotify URLs, per-user ownership
- `tags` — freeform labels per song (e.g. "ballad", "opener") — separate table, joined via song ID
- `playlists` — named lists owned by a user
- `playlist_songs` — the join table connecting playlists to songs, with a `position` column for ordering

### Special column types

**`musicalKeyEnum` / `keySignatureEnum` / `timeSignatureEnum` — PostgreSQL enums**
These constrain the allowed values at the database level. A musical key stored as plain text would allow "C major", "c", "Cmaj" — all representing the same key but unmatchable by a filter. The enum enforces exactly 17 values (12 notes with enharmonic equivalents like C# and Db both present).

**`chordProgressions: jsonb`**
Chord progressions are stored as a JSONB array: `["G", "D", "Em", "C"]`. The user types comma-separated chords; the app parses and stores as JSON. This enables an exact membership query (`chordProgressions @> '["Em"]'::jsonb`) with no false positives — unlike text search where "G" would match "Gmaj7".

**`lyricsSearch: tsvector` (generated column)**
This is the engine for full-text lyric search. A `tsvector` is PostgreSQL's internal searchable text representation — it strips stop words, stems words ("loves" → "love"), and stores them for fast lookup via a GIN index. The column is `GENERATED ALWAYS AS` — PostgreSQL updates it automatically whenever `lyrics` changes. The app never writes to it directly.

```sql
-- What the migration creates:
"lyrics_search" tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(lyrics, ''))
) STORED;
CREATE INDEX idx_songs_lyrics_search ON songs USING gin(lyrics_search);
```

**`position: real` (fractional indexing)**
Playlist song ordering uses a floating-point position instead of an integer. Why? When you drag song #3 to sit between songs #1 and #2, fractional indexing lets the app set position = 1.5 with a **single row UPDATE**. Integer ordering would require renumbering every subsequent row. If positions drift too close together (floating point precision), a `rebalanceRanks` function spreads them back out.

**Soft deletes: `deleted_at`**
Songs and playlists are never hard-deleted from the database. Instead, `deleted_at` is set to the current timestamp. All queries include `isNull(songs.deletedAt)` to filter them out. The reason: if a song is "deleted" but still referenced in a playlist, the playlist shouldn't break. Soft deletion preserves referential integrity.

### Migration workflow
```bash
# 1. Edit src/db/schema.ts
# 2. Generate a SQL migration file from the diff:
npm run db:generate   # → drizzle/0001_....sql committed to git
# 3. Apply to database:
npm run db:migrate
```

Never use `drizzle-kit push` in production — it applies changes without generating a migration file, leaving no audit trail.

---

## Layer 5: Authentication — Supabase Auth

Authentication is handled entirely by Supabase. The flow:

1. User submits email + password on `/login`
2. Supabase validates credentials and issues a **JWT stored in an httpOnly cookie**
3. The cookie is sent automatically on every subsequent request — JavaScript cannot read it (XSS protection)
4. Server-side code calls `supabase.auth.getUser()` to validate the JWT with Supabase's auth server

### Two auth patterns in the codebase

**API routes** call `requireUser()` from `src/lib/auth.ts`:
```typescript
const { userId, error: authError } = await requireUser();
if (authError) return authError; // returns 401 if unauthenticated
```

**Page routes** use the `(protected)` layout group at `src/app/(protected)/layout.tsx`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

This is **defense in depth** — both layers enforce auth independently. The layout handles page-level redirects; `requireUser()` handles API-level 401s.

### Important: `getUser()` not `getSession()`
The code always calls `supabase.auth.getUser()`, never `getSession()`. The difference: `getUser()` validates the JWT against Supabase's auth server on every call (cannot be forged). `getSession()` reads the local cookie without server-side validation — not safe for security-critical checks.

### User-scoped data
Every `songs` and `playlists` row has a `user_id UUID` column. Every database query includes `eq(songs.userId, userId)` — a user can only see and modify their own data. This is enforced in application code, not by database RLS policies (which are the next upgrade for SaaS scale).

---

## Layer 6: API Routes — Hono inside Next.js

The API is structured as standard Next.js **Route Handlers** (`route.ts` files), but the `songs` route uses **Hono** as a lightweight router adapter. Hono is a fast, small web framework — it handles routing, middleware, and response helpers without the overhead of a full server framework.

```
src/app/api/
├── songs/route.ts          # GET (filtered list) + POST (create song)
├── songs/[id]/route.ts     # PUT (update) + DELETE (soft delete)
├── songs/bulk/route.ts     # POST (bulk create via CSV import)
├── songs/search/route.ts   # GET (lightweight search endpoint)
├── playlists/route.ts      # GET (list) + POST (create)
├── playlists/[id]/route.ts # GET + PUT + DELETE
├── playlists/[id]/songs/   # Manage songs within a playlist
├── similar/route.ts        # GET harmonic suggestions
├── discovery/route.ts      # GET (stub)
└── health/route.ts         # GET { status: 'ok', db: 'ok' }
```

### Filter query pattern (`GET /api/songs`)
This is the most complex endpoint. It builds a **dynamic SQL WHERE clause** from optional URL query params:

```
GET /api/songs?bpmMin=80&bpmMax=120&key=G&keySig=minor&lyric=sunset
```

Each filter is independently optional. The pattern uses Drizzle's `and(...conditions)` which safely ignores `undefined` values:

```typescript
const conditions: SQL[] = [isNull(songs.deletedAt), eq(songs.userId, userId)];

if (f.bpmMin !== undefined) conditions.push(gte(songs.bpm, f.bpmMin));
if (f.bpmMax !== undefined) conditions.push(lte(songs.bpm, f.bpmMax));
if (f.key)    conditions.push(eq(songs.musicalKey, f.key));
if (f.lyric)  conditions.push(
  sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${f.lyric})`
);
// ...
```

Key detail: lyric search uses `websearch_to_tsquery`, not `to_tsquery`. The difference matters: `to_tsquery("love and war")` throws a Postgres syntax error because the bare space isn't valid FTS syntax. `websearch_to_tsquery` accepts natural language input.

---

## Layer 7: Styling — Tailwind CSS v4 + shadcn/ui

### Tailwind v4
Tailwind v4 (released 2025) moved to **CSS-first configuration**. There is no `tailwind.config.ts` file in this project — all theme customization happens in `src/app/globals.css` using `@theme` directives. This is the current standard.

### shadcn/ui
shadcn/ui is not an installed npm package — it's a **CLI tool that copies component source files into your project**. Running `npx shadcn@latest add button` copies a `button.tsx` file into `src/components/ui/`. You own the code; there's no version lock-in or upstream dependency.

This means all the UI components in `src/components/ui/` (Button, Input, Select, Dialog, Badge, etc.) are part of the codebase and can be freely modified. They're built on **Radix UI primitives** (accessible, unstyled) and styled with Tailwind.

### Dark/light mode
`next-themes` handles theme switching. The root layout wraps the app in `<ThemeProvider attribute="class">` — this adds/removes the `dark` class on the `<html>` element. Tailwind's `dark:` prefix variants respond to that class. The `suppressHydrationWarning` attribute on `<html>` suppresses a React warning caused by the server and client rendering different class values before hydration settles.

---

## Layer 8: Tables — TanStack Table v8

TanStack Table is a **headless** table library — it manages state (sorting, pagination, selection) without rendering any HTML. The rendering is handled by the components in `src/components/songs/song-table.tsx` using shadcn/ui's `Table` component.

Key features used:
- **`getCoreRowModel`** — required baseline; creates the row model from data
- **`getSortedRowModel`** — enables clicking column headers to sort (must be explicitly included — a common missed step)
- **`getPaginationRowModel`** — handles page size and navigation

Sorting is client-side: the API returns all filtered results, and TanStack sorts them in the browser. For a catalog under ~5,000 songs this is fast enough and avoids adding sort parameters to the API.

---

## Layer 9: Drag-and-Drop — @dnd-kit

`@dnd-kit` handles drag-to-reorder in the playlist editor. It's accessibility-first (keyboard navigation, screen reader support) and touch-compatible.

The implementation uses an **activation constraint** (the drag doesn't start until the pointer moves a few pixels). This prevents accidental reorders when a user just wants to scroll.

When a drag completes:
1. The client updates its local state optimistically (instant UI feedback)
2. It sends `PUT /api/playlists/[id]/songs` with the full new song order as an array of IDs
3. The server deletes all existing `playlist_songs` rows and re-inserts them with sequential positions in a single transaction

Why `@dnd-kit` over alternatives: `react-beautiful-dnd` was deprecated by Atlassian in 2023. `@dnd-kit` is the current community standard for accessible drag-and-drop in React.

---

## Layer 10: Forms — react-hook-form + Zod

### Zod
Zod defines **validation schemas** in TypeScript. One schema validates both the UI form and the API endpoint — the same rules apply in both places:

```typescript
// src/lib/validations/song.ts
export const songSchema = z.object({
  name: z.string().min(1),
  bpm: z.number().int().min(1).max(500),
  musicalKey: z.enum(MUSICAL_KEYS),
  // ...
})
export type SongFormData = z.infer<typeof songSchema>; // TypeScript type from schema
```

### react-hook-form
react-hook-form manages form state with uncontrolled inputs (no re-render on every keystroke). It integrates with Zod via `@hookform/resolvers` — the Zod schema handles all validation, and errors surface automatically in the form UI.

### Filter param validation
The filter schema in `src/lib/validations/filter.ts` validates URL query params on the API side. It uses `z.coerce.number()` to convert the string `"80"` from a URL param into the number `80` safely — no manual `parseInt` calls scattered through route handlers.

---

## Layer 11: Domain Logic — Camelot Wheel

The **Camelot Wheel** is a DJ/music production concept for harmonic mixing. Keys that are adjacent on the wheel sound good played together; incompatible keys clash. The wheel assigns each key a number (1–12) and letter (A = minor, B = major).

`src/lib/camelot.ts` implements this:
- Maps all 17 enharmonic key spellings to Camelot positions
- `getKeyCompatibility()` returns a score: 3 = same key, 2 = adjacent/relative, 0 = incompatible
- Used by `GET /api/similar` to rank which songs in the catalog are harmonically compatible with a seed song

The Discovery and Chain pages use this to surface "songs that would flow well after this one" — the core differentiator of the product vs. a generic playlist tool.

---

## Layer 12: Testing

### Playwright (e2e)
Playwright runs automated browser tests against a running app. Tests are in `tests/e2e/`. They simulate real user flows: adding a song, filtering, creating a playlist. Run with `npm run test:e2e`.

The global auth setup creates a test user session once and reuses it across all e2e tests — this avoids re-logging in on every test run.

### Vitest (unit)
Vitest handles unit tests for pure logic: the Camelot wheel functions, filter validation, chord parsing. Run with `npm run test:unit`.

---

## Data Flow: A Request End-to-End

Here's what happens when a user filters songs by BPM + lyric keyword:

```
1. User types in filter inputs on /songs or /discovery
   → URL search params update (useSearchParams / debounced fetch)

2. Browser sends: GET /api/songs?bpmMin=80&bpmMax=120&lyric=sunset

3. songs/route.ts:
   a. requireUser() validates the JWT cookie → returns userId
   b. Zod filterSchema parses and validates the query params
   c. Dynamic conditions array built: [deletedAt IS NULL, userId = ?, bpm >= 80, bpm <= 120, lyricsSearch @@ websearch_to_tsquery('english', 'sunset')]
   d. Drizzle executes: SELECT ... FROM songs WHERE AND(...conditions)
   e. Returns JSON array of matching songs with their tags

4. React re-renders the song table with new data
   TanStack Table applies any active client-side sort

5. User clicks a column header to sort → TanStack sorts in-browser, no API call
```

---

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Auth-gated pages
│   │   ├── layout.tsx        # Redirects to /login if not authed
│   │   ├── songs/page.tsx
│   │   ├── discovery/page.tsx
│   │   ├── playlists/[id]/page.tsx
│   │   └── chain/page.tsx    # Harmonic chain builder
│   ├── api/                  # All API routes
│   ├── login/page.tsx
│   ├── metronome/page.tsx    # Public utility
│   ├── chords/page.tsx       # Public utility
│   └── layout.tsx            # Root: ThemeProvider + SidebarProvider
├── components/
│   ├── ui/                   # shadcn/ui + custom shared components
│   ├── songs/                # Song-specific components
│   └── discovery/            # Discovery/chain components
├── db/
│   ├── index.ts              # Drizzle client (single export: `db`)
│   └── schema.ts             # ALL table definitions — most important file
└── lib/
    ├── auth.ts               # requireUser() helper
    ├── camelot.ts            # Camelot Wheel harmonic logic
    ├── supabase/             # client.ts + server.ts (two separate clients)
    └── validations/          # Zod schemas for songs, filters, playlists
drizzle/                      # SQL migration files (committed to git)
drizzle.config.ts             # Drizzle Kit configuration
```

---

## Key Decisions and Why

### Why two Supabase clients?
`src/lib/supabase/server.ts` uses `createServerClient` from `@supabase/ssr` — it reads cookies via Next.js's `cookies()` function, which only works in Server Components and Route Handlers.

`src/lib/supabase/client.ts` uses `createBrowserClient` — it works in Client Components (`"use client"`) where `cookies()` isn't available.

Never swap them. Using the server client in a browser component crashes; using the browser client on the server won't have access to the request cookies and will always appear unauthenticated.

### Why JSONB for chord progressions, not a separate table?
A normalized `chords` table with a `song_chords` join table would be architecturally "correct" but completely unnecessary at this scale. JSONB array storage allows:
- Simple insert/update (replace the array)
- Exact membership queries (`@>` operator)
- Substring search across all chords (`::text ILIKE '%Em%'`)

A separate table would add 3x the complexity with no practical benefit for a catalog under 10K songs.

### Why fractional position instead of integer for playlist ordering?
Integer positions require renumbering every subsequent row when inserting between two items. Fractional (float) positions allow setting `position = 1.5` with a single UPDATE. At playlist scale (typically 10–50 songs) this is a meaningful difference in transaction complexity.

### Why filter state in URL params?
Filter state on the `/songs` page lives in URL search params (`?bpmMin=80&key=G`). This means:
- Filters survive page refresh
- Filtered views are bookmarkable and shareable
- The browser's back button restores previous filter state

An in-memory `useState` approach would lose state on navigation.

### Why client-side sort, not server-side?
A filtered catalog typically returns 5–200 songs. Sorting 200 items in the browser is instantaneous. Adding sort params to the API would require URL state, additional query complexity, and interactions with pagination. The current approach is faster to develop and fast enough to run.

---

## Common Pitfalls for New Developers

| Mistake | Effect | Fix |
|---------|--------|-----|
| Forgetting `prepare: false` on Postgres client | Crashes on Vercel, works locally | Always `postgres(url, { prepare: false })` |
| Using `to_tsquery(userInput)` for lyric search | 500 errors on multi-word queries | Use `websearch_to_tsquery(userInput)` |
| Using INNER JOIN for tag filtering | Duplicate song rows when tags match | Use EXISTS subquery |
| Using `getSession()` instead of `getUser()` | Session validation bypassed | Always `supabase.auth.getUser()` |
| Omitting `getSortedRowModel` from TanStack config | Sort state toggles but rows don't reorder | Add `getSortedRowModel: getSortedRowModel()` |
| Using `drizzle-kit push` on production DB | Schema changes are unversioned | Only `generate` + `migrate` |
| Adding `NEXT_PUBLIC_` prefix to `DATABASE_URL` | Secret exposed in browser bundle | Server secrets never get `NEXT_PUBLIC_` |
| Modifying a shadcn/ui file and expecting it to update | shadcn components are owned by the project | You own `src/components/ui/` — edit freely |

---

## Environment Variables

| Variable | Where Used | Notes |
|----------|-----------|-------|
| `DATABASE_URL` | `src/db/index.ts` (server only) | Supabase Transaction pool URL — never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (browser + server) | Public — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser + server) | Public — safe to expose; limits access via RLS |

Set all three in Vercel Dashboard → Project Settings → Environment Variables before deploying.

---

## Current Gaps (v1.0 Known Issues)

These are known and documented — not surprises:

1. **Tag filter has no UI control** — the backend supports filtering by tag (`EXISTS` subquery on `tags` table) but the filter panel on `/songs` doesn't render the tag input. The `FILTER_KEYS` array in `song-filters.tsx` omits `"tag"`.

2. **`GET /api/discovery` is an orphaned stub** — returns `{ aiAvailable: true }` but no component calls it. Safe to ignore or remove.

3. **`GET /api/songs/[id]` has no GET handler** — the route file only exports `PUT` and `DELETE`. Not currently breaking since nothing fetches a single song by ID, but a gap for future consumers.

---

*Last updated: 2026-05-04 — v1.0 shipped 2026-04-11 — live at https://haze-song-tool.vercel.app*
