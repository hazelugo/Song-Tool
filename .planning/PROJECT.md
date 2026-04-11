# Song Tool

## What This Is

A web app that functions as a musical database and playlist builder. Users add songs with musical metadata (BPM, key, key signature, chord progressions, lyrics, optional streaming links) and can filter songs by shared properties to build playlists. Includes harmonic song suggestions via the Camelot Wheel and CSV/text export. Auth-gated — users must log in to access songs, discovery, and playlists. Built for working musicians managing a live catalog under time pressure.

## Core Value

Find songs that share musical DNA — match by BPM, key, key signature, or chord progressions — so building a set that flows is fast and musical.

## Requirements

### Validated

- ✓ User can add a song with required fields: name, BPM, key, key signature, chord progressions — v1.0
- ✓ User can add optional fields per song: lyrics, YouTube URL, Spotify URL, artist, time signature — v1.0
- ✓ User can add one or more freeform tags to a song — v1.0
- ✓ User can edit any field of an existing song — v1.0
- ✓ User can delete a song from the database — v1.0
- ✓ User can view all songs in a paginated table with key metadata columns — v1.0
- ✓ User can filter songs by BPM range, key, key signature, chord progressions, lyric keyword — v1.0
- ✓ User can sort filtered results by any column — v1.0
- ✓ User can apply multiple filters simultaneously — v1.0
- ✓ User can save the current filtered and ordered song list as a named playlist — v1.0
- ✓ User can view a list of all saved playlists — v1.0
- ✓ User can open a saved playlist and see all its songs in saved order — v1.0
- ✓ User can reorder songs within a saved playlist via drag-and-drop — v1.0
- ✓ User can open a song's YouTube or Spotify link from within a playlist view — v1.0
- ✓ User can remove a song from a playlist without deleting the song — v1.0
- ✓ User can delete a saved playlist — v1.0
- ✓ App requires login — auth middleware redirects unauthenticated users to /login — v1.0

### Active

- [ ] User can filter songs by tag (API exists — tag filter UI control not yet wired to FILTER_KEYS in SongFilters)
- [ ] User can filter songs by time signature (filterSchema and API support it — no UI control)
- [ ] Find Similar Songs — seed from any song in the catalog with full harmonic suggestions

### Out of Scope

- Auto-fetching YouTube/Spotify metadata — API keys, quotas, legal risk; manual URL entry is sufficient
- Spotify API playlist creation — open links individually instead
- Audio playback within the app — licensing and infrastructure; use external streaming links
- Auto-BPM/auto-key detection — requires audio upload + ML pipeline
- Social features, public profiles — not core use case
- Mobile native app — responsive web covers rehearsal use case
- Real-time collaborative editing — shared DB with auth is sufficient

## Context

- v1.0 shipped 2026-04-11 — full song catalog + discovery + playlist builder on Vercel
- Live deployment: https://haze-song-tool.vercel.app
- Codebase: ~11,200 LOC TypeScript (Next.js App Router, Hono, Drizzle, Supabase)
- 22 API routes, 4 DB tables, Supabase auth (email/password)
- Testing: Playwright e2e (chromium), global auth setup with test user
- Known gaps from v1.0 audit: tag filter UI missing; time signature filter UI missing; GET /api/discovery stub orphaned; GET /api/songs/[id] has no GET handler

## Constraints

- **Simplicity**: Prefer lightweight stack — avoid over-engineering for v1 ✓
- **Hosting**: Deployed to Vercel at live URL ✓
- **Multi-tenant readiness**: Supabase RLS-ready; per-user data via userId on all tables ✓
- **Auth**: Implemented via Supabase email/password + middleware ✓

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual URL input per song | Avoids YouTube/Spotify API dependencies in v1 | ✓ Good — sufficient for use case |
| Hosted (not local) | Small group testing requires shared access | ✓ Good — Vercel deployment smooth |
| Auth required from v1 | Multi-user testing + SaaS groundwork | ✓ Good — Supabase auth + middleware |
| No auth in early phases → deferred to Phase 5 | Ship core value first | ✓ Good — clean retrofit with middleware |
| postgres({ prepare: false }) for Supabase Transaction pool | Prepared statements fail on port 6543 | ✓ Good — required for production |
| Chord progressions as JSONB array | Prevents false-positive text filtering | ✓ Good — enables exact chord match |
| Musical key as pgEnum | Prevents filter failures from free text | ✓ Good — 17 values, type-safe |
| playlist_songs.position as real (fractional indexing) | Single-row UPDATE per reorder | ✓ Good — rebalanceRanks handles precision edge cases |
| tsvector as generated column with GIN index | FTS without application-layer complexity | ✓ Good — websearch_to_tsquery handles raw user input |
| Playlist ordering: full songId array PUT (not fractional per-drag) | Simpler server logic | ✓ Good — positions recalculated sequentially in transaction |
| Tags reconcile via delete-all-reinsert | Simpler than diff-based update for v1 scale | ✓ Good — clean, correct |
| SongFilters on /songs (not /discovery) | Filter-as-you-manage UX | ✓ Good — users confirmed this pattern |
| Filter state via URL searchParams | Bookmarkable, no extra state lib | ✓ Good — simple and effective |
| PlaylistBuilder as full-screen inline view | Avoids navigation for quick playlist creation | ✓ Good — UX validated |
| DragOverlay with activation constraint in PlaylistBuilder | Prevents accidental drags | ✓ Good — matches PlaylistEditor pattern |
| Camelot Wheel BPM ±15 + key compatibility (score 2-3pt) | Harmonic suggestion quality | — Pending real-world validation |
| ExportMenu: client-side blob download | No server streaming endpoint needed | ✓ Good — simple, works |
| middleware.ts using getUser() not getSession() | JWT validation with Supabase auth server | ✓ Good — T-05-03 mitigation |
| Matcher excludes /api/* at framework level | API routes use requireUser() server-side | ✓ Good — defense in depth |
| PROTECTED_PREFIXES uses startsWith(prefix + '/') | Prevents /songster matching /songs | ✓ Good — T-05-04 mitigation |

---
*Last updated: 2026-04-11 after v1.0 milestone*
