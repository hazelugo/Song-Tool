# Phase 1: Foundation - Research

**Researched:** 2026-03-09
**Domain:** Next.js 15 + Supabase (PostgreSQL) + Drizzle ORM + shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Shell Structure**
- Full nav skeleton with three sections: Songs, Discovery, Playlists — all phases fill into this structure
- Left sidebar navigation
- Clean/minimal visual aesthetic with a dark mode toggle (system default to light)
- App name: "Song Tool" in the sidebar header
- Placeholder pages for each section (empty state with section name) — no feature UI yet

**Chord Progression Storage**
- User input format: comma-separated (e.g. "G, D, Em, C")
- Schema: JSONB array — stored as `["G", "D", "Em", "C"]` (parse comma-separated on save)
- Enables v1 structured matching: `chord_progressions @> '["Em"]'::jsonb` (contains chord)
- No false positives from text search (ILIKE "%G%" would match Gmaj7, G7, etc.)

**Open Access Policy**
- v1 is fully open — anyone with the URL can add, edit, and view songs and playlists
- No authentication gate, no URL tokens, no HTTP password
- Deletes (songs, playlists) require a double-confirm dialog (soft protection against accidental deletion)
- Full auth and accounts deferred to v2

**Schema Design**
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

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 1 scope
</user_constraints>

---

## Summary

Phase 1 establishes the full technical foundation: a deployed Next.js 15 application on Vercel with a Supabase PostgreSQL database managed via Drizzle ORM. The schema decisions made here — particularly JSONB for chord progressions, tsvector generated column for full-text lyric search, and enum constraints for musical key — are load-bearing for all future phases. Getting the schema wrong here means a migration-heavy correction later.

The standard stack (Next.js 15 App Router + Drizzle ORM + Supabase + shadcn/ui) is well-documented and widely adopted. Each piece has official guidance for integration with the others. The primary complexity is in the Drizzle schema definition (tsvector custom type, JSONB, pgEnum) and the Supabase connection pooler configuration (prepared statements must be disabled for Transaction mode).

The UI deliverable for this phase is intentionally minimal: a left sidebar with three nav links (Songs, Discovery, Playlists), a dark mode toggle, and placeholder content pages. shadcn/ui's Sidebar component handles this directly with no custom layout code needed.

**Primary recommendation:** Use the shadcn/ui `sidebar` component for the nav shell, `drizzle-orm/postgres-js` with `prepare: false` for the Supabase pooler connection, and the `customType` tsvector pattern with `generatedAlwaysAs` for the lyric search column. Run `drizzle-kit generate` then `drizzle-kit migrate` (not push) so migration files are committed to git.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | App framework with App Router | Vercel-native, SSR/SSG, App Router is current standard |
| react | 19.x | UI rendering | Required by Next.js 15 |
| typescript | 5.x | Type safety | Non-negotiable for maintainability |
| drizzle-orm | latest (0.36+) | Type-safe PostgreSQL ORM | SQL-like syntax, excellent TypeScript inference, no runtime overhead |
| drizzle-kit | latest | Schema migrations CLI | Paired with drizzle-orm; generates SQL migration files |
| postgres | 3.x | PostgreSQL driver for Node | Used by drizzle-orm/postgres-js; lightweight, no extra config |
| tailwindcss | 4.x | Utility CSS | Included by create-next-app; v4 is CSS-first (no tailwind.config.ts) |
| @shadcn/ui | via CLI | Pre-built accessible components | shadcn/ui components are copy-paste, fully owned — no black box |
| next-themes | 0.4.x | Dark/light mode switching | Official shadcn/ui recommendation for Next.js dark mode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | 16.x | Load .env in non-Next.js scripts | Required for drizzle.config.ts to read DATABASE_URL |
| lucide-react | latest | Icon library | Default icons in shadcn/ui components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| drizzle-orm | Prisma | Prisma uses a separate DIRECT_URL for migrations and a proxy for serverless; Drizzle is simpler with Supabase pooler |
| next-themes | CSS custom properties only | next-themes + shadcn ThemeProvider is the documented path; avoids hydration mismatch |
| shadcn/ui Sidebar | custom sidebar | shadcn/ui Sidebar handles state persistence, collapsible, keyboard shortcut (cmd+b) out of the box |

