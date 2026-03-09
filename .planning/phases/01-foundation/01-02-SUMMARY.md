---
phase: 01-foundation
plan: "02"
subsystem: database
tags: [drizzle-orm, postgres, supabase, tsvector, jsonb, pgEnum, migration, health-endpoint]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Next.js app scaffold with src/app/api/health/route.ts stub returning {status:ok, db:pending}
provides:
  - Drizzle schema for all four tables: songs, tags, playlists, playlist_songs
  - musicalKeyEnum (17 values: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B) and keySignatureEnum (major, minor)
  - Custom tsvector type; songs.lyrics_search as tsvector GENERATED ALWAYS AS STORED with GIN index
  - songs.chord_progressions as JSONB, songs.deleted_at nullable (soft delete)
  - playlist_songs.position as real (fractional indexing)
  - All PKs as UUID
  - Drizzle client in src/db/index.ts with postgres({ prepare: false }) for Supabase Transaction pool
  - drizzle.config.ts with postgresql dialect
  - Committed migration: drizzle/0000_moaning_daredevil.sql
  - GET /api/health wired to db.execute(SELECT 1) — returns {status:ok,db:ok} on success, 503 on failure
  - TypeScript type exports: Song, InsertSong, Playlist, InsertPlaylist, Tag, InsertTag, PlaylistSong
affects: [all subsequent phases — every phase imports from src/db/schema.ts and src/db/index.ts]

