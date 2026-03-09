# Architecture Patterns

**Domain:** Music metadata database + playlist builder web app
**Researched:** 2026-03-09
**Confidence:** HIGH (well-established CRUD + filter + join-table patterns; no exotic tech required)

---

## Recommended Architecture

A three-tier web application: browser client, application server, relational database. No separate microservices needed at this scale (under 500 songs, small-group use). A single deployable unit (monolith with clear internal boundaries) minimizes operational overhead while keeping a clean path to multi-tenancy.

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Auth UI    │  │  Song UI     │  │  Playlist UI         │  │
│  │  (login /   │  │  (add/edit/  │  │  (filter → sort →   │  │
│  │   signup)   │  │   delete)    │  │   drag → save)       │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │  HTTPS / REST  │                      │
┌─────────▼────────────────▼─────────────────────▼─────────────┐
│  Application Server (Node / Python / similar)                  │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │  Auth Module │  │  Songs Module │  │  Playlists Module  │  │
│  │  (session /  │  │  (CRUD +      │  │  (CRUD + ordering  │  │
│  │   JWT)       │  │   search)     │  │   + membership)    │  │
│  └──────┬───────┘  └──────┬────────┘  └────────┬───────────┘  │
└─────────┼─────────────────┼──────────────────────┼────────────┘
          │  SQL            │                      │
┌─────────▼─────────────────▼──────────────────────▼────────────┐
│  Relational Database (PostgreSQL)                               │
│  users · songs · playlists · playlist_songs                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Auth UI | Login, signup, session token storage | Auth Module (server) |
| Song UI | Add / edit / delete songs; trigger search/filter | Songs Module (server) |
| Playlist UI | Filter panel, results list, drag-and-drop reorder, save playlist, view saved playlists | Playlists Module (server), Songs Module (server) |
| Auth Module | Verify credentials, issue JWT or session cookie, protect all other routes | Database (users table) |
| Songs Module | CRUD for songs, parameterized filter queries, full-text lyric search | Database (songs table) |
| Playlists Module | CRUD for playlists, manage ordered membership (playlist_songs), enforce user ownership | Database (playlists + playlist_songs tables) |
| Database | Single source of truth; enforces FK constraints and user-scoped row ownership | Application server only (never directly from browser) |

**Key rule:** The browser never queries the database directly. All data access goes through the application server, which enforces authentication and user-scoping on every request.

---

## Data Model

### users

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,         -- bcrypt / argon2
  display_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### songs

```sql
CREATE TABLE songs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  bpm             INTEGER,             -- nullable: not all songs have a fixed BPM
  musical_key     TEXT,               -- e.g. "C", "F#", "Bb"
  key_signature   TEXT,               -- e.g. "major", "minor", "dorian"
  chord_progressions TEXT,            -- free text or structured (see notes below)
  lyrics          TEXT,               -- full lyric body for full-text search
  youtube_url     TEXT,
  spotify_url     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search index on lyrics + title (PostgreSQL tsvector)
ALTER TABLE songs ADD COLUMN fts_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(lyrics, ''))
  ) STORED;

CREATE INDEX songs_fts_idx ON songs USING GIN(fts_vector);

-- Equality-filter indexes for common filter fields
CREATE INDEX songs_user_id_idx ON songs(user_id);
CREATE INDEX songs_bpm_idx     ON songs(bpm);
CREATE INDEX songs_key_idx     ON songs(musical_key);
CREATE INDEX songs_key_sig_idx ON songs(key_signature);
```

**chord_progressions design note:** Start as a free-text field ("I IV V I", "Am F C G"). Filtering by chord progression in v1 is substring/LIKE matching or exact match. A structured JSON array can be introduced in a later phase if richer chord search is needed. Do not over-engineer this in v1.

### playlists

```sql
CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX playlists_user_id_idx ON playlists(user_id);
```

### playlist_songs (join table with explicit ordering)

```sql
CREATE TABLE playlist_songs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id  UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id      UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,      -- 0-based or 1-based; enforced unique per playlist
  UNIQUE (playlist_id, position),
  UNIQUE (playlist_id, song_id)       -- a song appears once per playlist
);

CREATE INDEX playlist_songs_playlist_idx ON playlist_songs(playlist_id);
```

**Ordering strategy:** Store an explicit integer `position` per row. When the user drags to reorder, the client sends the new ordered list of song IDs; the server replaces all `playlist_songs` rows for that playlist in a single transaction. This is simpler than fractional-index approaches at this scale and avoids gap-management complexity.

---

## Data Flow

### Filter + Search (Songs Module)