**Installation:**
```bash
# Create project
npx create-next-app@latest song-tool --ts --tailwind --eslint --app

# Initialize shadcn/ui (handles Tailwind v4 config automatically)
npx shadcn@latest init -t next

# Add sidebar and theme toggle components
npx shadcn@latest add sidebar
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu

# ORM and database
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit tsx

# Dark mode
npm install next-themes
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout: ThemeProvider + SidebarProvider
│   ├── page.tsx            # Root redirect to /songs
│   ├── api/
│   │   └── health/
│   │       └── route.ts    # GET /api/health — returns { status: 'ok', db: 'ok' }
│   ├── songs/
│   │   └── page.tsx        # Placeholder: "Songs" heading
│   ├── discovery/
│   │   └── page.tsx        # Placeholder: "Discovery" heading
│   └── playlists/
│       └── page.tsx        # Placeholder: "Playlists" heading
├── components/
│   ├── app-sidebar.tsx     # AppSidebar component (nav links + dark mode toggle)
│   ├── theme-provider.tsx  # next-themes wrapper (client component)
│   └── ui/                 # shadcn/ui generated components (sidebar, button, etc.)
├── db/
│   ├── index.ts            # Drizzle client: postgres() + drizzle()
│   └── schema.ts           # All table definitions (songs, tags, playlists, playlist_songs)
└── lib/
    └── utils.ts            # shadcn/ui cn() helper (generated by shadcn init)
drizzle/                    # Migration SQL files (committed to git)
drizzle.config.ts           # Drizzle Kit config
.env.local                  # DATABASE_URL (not committed)
```

### Pattern 1: Drizzle Client Initialization
**What:** Single db instance exported from `src/db/index.ts`, imported everywhere that needs DB access.
**When to use:** All server components and route handlers import `db` from this module.

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// CRITICAL: prepare: false required for Supabase Transaction pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle({ client })
```

### Pattern 2: Schema with All Required Column Types
**What:** Single `schema.ts` file defining all four tables with correct Drizzle types.
**When to use:** This is the authoritative schema definition; drizzle-kit generates SQL from it.

```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
//         https://orm.drizzle.team/docs/guides/full-text-search-with-generated-columns
// src/db/schema.ts
import { SQL, sql } from 'drizzle-orm'
import {
  pgTable, pgEnum, uuid, text, integer, real, timestamp,
  jsonb, index, customType, primaryKey
} from 'drizzle-orm/pg-core'

// Custom tsvector type (not natively supported in Drizzle)
export const tsvector = customType<{ data: string }>({
  dataType() { return 'tsvector' },
})

// Enums
export const musicalKeyEnum = pgEnum('musical_key', [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
])

export const keySignatureEnum = pgEnum('key_signature', ['major', 'minor'])

// Songs table
export const songs = pgTable(
  'songs',
  {
    id:               uuid('id').defaultRandom().primaryKey(),
    name:             text('name').notNull(),
    bpm:              integer('bpm').notNull(),
    musicalKey:       musicalKeyEnum('musical_key').notNull(),
    keySignature:     keySignatureEnum('key_signature').notNull(),
    chordProgressions: jsonb('chord_progressions').$type<string[]>().notNull().default([]),
    lyrics:           text('lyrics'),
    youtubeUrl:       text('youtube_url'),
    spotifyUrl:       text('spotify_url'),
    lyricsSearch:     tsvector('lyrics_search')
      .generatedAlwaysAs((): SQL =>
        sql`to_tsvector('english', coalesce(${songs.lyrics}, ''))`
      ),
    createdAt:        timestamp('created_at').defaultNow().notNull(),
    updatedAt:        timestamp('updated_at').defaultNow().notNull(),
    deletedAt:        timestamp('deleted_at'),  // soft delete
  },
  (t) => [
    index('idx_songs_lyrics_search').using('gin', t.lyricsSearch),
  ]
)

// Tags table
export const tags = pgTable('tags', {
  id:     uuid('id').defaultRandom().primaryKey(),
  songId: uuid('song_id').notNull().references(() => songs.id),
  name:   text('name').notNull(),
})

// Playlists table
export const playlists = pgTable('playlists', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),  // soft delete for playlists
})

