# Project Research Summary

**Project:** Song Tool — Music Database & Playlist Builder
**Domain:** Music metadata management and setlist/playlist creation web app
**Researched:** 2026-03-09
**Confidence:** MEDIUM (stack versions unverified live; domain patterns HIGH confidence)

## Executive Summary

Song Tool is a targeted band-facing web application for cataloging songs with musical metadata (BPM, key, key signature, chord progressions, lyrics, streaming links) and building setlists through a filter-sort-drag-save workflow. The space is occupied by general tools (Spotify, Apple Music) that lack musical-context filtering and band-specific tools (Bandhelper, Setlist Helper) that lack structured metadata like chord progressions. The recommended approach is a lean monolith: Next.js 15 + Supabase + Drizzle ORM deployed on Vercel, giving a single codebase, managed database with built-in auth and full-text search, and a zero-DevOps path to production. This is a well-trodden SaaS architecture with strong community precedent.

The core technical challenge is not complexity but discipline: several early data modeling decisions are hard to reverse once user data exists. Chord progressions must be stored as structured JSONB (not a flat string) from day one, musical key must be a controlled vocabulary (not free text), and BPM filtering must be a range (not exact match). These three decisions determine whether the product's core feature — finding songs with shared musical DNA — actually works in practice. Get them wrong and the filter returns empty results, destroying the value proposition before any user validates it.

The primary risks are (1) premature scope expansion into audio processing, Spotify API integration, or real-time collaboration — none of which are needed for MVP and all of which add significant complexity — and (2) under-investing in security patterns (IDOR prevention, RLS, global auth middleware) early, when they are cheap, rather than retrofitting them at SaaS scale when they are expensive. Build the simplest possible playlist builder that demonstrates the filter-by-musical-DNA workflow, validate with real bands, then expand.

---

## Key Findings

### Recommended Stack

The full-stack React monolith approach (Next.js 15 App Router + Supabase + Vercel) eliminates the need for a separate backend service while providing managed PostgreSQL, auth, and full-text search from a single platform. Drizzle ORM is preferred over Prisma for this deployment target because Prisma's engine binary adds cold-start latency on Vercel serverless functions. PostgreSQL's native `tsvector` / `tsquery` with a GIN index handles lyric full-text search for any realistic song catalog size (under 50K songs) without an external search service.

See `.planning/research/STACK.md` for full rationale, alternatives considered, and installation commands.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — eliminates separate API server, strong Supabase/Vercel integration ecosystem
- **Supabase (PostgreSQL):** Database + auth + storage on one platform — bundles RLS, tsvector FTS, and auth JWT integration; free tier covers MVP
- **Drizzle ORM:** Type-safe SQL — lighter than Prisma on serverless, SQL-transparent which benefits complex filter queries
- **Vercel:** Hosting — zero-config Next.js deployment, free hobby tier, preview deployments
- **@dnd-kit:** Drag-and-drop — accessibility-first, touch-compatible; react-beautiful-dnd is deprecated and must not be used
- **TanStack Table v8:** Sortable song list — client-side column sort, filter, virtual rendering
- **Tailwind v4 + shadcn/ui:** Styling + components — fast UI iteration, no bundle lock-in
- **Zod + React Hook Form:** Validation — shared schema validates both form and API route

**Critical version note:** Tailwind v4 uses CSS-native config (no `tailwind.config.js`). Verify migration behavior before adopting; Tailwind v3 remains fully supported as a fallback.

### Expected Features

See `.planning/research/FEATURES.md` for the full feature landscape, dependency graph, and chord progressions design options.

**Must have (table stakes) — v1:**
- Song CRUD with all metadata fields: title, BPM, musical key, key signature, chord progressions, lyrics, YouTube URL, Spotify URL
- BPM range filter (not exact match — this is a critical distinction; see Pitfalls)
- Exact key and key signature filter
- Lyric keyword full-text search
- Sort songs by any column (BPM, title, key, etc.)
- Save named playlist/setlist from current filtered and ordered view
- View and open saved playlists
- Manual drag-and-drop ordering within a playlist
- User authentication (email/password; small-group shared access)
- Responsive web interface (rehearsal use on phones/tablets)
- Streaming links per song open in new tab (no API integration required)