```
1. User sets filter criteria in Playlist UI
   (BPM range, key, key_signature, chord fragment, lyric keyword)

2. Browser sends GET /api/songs?bpm_min=80&bpm_max=100&key=C&lyric=love

3. Songs Module builds parameterized SQL:
   SELECT * FROM songs
   WHERE user_id = $current_user
     AND ($bpm_min IS NULL OR bpm >= $bpm_min)
     AND ($bpm_max IS NULL OR bpm <= $bpm_max)
     AND ($key IS NULL OR musical_key = $key)
     AND ($key_sig IS NULL OR key_signature = $key_sig)
     AND ($chord IS NULL OR chord_progressions ILIKE '%' || $chord || '%')
     AND ($lyric IS NULL OR fts_vector @@ plainto_tsquery('english', $lyric))
   ORDER BY [requested sort field] [ASC|DESC];

4. Server returns JSON array of matching songs

5. Client renders results list; user can drag to reorder (client-side state only)
```

### Save Playlist

```
1. User clicks "Save Playlist" with a name

2. Browser sends POST /api/playlists
   Body: { name: "Friday Set", songs: [song_id_1, song_id_2, ...] }
   (order in array = display order)

3. Playlists Module:
   a. INSERT INTO playlists (user_id, name) → returns playlist_id
   b. INSERT INTO playlist_songs (playlist_id, song_id, position)
      for each song_id with its array index as position
      (wrapped in a transaction)

4. Server returns { id: playlist_id, name, songs: [...] }

5. Client navigates to playlist view or shows success confirmation
```

### Reorder Playlist (Update)

```
1. User drags songs to new order in Playlist UI

2. Browser sends PUT /api/playlists/:id/songs
   Body: { songs: [song_id_3, song_id_1, song_id_2] }  ← new order

3. Playlists Module (in a single transaction):
   DELETE FROM playlist_songs WHERE playlist_id = :id
   INSERT INTO playlist_songs ... (bulk insert with new positions)

4. Server returns 200 OK

Note: optimistic UI update on client while request is in flight is acceptable
at this scale; no conflict resolution needed for single-user playlists.
```

### Authentication Flow

```
1. User submits login form

2. Auth Module checks email/password against users table (bcrypt compare)

3. On success: issue JWT (stateless) or server session (stateful cookie)
   Recommendation: JWT stored in httpOnly cookie — avoids XSS risk,
   works across tabs, no session store required in v1.

4. All subsequent API requests include the cookie automatically.
   Auth middleware extracts user_id from JWT and attaches to request context.

5. Every data query includes WHERE user_id = $current_user (enforced server-side).
```

---

## Multi-Tenant Data Isolation Strategy

**Approach: row-level ownership via user_id foreign key** (not separate schemas or databases per user).

Every data table (`songs`, `playlists`, `playlist_songs`) carries a `user_id` column. Every query in the application layer appends `AND user_id = $authenticated_user_id`. This is enforced in the application code, not the database (no Row Level Security in v1 — adds complexity; add it if/when migrating to a managed Postgres like Supabase that supports it natively).

**Why this over separate schemas:**
- Simple to reason about and audit
- Single database, single schema — no migration fan-out per user
- Scales to hundreds of users without operational complexity
- Clear upgrade path: add PostgreSQL Row Level Security policies in one migration when moving to a multi-tenant SaaS tier

**Group/band account support (future):** Add a `groups` table and replace `user_id` on songs/playlists with an `owner_id` + `owner_type` discriminator (or a `group_id` nullable column). This is a deliberate deferral; v1 user_id-per-row isolation does not block it.

---

## Full-Text Search Considerations

**Technology:** PostgreSQL built-in full-text search via `tsvector` / `tsquery`. No external search service (Elasticsearch, Typesense, Meilisearch) needed for under 500 songs.

**Lyric search specifics:**
- Store the combined `title || ' ' || lyrics` as a `GENERATED ALWAYS AS ... STORED` tsvector column. This keeps the index current automatically on INSERT/UPDATE with no application-layer bookkeeping.
- Use `plainto_tsquery` for user input (handles natural language without requiring the user to know query syntax). Use `to_tsquery` if phrase-exact matching is needed later.
- For highlighting matched lyric excerpts: `ts_headline()` PostgreSQL function returns the relevant snippet with matched terms wrapped in tags. Useful for the search results display.
- Ranking: `ts_rank(fts_vector, query)` can order results by relevance when lyric keyword search is active. Switch to this ordering automatically when a lyric search term is present.