// Playlist-Songs junction table
export const playlistSongs = pgTable(
  'playlist_songs',
  {
    playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
    songId:     uuid('song_id').notNull().references(() => songs.id),  // no cascade: deleted songs stay in playlists
    position:   real('position').notNull(),  // fractional indexing (float)
  },
  (t) => [
    primaryKey({ columns: [t.playlistId, t.songId] }),
  ]
)
```

### Pattern 3: Health Check Route
**What:** A GET route at `/api/health` that verifies the app and DB are alive.
**When to use:** This is the Phase 1 success-criteria page; also useful for Vercel preview health checks.

```typescript
// Source: https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware
// src/app/api/health/route.ts
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({ status: 'ok', db: 'ok' })
  } catch (error) {
    return Response.json(
      { status: 'error', db: 'unreachable' },
      { status: 503 }
    )
  }
}
```

### Pattern 4: Dark Mode with next-themes
**What:** ThemeProvider wraps the app; a toggle button in the sidebar switches themes.
**When to use:** Required because shadcn/ui components reference CSS variables that change with `dark` class.

```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/components/theme-provider.tsx
"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children, ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            {/* AppSidebar + main content */}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Pattern 5: Sidebar Navigation Shell
**What:** shadcn/ui Sidebar component with three nav links and a dark mode toggle in the footer.
**When to use:** The root layout wraps all pages in this shell.

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/sidebar
// src/components/app-sidebar.tsx
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Music, Search, ListMusic } from "lucide-react"

const navItems = [
  { title: "Songs",      url: "/songs",     icon: Music },
  { title: "Discovery",  url: "/discovery", icon: Search },
  { title: "Playlists",  url: "/playlists", icon: ListMusic },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <span className="font-semibold px-2">Song Tool</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Dark mode toggle goes here */}
      </SidebarFooter>
    </Sidebar>
  )
}
```

### Pattern 6: Drizzle Migration Workflow
**What:** Generate SQL files from schema, commit them, then apply to Supabase.
**When to use:** Every schema change goes through this flow, never `drizzle-kit push` in production.

```bash
# 1. Generate migration SQL from schema diff
npx drizzle-kit generate

# 2. Apply to Supabase (uses DATABASE_URL from .env.local)
npx drizzle-kit migrate

# Result: drizzle/ folder has timestamped .sql files committed to git
```

### Pattern 7: Drizzle Config File
```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',          // migration files directory
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Anti-Patterns to Avoid

- **Using `drizzle-kit push` for the live database:** Push skips migration file generation. Any schema change applied via push is unversioned. Always use `generate` + `migrate` for Supabase.
- **Omitting `prepare: false` on the Supabase pooler connection:** Transaction pool mode rejects prepared statements. Without `prepare: false`, you'll see "prepared statement already exists" errors in production.
- **Using Supabase JS client (`@supabase/supabase-js`) for DB queries:** The project is using Drizzle for type-safe queries. Supabase JS client is only needed for auth features (Phase 2+, which are deferred to v2). Don't add the dependency now.
- **Using `text` type for musical key:** Free text allows "C major", "c", "Cmaj" — all different values for the same key. pgEnum enforces the 12-value contract at the database level.
- **Using integer position for playlist order:** Integer positions require updating multiple rows on reorder. Float fractional indexing (`position real`) allows inserting between two items with a single `UPDATE`.
- **Not adding `suppressHydrationWarning` to `<html>`:** next-themes updates the `html` element after hydration. Without this prop, React logs hydration mismatch warnings on every page load.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar layout with collapse/expand | Custom sidebar component | shadcn/ui `sidebar` | State persistence, keyboard shortcut (cmd+b), responsive behavior, cookie-based open state |
| Dark mode toggle | CSS variable switching | next-themes + shadcn ThemeProvider | Handles SSR hydration mismatch, system preference detection, localStorage persistence |
| Full-text search vector | Custom LIKE queries or search logic | PostgreSQL tsvector generated column + GIN index | Database-native FTS is O(log n) with the GIN index; LIKE is O(n) full scan |
| UUID generation | Custom ID generation | `uuid().defaultRandom()` in Drizzle | Uses PostgreSQL's `gen_random_uuid()` — cryptographically random, no coordination needed |
| Soft delete filter helper | Manually adding `WHERE deleted_at IS NULL` everywhere | Drizzle pgView or consistent `isNull(table.deletedAt)` pattern | Easy to miss a filter; use a view or consistently exported query builder |
| JSONB array validation | Custom TypeScript validator | Drizzle `jsonb().$type<string[]>()` + parsing on write | Type inference at compile time; runtime validation only needed at the API boundary |

**Key insight:** The PostgreSQL feature set covers every "custom" problem in this schema. The entire schema can be expressed in ~80 lines of Drizzle TypeScript with no application-level workarounds.

---

## Common Pitfalls