**Should have (differentiators) — v1 or early v2:**
- Inline lyric snippet preview in search results (medium complexity, high rehearsal value)
- Song tags for secondary filtering ("ballad", "opener", "crowd-pleaser")
- Duplicate/clone song record (for same song in different arrangements)
- Set pacing notes on playlists

**Defer to v2+:**
- Chord progression structured matching and filtering (requires design work on entry UX — Roman numerals vs. named chords vs. free text)
- Harmonic key compatibility filter (Camelot wheel / circle of fifths)
- Export setlist to PDF or text
- Transposition indicator (key offset calculator for cover bands)
- "Similar songs" suggestion algorithm

**Never build (anti-features):**
- Spotify/YouTube API integration for metadata auto-fetch or playlist sync
- Audio playback, auto-BPM detection, or auto-key detection
- Social features, public profiles, real-time collaboration
- Native iOS/Android app

**Chord progressions field — special design note:** Store as free text in v1. Allow lyric-style keyword search against it. Structured chord matching (filtering by I-IV-V, Roman numeral entry) is a v2 problem requiring explicit UX design. However — see Pitfall 1 below — even free text should be stored in a way that won't require painful migration if structure is added later.

### Architecture Approach

The recommended architecture is a three-tier monolith: browser → Next.js App Router (server components + API routes) → Supabase PostgreSQL. No microservices, no external search service, no real-time infrastructure. The browser never queries the database directly; all data access is server-side with user-scoping enforced on every query. Multi-tenancy in v1 is row-level ownership via `user_id` FK on every table, enforced by Supabase RLS policies — this provides the same security guarantee as application-layer scoping but at the database layer, which prevents query-level mistakes from becoming security holes.

See `.planning/research/ARCHITECTURE.md` for full data model DDL, data flow diagrams, and anti-patterns.

**Major components:**
1. **Auth module** (Supabase Auth + JWT in httpOnly cookie) — login/signup, session, route protection; applied globally as middleware default
2. **Songs module** (server-side CRUD + parameterized filter queries + tsvector FTS) — the catalog and discovery engine
3. **Playlists module** (playlist CRUD + join-table ordering + ownership enforcement) — the output: saving filtered/ordered sets
4. **Song UI** (React — add/edit/delete form via react-hook-form + Zod, table via TanStack Table)
5. **Playlist UI** (React — filter panel, results list, drag-and-drop via @dnd-kit, save flow)
6. **Database** (PostgreSQL via Supabase — four tables: `users`, `songs`, `playlists`, `playlist_songs`)

**Key data model decisions:**
- All PKs are UUIDs (not sequential integers) — prevents IDOR enumeration attacks
- `songs` carries a GIN-indexed `tsvector` generated column for FTS (title + lyrics)
- `playlist_songs` carries an explicit `position` field for ordering; use fractional indexing for drag-and-drop to avoid N-update rewrites on reorder
- `songs` carries `deleted_at` for soft deletes — prevents playlist integrity breakage when a song is removed
- Schema includes `user_id` FK on songs and playlists from day one; RLS policies enforce ownership at the database layer

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for all 12 pitfalls with detection signals and phase-specific warnings.

1. **Chord progressions as flat string** — Substring matching (`LIKE '%Am%'`) produces false positives and blocks transposition/structured search. Store as JSONB array from day one: `[{"root": "A", "quality": "minor"}]`. This is non-negotiable before any songs are entered.

2. **BPM as exact match** — `WHERE bpm = 120` returns near-zero results for a real catalog (songs cluster around round numbers but rarely hit them exactly). Implement as range from day one: `WHERE bpm BETWEEN :min AND :max`. Default UI to a range slider or min/max pair.

3. **Playlist order stored as drifting integers** — Integer `position` updates require N SQL statements per drag; causes collisions under concurrent use. Use fractional indexing (e.g., the `fractional-indexing` npm package) so each reorder is a single UPDATE to one row.

4. **Missing tenant scope on queries (IDOR)** — Any query that fetches by ID without also scoping by `user_id` allows any authenticated user to read/modify any other user's data. Enforce via Supabase RLS at the database layer, not just application code. Write an integration test: User A creates a song, User B attempts to fetch it by ID — assert 403/404.

5. **Musical key stored as free text** — "C major", "c maj", "CMaj" don't equality-match. Use a dropdown in the UI and store as normalized enum (root + mode). Enforce at the API layer. Running `SELECT DISTINCT musical_key FROM songs` with more than 30 distinct values is the detection signal.