**Limitations to document:**
- `plainto_tsquery` does not support partial/prefix matching (e.g., "lov" will not match "love"). For prefix matching add a `pg_trgm` GIN index and use ILIKE or similarity matching as a complement. In v1, full-word matching is acceptable.
- The `'english'` dictionary stems words (love/loves/loved → "love"). This is usually desirable for lyric search.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing playlist order as a timestamp or alpha sort
**What:** Relying on creation time or alphabetical sort instead of explicit position integers.
**Why bad:** Makes drag-and-drop reordering impossible without an extra field anyway; position must be explicit.
**Instead:** Use the `position INTEGER` column in `playlist_songs` from day one.

### Anti-Pattern 2: Allowing chord_progressions to be a normalized relation in v1
**What:** Creating a `chords` table, a `song_chords` join table, a chord vocabulary table.
**Why bad:** Enormous complexity for a search use case that works fine with ILIKE on a text column at < 500 songs. Premature normalization.
**Instead:** Free-text column. Migrate to structured JSON or separate table if chord-based analytics become a requirement.

### Anti-Pattern 3: Fetching all songs to the client and filtering in JavaScript
**What:** Loading the entire song catalog into browser memory, then filtering with array methods.
**Why bad:** Works for 50 songs, breaks for 5,000. Sets a bad precedent and wastes bandwidth.
**Instead:** All filtering and search is server-side SQL. Client only receives the matching result set.

### Anti-Pattern 4: Storing JWT in localStorage
**What:** `localStorage.setItem('token', jwt)` pattern.
**Why bad:** Vulnerable to XSS — any script on the page can read it.
**Instead:** httpOnly cookie. The browser sends it automatically; JavaScript cannot access it.

### Anti-Pattern 5: Skipping user_id scoping on any query
**What:** Forgetting to add `WHERE user_id = $current_user` on a route.
**Why bad:** One user can read or modify another user's songs/playlists (IDOR vulnerability).
**Instead:** Centralize user-scoping in a data-access layer / repository class that always appends the current user filter. Never construct scoped queries ad hoc in route handlers.

---

## Suggested Build Order

The dependency graph drives this order. Each phase unblocks the next.

```
1. Database schema + migrations
   └─ Everything else depends on this existing

2. Auth (users table, registration, login, JWT middleware)
   └─ All other API routes require authenticated user_id

3. Songs CRUD (add, edit, delete, list)
   └─ Playlists require songs to exist

4. Songs filter + search
   └─ The core value: filter by BPM/key/chord + lyric search
   └─ Proves the data model works before building playlist layer

5. Playlist creation (save filtered + ordered set as named playlist)
   └─ Requires Songs filter to be functional

6. Playlist management (view, edit order, delete)
   └─ CRUD layer on top of playlist save

7. UI polish: drag-and-drop reorder, streaming link buttons, sort controls
   └─ Enhances existing functionality; no new backend endpoints required
```

**Why this order:**
- Schema first: avoids rework if data model changes propagate to all layers.
- Auth second: locking down routes early prevents security debt (adding auth to unprotected routes is error-prone).
- Songs before playlists: playlists are a grouping of songs; the song catalog must exist and be searchable first.
- Filter/search before playlist save: validates the primary discovery workflow (find songs that share musical DNA) before building the save mechanism on top.
- UI polish last: drag-and-drop and visual refinements are independent of data correctness; ship functional first.

---

## Scalability Considerations

| Concern | At 500 songs (v1) | At 10K songs (growth) | At 100K+ songs (SaaS) |
|---------|-------------------|----------------------|----------------------|
| Full-text search | PostgreSQL FTS, GIN index, no external service | Same, still fast | Consider Typesense/Meilisearch sidecar |
| Filter queries | Indexed columns, single-digit ms | Add composite indexes (user_id, bpm) | Partitioning by user_id |
| Playlist reorder | DELETE + bulk INSERT per save | Same (playlists are small) | Same (bounded by playlist size, not total songs) |
| Multi-tenancy | Row-level user_id FK | Row-level + RLS policies (PostgreSQL) | Schema-per-tenant or dedicated DB for enterprise tiers |
| Auth | JWT in httpOnly cookie, no session store | Same; add refresh token rotation | Same + OAuth2 social login |
| Hosting | Single server / single Postgres instance | Managed Postgres (Supabase / Railway) | Read replicas, connection pooling (PgBouncer) |

---

## Sources

- PostgreSQL full-text search documentation (postgresql.org/docs) — HIGH confidence
- Standard join-table ordering patterns (explicit `position` integer) — HIGH confidence, established industry practice
- JWT httpOnly cookie security pattern — HIGH confidence, OWASP recommendations
- Row-level ownership isolation for SaaS — HIGH confidence, standard Postgres multi-tenant pattern
- chord_progressions as free text in v1 — architecture judgment based on stated scale constraints (< 500 songs)