### Pitfall 1: Supabase Pooler — Transaction Mode and Prepared Statements
**What goes wrong:** `Error: prepared statement "s1" already exists` in production or Vercel functions.
**Why it happens:** Supabase's default shared pooler uses Transaction pool mode, which does not maintain connection state between queries. PostgreSQL prepared statements require a persistent connection. drizzle-orm/postgres-js sends prepared statements by default.
**How to avoid:** Always initialize the postgres client with `{ prepare: false }` when connecting to the Supabase pooler:
```typescript
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
```
**Warning signs:** Works in local development (direct connection) but fails on Vercel.

### Pitfall 2: tsvector Column and Drizzle Migrations
**What goes wrong:** `drizzle-kit generate` may not correctly represent the `tsvector` type or the `GENERATED ALWAYS AS` expression in all versions.
**Why it happens:** tsvector is not a natively supported Drizzle column type — it requires `customType`. Generated columns have additional constraints around the `STORED` keyword.
**How to avoid:** After running `drizzle-kit generate`, review the generated SQL to verify:
1. The column is `"tsvector" GENERATED ALWAYS AS (...) STORED`
2. The GIN index is `USING gin`
3. The expression uses `coalesce` to handle NULL lyrics
**Warning signs:** Migration applies but FTS queries return no results, or the column is created as a plain `text` column.

### Pitfall 3: Tailwind v4 Has No `tailwind.config.ts`
**What goes wrong:** Developers try to add Tailwind configuration in `tailwind.config.ts` and find it has no effect.
**Why it happens:** Tailwind v4 moved to CSS-first configuration. All theming happens in `globals.css` with `@theme` and `@import` directives. `create-next-app` with `--tailwind` now scaffolds v4 configuration.
**How to avoid:** Make all Tailwind theme customizations in `src/app/globals.css`. Do not create `tailwind.config.ts`.
**Warning signs:** Custom colors or spacing defined in `tailwind.config.ts` don't apply.

### Pitfall 4: Environment Variables — NEXT_PUBLIC Prefix
**What goes wrong:** DATABASE_URL or other server-only secrets accidentally exposed to the browser bundle.
**Why it happens:** Any variable prefixed `NEXT_PUBLIC_` is inlined into the client bundle at build time.
**How to avoid:** DATABASE_URL must NOT have the `NEXT_PUBLIC_` prefix. Only the Supabase URL and anon key (if added later) use `NEXT_PUBLIC_`.
**Warning signs:** Vercel build logs show "Using environment variable in client component without NEXT_PUBLIC_ prefix" (opposite problem), or the connection string appears in the browser network tab.

### Pitfall 5: Vercel Deployment Without Environment Variables
**What goes wrong:** Vercel deployment builds but crashes at runtime with "DATABASE_URL is not defined".
**Why it happens:** `.env.local` is gitignored and never deployed. Environment variables must be set manually in Vercel Dashboard > Project Settings > Environment Variables.
**How to avoid:** Before merging to main, add `DATABASE_URL` to Vercel environment variables for Production (and Preview if desired).
**Warning signs:** Health check endpoint returns 503, Vercel function logs show undefined DATABASE_URL.

### Pitfall 6: Migration Output Directory and Supabase
**What goes wrong:** Drizzle generates migrations into `./drizzle/` but Supabase CLI expects `./supabase/migrations/`.
**Why it happens:** The two tools have different default output directories.
**How to avoid:** Either use only `drizzle-kit migrate` (not Supabase CLI) and keep `out: './drizzle'` in drizzle.config.ts, OR change `out` to `'./supabase/migrations'` if using Supabase CLI for deployment. Pick one approach and be consistent.

### Pitfall 7: shadcn/ui Sidebar Requires SidebarProvider at Root
**What goes wrong:** Sidebar state doesn't persist; toggle button has no effect; hydration errors.
**Why it happens:** `SidebarProvider` uses React context and cookies. If it's not at the root layout level, the sidebar state resets on navigation.
**How to avoid:** Put `SidebarProvider` in `app/layout.tsx` wrapping all content, outside any page-specific layouts.
**Warning signs:** Sidebar open/closed state resets when navigating between pages.

---

## Code Examples