**Additional moderate pitfalls to note:**
- Auth middleware must be applied globally by default (opt-out, not opt-in) — utility endpoints built without auth become unauthenticated data leaks
- Decide explicitly whether playlists are live references or snapshots before implementation — for a live set tool, live references (always show current song data) is almost always correct
- Drag-and-drop persistence failures must roll back the UI — silent failure on network blip causes order-reversion on next page load

---

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and the phase warnings from PITFALLS.md, the natural build order is clear and driven by hard dependencies. The architecture research explicitly validates this ordering.

### Phase 1: Foundation — Schema, Auth, and Infrastructure

**Rationale:** Everything else depends on the database schema and user authentication. Schema mistakes (flat chord strings, free-text key, missing soft-delete column, integer PKs) become painful migrations once user data exists. Auth patterns (global middleware, RLS policies, httpOnly JWT) are cheapest to establish before any routes are built. This phase has zero user-visible UI but determines whether the product is secure and data-correct.

**Delivers:** Deployed Next.js app on Vercel, Supabase project with all four tables created (users, songs, playlists, playlist_songs), Supabase Auth wired up with RLS policies, Drizzle schema + migration files committed, global auth middleware protecting all API routes.

**Addresses (from FEATURES.md):** User login/auth (email/password)

**Avoids (from PITFALLS.md):** Pitfall 1 (chord progressions as flat string — use JSONB from day one), Pitfall 4 (missing tenant scope — RLS from day one), Pitfall 5 (key as free text — enum column from day one), Pitfall 12 (hard deletes — `deleted_at` column from day one), Pitfall 7 (opt-in auth middleware — establish global pattern here)

**Research flag:** Standard patterns — no additional research phase needed. Next.js + Supabase Auth + Drizzle setup is well-documented.

---

### Phase 2: Song Catalog — CRUD and Full-Text Search

**Rationale:** Playlists are groupings of songs; the song catalog must exist and be searchable before any playlist feature can be built. This phase proves the data model is correct and delivers the core catalog that users populate.

**Delivers:** Song add/edit/delete form (all metadata fields), song list view with sortable columns (TanStack Table), lyric keyword search (tsvector GIN index), streaming link display.

**Addresses (from FEATURES.md):** Song CRUD with all fields (BPM, key, key signature, chord progressions, lyrics, YouTube URL, Spotify URL), sort by any column, link to streaming source, lyric keyword search

**Avoids (from PITFALLS.md):** Pitfall 2 (BPM exact match — do not build BPM filter yet; when built in Phase 3, it must be range), Pitfall 5 (FTS with tsvector from the start — never ILIKE on lyrics), Pitfall 10 (URL validation on input for YouTube/Spotify patterns)

**Uses (from STACK.md):** TanStack Table, react-hook-form + Zod, shadcn/ui Table/Dialog/Input components, Drizzle ORM, Supabase PostgreSQL tsvector

**Research flag:** Standard patterns — song CRUD and PostgreSQL FTS are well-documented.

---

### Phase 3: Discovery — Filter and Sort

**Rationale:** The filter panel is the product's core value proposition — the mechanism by which users find songs that share musical DNA for a flowing set. It must be validated before the playlist-save feature is built on top of it. Building filter after the song catalog (Phase 2) allows real data to validate filter behavior.

**Delivers:** Filter panel (BPM range slider/inputs, key dropdown, key signature dropdown, chord keyword search), server-side parameterized SQL filter queries, combined filter + lyric search, column sort controls in the song list.

**Addresses (from FEATURES.md):** Filter songs by BPM range, exact key, key signature; filter by chord progression text; lyric keyword search integration with filter

**Avoids (from PITFALLS.md):** Pitfall 2 (BPM range, not exact match — critical here), Pitfall 11 (AND logic is correct for v1; document explicitly in UI that all filters are AND-combined), Pitfall 6 (key filter uses the normalized enum, not free text)

**Uses (from STACK.md):** Drizzle `sql` template literal for raw SQL escape hatch in tsvector queries, TanStack Table column sort

**Research flag:** Standard patterns — parameterized SQL filtering is well-established. No research phase needed.

---

### Phase 4: Playlist Builder — Save, View, and Reorder