# Tech tracking
tech-stack:
  added:
    - drizzle-orm@0.45.1
    - postgres@3.4.8
    - dotenv@17.3.1
    - drizzle-kit@0.31.9
    - tsx@4.21.0
  patterns:
    - Drizzle client uses postgres({ prepare: false }) — REQUIRED for Supabase Transaction pool mode (port 6543)
    - tsvector is a customType (not natively supported in Drizzle) — generatedAlwaysAs with SQL template
    - GIN index created via index().using('gin', column) in pgTable second argument
    - All server code imports db from '@/db' (path alias @/* maps to src/*)
    - Health endpoint: catch block returns 503 with error message for debugging

key-files:
  created:
    - src/db/schema.ts
    - src/db/index.ts
    - drizzle.config.ts
    - drizzle/0000_moaning_daredevil.sql
    - drizzle/meta/0000_snapshot.json
    - drizzle/meta/_journal.json
  modified:
    - src/app/api/health/route.ts
    - package.json

key-decisions:
  - "postgres({ prepare: false }) required for Supabase Transaction pool (port 6543) — without it, production throws 'prepared statement already exists'"
  - "tsvector customType required since Drizzle has no native tsvector support — generatedAlwaysAs() generates correct STORED syntax"
  - "Drizzle-kit generate produced correct GENERATED ALWAYS AS STORED syntax automatically — no manual SQL correction needed"
  - "playlist_songs song_id FK has no cascade (ON DELETE no action) — soft-deleted songs must remain accessible via playlist entries"
  - "GIN index on lyrics_search verified in generated SQL — correct USING gin clause"

patterns-established:
  - "DB import pattern: import { db } from '@/db' — all server routes use this"
  - "Health endpoint pattern: try { await db.execute(sql\`SELECT 1\`) } catch — 503 on DB unreachable"
  - "Schema type exports: typeof table.$inferSelect / $inferInsert — all feature phases use these"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 1 Plan 02: Drizzle Schema, Migrations, and Health Endpoint Summary

**Drizzle schema with four tables (JSONB chords, tsvector GIN index, pgEnum keys, fractional position), committed migration SQL, and /api/health wired to live Supabase db.execute(SELECT 1)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-09T21:36:24Z
- **Completed:** 2026-03-09T21:51:00Z (est)
- **Tasks:** 2 of 3 complete (Task 3 is checkpoint:human-verify — awaiting user)
- **Files modified:** 8

## Accomplishments
- Created src/db/schema.ts with all four tables, correct column types, enums, custom tsvector, and TypeScript type exports
- Generated drizzle/0000_moaning_daredevil.sql — migration SQL verified correct (GENERATED ALWAYS AS STORED, GIN index, jsonb, real)
- Created src/db/index.ts with postgres({ prepare: false }) for Supabase Transaction pool compatibility
- Wired GET /api/health to db.execute(SELECT 1) — returns {status:'ok',db:'ok'} on success
- All TypeScript compiles clean (`npx tsc --noEmit` exits 0)
- Migration ready to apply with `npm run db:migrate` (requires DATABASE_URL in .env.local)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Drizzle schema and database client** - `f0e8f42` (feat)
2. **Task 2: Generate migrations and wire /api/health** - `7a7c832` (feat)
3. **Task 3: Checkpoint — Verify live database schema and health endpoint** - awaiting human verification

## Files Created/Modified
- `src/db/schema.ts` - Four table definitions, two pgEnums, custom tsvector, TypeScript type exports
- `src/db/index.ts` - Drizzle client with postgres({ prepare: false }) for Supabase Transaction pool
- `drizzle.config.ts` - Drizzle Kit config: out=./drizzle, schema=./src/db/schema.ts, dialect=postgresql
- `drizzle/0000_moaning_daredevil.sql` - Migration SQL: CREATE TYPE (enums), CREATE TABLE (4 tables), FK constraints, GIN index
- `drizzle/meta/0000_snapshot.json` - Drizzle meta: schema snapshot
- `drizzle/meta/_journal.json` - Drizzle meta: migration journal
- `src/app/api/health/route.ts` - GET /api/health -> db.execute(SELECT 1) -> {status:'ok',db:'ok'}
- `package.json` - Added db:generate, db:migrate, db:studio scripts; drizzle-orm, postgres, dotenv deps

## Migration File Details

**File:** `drizzle/0000_moaning_daredevil.sql`

Key SQL verified correct:
- `musical_key` enum: 17 values (C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B)
- `key_signature` enum: major, minor
- `songs.lyrics_search`: `tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("songs"."lyrics", ''))) STORED`
- `songs.chord_progressions`: `jsonb DEFAULT '[]'::jsonb NOT NULL`
- `songs.deleted_at`: nullable timestamp (no NOT NULL)
- `playlists.deleted_at`: nullable timestamp (no NOT NULL)
- `playlist_songs.position`: `real NOT NULL`
- GIN index: `CREATE INDEX "idx_songs_lyrics_search" ON "songs" USING gin ("lyrics_search")`
- All PKs: `uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`

**No manual SQL corrections were needed** — drizzle-kit generate produced correct output.

## Decisions Made
- **postgres({ prepare: false }):** Supabase Transaction pool (port 6543) rejects prepared statements — this flag is mandatory for production.
- **tsvector as customType:** Drizzle doesn't natively support PostgreSQL's tsvector type. The `customType` API with `generatedAlwaysAs()` produces the correct STORED generated column syntax.
- **playlist_songs FK without cascade:** `song_id` references songs with no cascade because soft-deleted songs (songs.deleted_at not null) must remain accessible via playlist entries — they're not truly deleted.
- **Drizzle-kit output verified correct:** The generated migration was inspected and all critical column types matched the spec exactly (GENERATED ALWAYS AS STORED, USING gin, jsonb, real).

## Deviations from Plan

None - plan executed exactly as written.

**No manual SQL corrections were needed** — drizzle-kit generated the correct tsvector GENERATED ALWAYS AS STORED syntax automatically, which was a concern noted in the plan.

## Issues Encountered

**Migration apply requires DATABASE_URL:** The migration generation (Task 2) completed successfully, but applying the migration (`npm run db:migrate`) requires `DATABASE_URL` set in `.env.local` pointing to the Supabase Transaction pool (port 6543). No `.env.local` exists in the project. This is expected — the user must add this before running `npm run db:migrate`.

## User Setup Required

Before the checkpoint can be verified, the user must:

1. Create `.env.local` in the project root with:
   ```
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   (Transaction pool URL — port 6543, not 5432)

2. Run the migration:
   ```bash
   cd "/Users/hector/Documents/Song Tool"
   npm run db:migrate
   ```

3. Add `DATABASE_URL` to Vercel project settings (Environment Variables section)

4. Push to trigger Vercel redeploy:
   ```bash
   git push
   ```

5. Visit `{VERCEL_URL}/api/health` — should return `{"status":"ok","db":"ok"}`

## Checkpoint Awaiting

See checkpoint Task 3 details:
- Visit `{VERCEL_URL}/api/health` — must return `{"status":"ok","db":"ok"}`
- Verify all four tables in Supabase Dashboard > Table Editor
- Verify GIN index `idx_songs_lyrics_search` in Supabase Dashboard > Database > Indexes
- Run `npm run test:e2e` — Playwright smoke tests must pass
- Confirm `git log --oneline -- drizzle/` shows committed migration files

## Next Phase Readiness
- Schema is final and committed — all downstream phases can import from src/db/schema.ts
- TypeScript types exported: Song, InsertSong, Playlist, InsertPlaylist, Tag, InsertTag, PlaylistSong
- Health endpoint wired — Phase 2 and beyond can rely on /api/health for DB connectivity checks
- Blocker: Migration must be applied to Supabase before live DB connectivity works

## Self-Check: PASSED

- FOUND: src/db/schema.ts
- FOUND: src/db/index.ts
- FOUND: drizzle.config.ts
- FOUND: drizzle/0000_moaning_daredevil.sql
- FOUND: src/app/api/health/route.ts
- FOUND: .planning/phases/01-foundation/01-02-SUMMARY.md
- FOUND commit: f0e8f42 (Task 1)
- FOUND commit: 7a7c832 (Task 2)

---
*Phase: 01-foundation*
*Completed: 2026-03-09 (partial — awaiting checkpoint verification)*