### Complete Schema (Production-Ready)
```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
//         https://orm.drizzle.team/docs/guides/full-text-search-with-generated-columns
// src/db/schema.ts
import { SQL, sql } from 'drizzle-orm'
import {
  pgTable, pgEnum, uuid, text, integer, real,
  timestamp, jsonb, index, customType, primaryKey
} from 'drizzle-orm/pg-core'

export const tsvector = customType<{ data: string }>({
  dataType() { return 'tsvector' },
})

export const musicalKeyEnum = pgEnum('musical_key', [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
])
export const keySignatureEnum = pgEnum('key_signature', ['major', 'minor'])

export const songs = pgTable(
  'songs',
  {
    id:                uuid('id').defaultRandom().primaryKey(),
    name:              text('name').notNull(),
    bpm:               integer('bpm').notNull(),
    musicalKey:        musicalKeyEnum('musical_key').notNull(),
    keySignature:      keySignatureEnum('key_signature').notNull(),
    chordProgressions: jsonb('chord_progressions').$type<string[]>().notNull().default([]),
    lyrics:            text('lyrics'),
    youtubeUrl:        text('youtube_url'),
    spotifyUrl:        text('spotify_url'),
    lyricsSearch:      tsvector('lyrics_search')
      .generatedAlwaysAs((): SQL =>
        sql`to_tsvector('english', coalesce(${songs.lyrics}, ''))`
      ),
    createdAt:         timestamp('created_at').defaultNow().notNull(),
    updatedAt:         timestamp('updated_at').defaultNow().notNull(),
    deletedAt:         timestamp('deleted_at'),
  },
  (t) => [
    index('idx_songs_lyrics_search').using('gin', t.lyricsSearch),
  ]
)

export const tags = pgTable('tags', {
  id:        uuid('id').defaultRandom().primaryKey(),
  songId:    uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const playlists = pgTable('playlists', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const playlistSongs = pgTable(
  'playlist_songs',
  {
    playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
    songId:     uuid('song_id').notNull().references(() => songs.id),
    position:   real('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.playlistId, t.songId] }),
  ]
)

// TypeScript type exports for use in application code
export type Song = typeof songs.$inferSelect
export type InsertSong = typeof songs.$inferInsert
export type Playlist = typeof playlists.$inferSelect
export type InsertPlaylist = typeof playlists.$inferInsert
```

### Soft Delete Query Pattern
```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
import { isNull } from 'drizzle-orm'

// Always filter active records
const activeSongs = await db
  .select()
  .from(songs)
  .where(isNull(songs.deletedAt))

// Soft delete a song
await db
  .update(songs)
  .set({ deletedAt: sql`now()` })
  .where(eq(songs.id, songId))
```

### Full-Text Search Query
```typescript
// Source: https://orm.drizzle.team/docs/guides/postgresql-full-text-search
import { sql } from 'drizzle-orm'

const results = await db
  .select()
  .from(songs)
  .where(
    sql`${songs.lyricsSearch} @@ plainto_tsquery('english', ${searchTerm})`
  )
```

### JSONB Chord Progression Contains Query
```typescript
// "Contains chord" query — exact string match, no false positives
const songsWithChord = await db
  .select()
  .from(songs)
  .where(
    sql`${songs.chordProgressions} @> ${JSON.stringify([chord])}::jsonb`
  )
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` | CSS-first `@theme` in globals.css | Tailwind v4 (2025) | No config file needed; theming in CSS |
| `npx shadcn-ui@latest` | `npx shadcn@latest` | 2024 | Shorter package name; supports v4 |
| Prisma for Supabase | Drizzle ORM | Growing adoption 2024-2025 | No separate proxy needed; simpler pooler setup |
| Supabase `@supabase/supabase-js` for all queries | Drizzle ORM for queries, supabase-js for auth only | 2024 | Better TypeScript inference; no generated types needed |
| Integer position for ordering | Float / fractional indexing | Established pattern | Single-row UPDATE for reorder operations |

**Deprecated/outdated:**
- `next/font` with external Google Fonts CDN: Next.js 15 inlines fonts automatically; no CDN needed
- `pages/` directory: Phase 1 uses App Router (`app/`) exclusively — do not mix routing strategies

---

## Open Questions