**Rationale:** Playlist functionality depends on Phase 3 (filter) being functional and validated. The playlist builder is the culmination of the filter → sort → drag → save workflow. Drag-and-drop ordering and persistence have specific implementation requirements (fractional indexing) that must be addressed before wiring to the database.

**Delivers:** Save current filtered/ordered view as a named playlist, playlist list view, open and view a saved playlist with song details, drag-and-drop reorder within a playlist (with persistence confirmation UI and rollback on failure).

**Addresses (from FEATURES.md):** Named playlists/setlists, view saved playlists, manual drag-and-drop ordering

**Avoids (from PITFALLS.md):** Pitfall 3 (fractional indexing, not integer position, for drag reorder — implement before wiring DnD to DB), Pitfall 8 (decide and document live-references vs. snapshot; recommend live references), Pitfall 9 (show save confirmation and roll back UI on persistence failure)

**Uses (from STACK.md):** @dnd-kit/core + @dnd-kit/sortable, fractional-indexing npm package

**Research flag:** Fractional indexing pattern is well-documented (Linear blog, fractional-indexing npm). Drag-and-drop with @dnd-kit is well-documented. No additional research phase needed.

---

### Phase 5: Polish and Responsive UI

**Rationale:** UI polish and mobile responsiveness are independent of data correctness and can be layered on after functional phases are validated. Ship functional first; polish after.

**Delivers:** Responsive layout for mobile/tablet use at rehearsal, inline lyric snippet preview in search results, song tags for secondary filtering (if validated by users in earlier phases), streaming link button styling.

**Addresses (from FEATURES.md):** Responsive web interface, inline lyric preview, song tags, set pacing notes on playlists

**Avoids (from PITFALLS.md):** None new — this phase adds no new security or data model surface.

**Research flag:** Standard front-end patterns. No research phase needed.

---

### Phase 6: SaaS and Monetization (Future)

**Rationale:** Only after core workflow is validated with real users. Schema is already designed for multi-tenancy (user_id/org_id FK pattern, RLS policies, UUID PKs). Stripe integration, organization management, and per-band billing are deferred by design.

**Delivers:** Stripe billing, organization/band accounts (potentially via Clerk for Organizations API), per-org song libraries, multi-band isolation.

**Addresses (from FEATURES.md):** Per-user vs. shared song library, complex subscription billing

**Research flag:** Needs research phase — Clerk Organizations API integration with Supabase, Stripe billing patterns for Next.js, multi-tenant RLS policy migration strategy. This phase has the most moving parts and the least validated patterns for this specific stack combination.

---

### Phase Ordering Rationale

- **Schema before auth before CRUD before filter before playlist:** This is a strict dependency chain. No step can be skipped or reordered without creating rework.
- **Pitfall-driven sequencing:** The most severe pitfalls (chord JSONB structure, BPM range, key enum, RLS) are all schema-level or filter-level decisions — addressed in Phases 1–3 before any user data is committed.
- **Validate discovery before persistence:** Filtering (Phase 3) is validated before playlist saving (Phase 4). This confirms the primary workflow before building the output mechanism.
- **Polish deferred:** UI responsiveness and visual refinement don't depend on data correctness; they're last to avoid premature optimization of an unvalidated workflow.
- **SaaS last:** The schema is designed to support multi-tenancy from day one, but the SaaS product layer (billing, org management) requires validated product-market fit first.

---

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 6 (SaaS/Monetization):** Clerk Organizations API + Supabase integration is non-trivial; Stripe billing for Next.js has multiple patterns (webhooks, customer portal, metered billing); multi-tenant RLS migration from user_id to org_id requires careful strategy. Request research phase before planning.

**Phases with standard patterns (skip research phase):**
- **Phase 1 (Foundation):** Next.js + Supabase + Drizzle setup is extensively documented in official docs and community tutorials.
- **Phase 2 (Song Catalog):** Song CRUD + PostgreSQL FTS with tsvector is a standard pattern with official PostgreSQL documentation.
- **Phase 3 (Discovery/Filter):** Parameterized SQL filtering and TanStack Table sorting are well-established.
- **Phase 4 (Playlist Builder):** Fractional indexing is well-documented; @dnd-kit has comprehensive docs.
- **Phase 5 (Polish):** Standard responsive web patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Technology choices are well-validated community consensus; specific version numbers (Next.js 15, Drizzle 0.3x, Tailwind v4) are from training data (cutoff Aug 2025) and should be verified at implementation time. Tailwind v4 CSS-native config behavior in particular should be verified before adoption. |
| Features | MEDIUM | Table stakes and anti-features are HIGH confidence based on domain knowledge of comparable tools (DJ software, setlist apps, music library managers). Differentiator priority ordering is MEDIUM — requires validation with target users. |
| Architecture | HIGH | Three-tier monolith pattern, PostgreSQL tsvector, fractional indexing, RLS multi-tenancy, httpOnly JWT — all well-established patterns with authoritative sources (PostgreSQL docs, OWASP, Linear blog). |
| Pitfalls | HIGH | Data modeling pitfalls (chord normalization, BPM range, key enum) are standard relational design principles. Security pitfalls (IDOR, RLS, auth middleware) are documented in OWASP and Supabase official docs. The only MEDIUM-confidence pitfall is the live-reference vs. snapshot decision for playlists. |

**Overall confidence: MEDIUM-HIGH**

The architecture and pitfall avoidance strategies are HIGH confidence. Technology choices are MEDIUM confidence due to reliance on training data for version numbers and pricing. Feature prioritization is MEDIUM confidence and should be validated with real users before v2 scope is committed.

---

### Gaps to Address

- **Chord progressions entry UX:** The v1 recommendation (free text) avoids the JSONB structure pitfall if the field is stored as `JSONB` even when entry is free-text initially. The gap is: what does the JSONB schema look like for free text? Recommendation: store as a JSONB array of strings in v1 (`["Am", "G", "F", "C"]`) parsed from the input. This preserves structure without requiring Roman numeral entry. Validate before schema creation.

- **Tailwind v4 CSS-native config:** Tailwind v4 was released early 2025. The CSS-native config (no `tailwind.config.js`) is a behavior change. Verify with official docs before scaffolding — fall back to v3 if migration friction is significant.

- **Supabase free tier limits:** Supabase free tier limits (500MB DB, 50MB storage, 50K MAU) were accurate as of mid-2025 but may have changed. Verify at https://supabase.com/pricing before committing to Supabase for a production workload that exceeds hobby scale.

- **Fractional indexing library maintenance:** The `fractional-indexing` npm package and the pattern from the Linear blog are well-documented, but verify the package is actively maintained before adopting. Alternative: implement the algorithm directly (it is ~30 lines of code).

- **Multi-user vs. single-band scope for v1:** The research assumes small-group shared access (a band sharing a single login or individual accounts sharing a database). The per-user vs. shared-library question is deferred to the SaaS phase, but the roadmapper should clarify with the product owner whether v1 should support a "band library" (shared songs across multiple logins) or only individual user libraries. This changes the schema design before Phases 1–2.

---

## Sources

### Primary (HIGH confidence)
- PostgreSQL documentation — tsvector/tsquery full-text search, GIN indexes, RLS policies
- OWASP — IDOR prevention, JWT storage (httpOnly cookie vs. localStorage)
- Linear blog — fractional indexing for list ordering
- Supabase documentation — Auth, RLS, Supabase + Next.js integration

### Secondary (MEDIUM confidence)
- Next.js 15 App Router documentation (training data, Aug 2025 cutoff) — App Router patterns, API routes
- Drizzle ORM documentation (training data) — schema definition, migrations, serverless performance
- @dnd-kit documentation (training data) — accessibility-first drag-and-drop
- TanStack Table v8 documentation (training data) — column sort, virtual rendering
- Domain knowledge: Rekordbox, Serato, Bandhelper, Setlist Helper, Setlist.fm, Ultimate Guitar feature sets

### Tertiary (LOW confidence — verify before use)
- Supabase free tier pricing limits — verify at https://supabase.com/pricing
- Vercel free tier limits — verify at https://vercel.com/pricing
- Tailwind v4 CSS-native config behavior — verify at https://tailwindcss.com/docs/v4-upgrade
- Clerk pricing for SaaS milestone — verify at https://clerk.com/pricing
- Drizzle ORM current stable version — verify at https://github.com/drizzle-team/drizzle-orm/releases

---

*Research completed: 2026-03-09*
*Ready for roadmap: yes*