1. **Musical key enum — enharmonic equivalents (C#/Db)**
   - What we know: The enum includes both spellings (C# and Db) as separate values
   - What's unclear: When a user selects "C#", should filtering also return songs in "Db"? This is a Phase 3 concern, not Phase 1.
   - Recommendation: Store both as separate enum values for now. Phase 3 can add enharmonic equivalence logic in the query layer without a schema change.

2. **Drizzle generated column migration compatibility**
   - What we know: The `generatedAlwaysAs` pattern with `customType` is documented in official Drizzle docs and works in current versions
   - What's unclear: Whether the current drizzle-kit version generates the `STORED` keyword correctly for all PostgreSQL versions Supabase runs
   - Recommendation: After running `drizzle-kit generate`, inspect the migration SQL and verify the generated column syntax before applying. Manual SQL correction is acceptable if needed.

3. **`updated_at` auto-update**
   - What we know: Drizzle's `.$onUpdate(() => new Date())` updates `updatedAt` on application-layer updates
   - What's unclear: Whether to use a PostgreSQL trigger instead for completeness (catches direct SQL updates)
   - Recommendation: Use Drizzle's `$onUpdate` for v1; a trigger can be added later if needed. Keep it simple.

---

## Validation Architecture

nyquist_validation is enabled (config.json has `"nyquist_validation": true`).

### Test Framework

Phase 1 is infrastructure — there is no existing test infrastructure in this greenfield project. The appropriate validation for this phase is end-to-end smoke testing (visiting deployed URLs) rather than unit tests, because the deliverables are:
- A deployed Vercel URL
- A working database schema
- Drizzle migration files

| Property | Value |
|----------|-------|
| Framework | Playwright (not yet installed) |
| Config file | `playwright.config.ts` — Wave 0 gap |
| Quick run command | `npx playwright test --project=chromium tests/smoke.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | Visiting Vercel URL returns a working web page (not 404/build error) | smoke/e2e | `npx playwright test tests/smoke.spec.ts` | Wave 0 |
| SC-2 | All four tables exist with correct column types | smoke/integration | `npx playwright test tests/db-schema.spec.ts` | Wave 0 |
| SC-3 | Drizzle migration files committed and run cleanly | manual verification | `npx drizzle-kit migrate --dry-run` | N/A |
| SC-4 | GIN index on tsvector column and test lyric query returns results | integration | `npx playwright test tests/fts.spec.ts` | Wave 0 |

Note: SC-3 is verified by checking that `drizzle/` directory contains committed `.sql` files and that `drizzle-kit migrate` runs without error. This is a git + CLI check, not an automated test.

### Sampling Rate
- **Per task commit:** `npx drizzle-kit generate --dry-run` (verify schema compiles)
- **Per wave merge:** `npx playwright test tests/smoke.spec.ts`
- **Phase gate:** Full Playwright suite green + Vercel deployment live before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/smoke.spec.ts` — visit homepage, verify 200; visit /api/health, verify `{ status: 'ok', db: 'ok' }`
- [ ] `tests/db-schema.spec.ts` — query each table, verify column types via `/api/health` or DB inspection
- [ ] `playwright.config.ts` — base URL pointing to Vercel preview or localhost:3000
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM — Connect Supabase](https://orm.drizzle.team/docs/connect-supabase) — pooler setup, prepare: false
- [Drizzle ORM — Full-text search with Generated Columns](https://orm.drizzle.team/docs/guides/full-text-search-with-generated-columns) — tsvector customType + generatedAlwaysAs + GIN index
- [Drizzle ORM — PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) — jsonb, pgEnum, uuid, timestamp
- [Drizzle ORM — Get Started with Supabase](https://orm.drizzle.team/docs/get-started/supabase-new) — installation and migration workflow
- [shadcn/ui — Dark Mode / Next.js](https://ui.shadcn.com/docs/dark-mode/next) — ThemeProvider, layout.tsx configuration
- [shadcn/ui — Sidebar Component](https://ui.shadcn.com/docs/components/radix/sidebar) — installation, SidebarProvider, SidebarMenu
- [shadcn/ui — Next.js Installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init -t next`
- [Supabase — Drizzle Guide](https://supabase.com/docs/guides/database/drizzle) — Supabase-specific setup

### Secondary (MEDIUM confidence)
- [Soft Delete with Drizzle ORM](https://subtopik.com/@if-loop/guides/implementing-soft-deletions-with-drizzle-orm-and-postgresql-s2qauA) — isNull pattern, soft delete update query
- [Next.js 15 Route Handlers](https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware) — health check endpoint pattern
- [Drizzle with Supabase Tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — complete workflow

### Tertiary (LOW confidence)
- DEV Community articles on Next.js 15 + Tailwind v4 + shadcn dark mode — corroborated by official shadcn docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries have current official documentation; versions verified
- Architecture: HIGH — Patterns sourced from official Drizzle and shadcn/ui docs
- Pitfalls: HIGH — Transaction pool mode prepared statement issue is documented in official Supabase/Drizzle docs; Tailwind v4 config change is documented in Tailwind official docs
- Schema design: HIGH — tsvector + customType pattern is from official Drizzle docs example

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (stable libraries; re-verify if Drizzle or shadcn major version changes)
