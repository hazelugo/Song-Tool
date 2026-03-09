# Domain Pitfalls

**Domain:** Music metadata database and playlist builder web app
**Researched:** 2026-03-09
**Confidence:** HIGH (data modeling, auth patterns, ordering persistence are well-established); MEDIUM (BPM range matching strategies, chord progression search)

---

## Critical Pitfalls

Mistakes that cause rewrites or major architectural pain.

---

### Pitfall 1: Storing Chord Progressions as a Flat String

**What goes wrong:** Chord progressions are stored as a single text field (e.g., `"Am G F C"`). Searching works initially via LIKE or full-text, but filtering for "songs that use Am and G" requires fragile substring matching. Transposing to a different key requires application-level string parsing that becomes unmaintainable. Adding chord-level metadata (duration, voicing, slash chords) is impossible without a schema rewrite.

**Why it happens:** It feels simple at the start and maps naturally to how musicians write chord charts. The query `WHERE chords LIKE '%Am%'` appears to work until edge cases surface (e.g., "Am" matching "Amaj7", "Am7", "Camelot").

**Consequences:**
- Can't do "find songs containing chord X" queries without false positives
- Transposing the progression for a different key requires a full string parse and rewrite
- Adding structured data later (e.g., beats per chord, chord quality) requires a migration that touches every row
- Full-text search indexes on this field produce musically meaningless relevance scores

**Prevention:**
- Store chord progressions as a JSONB array of chord objects from day one: `[{"root": "A", "quality": "minor"}, {"root": "G", "quality": "major"}]`
- Alternatively: a normalized `song_chords` junction table with `(song_id, position, root, quality)`
- The JSONB approach is simpler for v1 and still allows GIN indexing for containment queries (`@>`)
- For display, serialize back to string in the application layer — do not rely on the stored string for logic

**Detection:** If you find yourself writing `LIKE '%Am%'` in a query, the schema is wrong.

**Phase:** Data modeling phase (must be correct before any songs are entered — migrating structured chord data from flat strings is painful).

---

### Pitfall 2: BPM as Exact Match Instead of Range

**What goes wrong:** The filter UI and underlying query use exact BPM equality (`WHERE bpm = 120`). Real-world song catalogues have BPM values like 118, 121, 119 for what is effectively "around 120." Users filter for 120, get zero results, and conclude the filter is broken.

**Why it happens:** Equality is the default filter pattern. BPM feels like a number, and numbers seem like they should match exactly.

**Consequences:**
- Filter returns empty or near-empty results for most queries, destroying the core value proposition
- Users start padding BPM values to round numbers to work around the filter, corrupting data quality
- Adding range search later requires changing the API contract, the UI, and potentially query logic

**Prevention:**
- Implement BPM filter as a range from day one: `WHERE bpm BETWEEN :min AND :max`
- Default the UI to a ±5 BPM tolerance slider or a range input (min/max)
- Store BPM as an integer (not float) — sub-BPM precision is meaningless for live set planning
- Index the `bpm` column for range queries

**Detection:** A filter result set of 0-1 songs for a catalogue of 100+ when filtering by BPM.

**Phase:** Core filtering phase (must be in place before user testing or data quality degrades).

---

### Pitfall 3: Playlist Order Stored as a Sequence Number That Drifts

**What goes wrong:** Drag-and-drop reordering is implemented by storing an integer `position` column on the `playlist_songs` table. Moving one song updates `position = 3`. After repeated reordering, you end up needing to update every row in the playlist to maintain consistent order (1, 2, 3, 4...). Under concurrent edits, two users swap positions and produce a collision.

**Why it happens:** Integer position columns are the first intuition. The first drag-and-drop feels like it works. Drift and collision problems only appear after many reorders.

**Consequences:**
- Frequent full-playlist position updates on every drag (N queries per reorder, not 1)
- Position collisions in multi-user scenarios produce non-deterministic ordering
- "Move to end" operations require knowing the current max position, which creates a race condition

**Prevention:**
- Use fractional indexing (also called lexicographic ordering): store position as a `float` or `text` value between the two adjacent items. Reorder inserts `(prev + next) / 2` — only one row update per drag.
- Alternatively: use a library like `fractional-indexing` (npm) that generates lexicographic keys between any two positions
- On persistence: only send the moved item's new position key to the server (one UPDATE, not N)
- Accept that fractional keys eventually need rebalancing (after ~50 consecutive inserts between the same two items, precision degrades) — add a rebalance endpoint called lazily

**Detection:** A reorder operation that generates more than 2 SQL UPDATE statements.

**Phase:** Playlist builder phase (must use fractional indexing before drag-and-drop is wired to the database — retrofitting is a migration).

---

### Pitfall 4: Multi-Tenant Data Leakage via Missing Tenant Scope

**What goes wrong:** Songs and playlists are scoped to a `user_id` or `group_id` foreign key. But several query paths omit the tenant filter: search endpoints, "get song by ID" lookups, playlist detail fetches. A user who guesses or enumerates an ID can read another user's songs or playlists.

**Why it happens:** The happy path (`SELECT * FROM songs WHERE user_id = ? AND id = ?`) is correct. But as features are added, shortcut queries appear: `SELECT * FROM songs WHERE id = ?` to avoid passing context, or API routes that skip auth middleware for "public" sub-routes.

**Consequences:**
- IDOR (insecure direct object reference) vulnerability: any authenticated user can read/modify any other user's data by guessing integer IDs
- When you reach SaaS scale (multiple paying bands), this is a critical breach

**Prevention:**
- Use UUIDs (not sequential integers) for all primary keys — dramatically reduces guessability
- Enforce tenant scoping at the database layer using Row Level Security (RLS) in Postgres/Supabase, not just in application code
- Write a test that: authenticates as User A, creates a song, then authenticates as User B and attempts to read that song by ID — assert 404 or 403
- Make the tenant ID a required parameter in every repository/service function signature, not an optional one
- Add a lint rule or code review checklist: "every query that touches user data must include tenant scope"

**Detection:** Any query in the codebase matching `WHERE id = $1` without a `AND user_id = $2` (or RLS equivalent).

**Phase:** Auth/data model phase (must be correct before any user data is stored — retrofitting RLS onto an existing schema requires table policy rewrites).

---

### Pitfall 5: Full-Text Search on Lyrics That Ignores Musical Context

**What goes wrong:** Full-text search is added as `WHERE lyrics ILIKE '%searchterm%'`. This works at 50 songs but becomes slow at 500+ and returns results with no ranking. Worse: it searches only lyrics, so a user searching "G major" or "120 BPM" gets no results. The search box and the filter system become two disconnected experiences.

**Why it happens:** ILIKE is the simplest implementation. "Search" and "filter" are treated as separate features implemented separately.

**Consequences:**
- Unindexed ILIKE on large text fields causes full table scans — slow at scale
- Users expect one search box to find songs by any property; two separate UIs (search + filter) creates UX confusion
- Relevance ranking is absent — a lyric match at position 1 is treated the same as position 500

**Prevention:**
- Use Postgres `tsvector`/`tsquery` full-text search with a GIN index on the `lyrics` column from the start
- Separate concerns clearly in the UI: "metadata filter" (BPM, key, chords — structured) vs "lyric search" (unstructured text) — do not try to unify them in v1
- Add a `search_vector` generated column that concatenates song name + lyrics for combined FTS
- At scale: consider pg_trgm for fuzzy matching on song names (typo-tolerant)
- Do NOT use Elasticsearch or a separate search service in v1 — Postgres FTS handles 10K songs comfortably

**Detection:** Any `ILIKE '%...%'` in production query paths, or a query plan showing "Seq Scan" on the songs table for text searches.

**Phase:** Song database phase (add GIN index and tsvector column when building the song schema — adding it later requires an index build on existing data, which locks the table briefly).

---

## Moderate Pitfalls

---

### Pitfall 6: Musical Key Stored as Free Text

**What goes wrong:** The "key" field is stored as a plain text string with no normalization. Users enter "C major", "C Major", "c maj", "CMaj", "C" for the same key. Filtering by key returns inconsistent results because string equality doesn't equate these.

**Prevention:**
- Enumerate valid keys as a controlled vocabulary — 12 chromatic roots × major/minor = 24 values
- Use a select/dropdown in the UI instead of a free-text input
- Store as a normalized enum: `root` (C, C#, D, Eb...) + `mode` (major, minor, dorian, etc.)
- Reject free-text key input at the API layer

**Detection:** Running `SELECT DISTINCT key FROM songs` returns more than 30 distinct values.

**Phase:** Data model phase (fix before users enter data).

---

### Pitfall 7: Auth Token Not Propagated to All API Routes

**What goes wrong:** Some API routes (especially "utility" endpoints like BPM lookup, key suggestions, or song metadata pre-fill) are built without auth middleware because they "don't need it." These become unauthenticated endpoints that leak data or accept unauthenticated writes.

**Prevention:**
- Apply auth middleware globally at the router/framework level as the default — opt out explicitly, not opt in
- Document which routes are intentionally public (currently: none)
- Add integration test: unauthenticated request to every route should return 401

**Detection:** Any route registered outside the authenticated router group.

**Phase:** Auth setup phase (establish the pattern before routes are built).

---

### Pitfall 8: Playlist Saving Without Snapshot vs. Reference Decision

**What goes wrong:** Playlists are saved as references to song IDs. A song is later edited (BPM changes, key changes). The saved playlist now reflects the edited song, not the song as it was when the playlist was built. For a live set, this is a correctness bug — the band rehearsed based on the old values.

**Prevention:**
- Make an explicit decision: playlists are "live references" (always show current song data) or "snapshots" (freeze song data at save time)
- For a live set planning tool, "live references" is almost always the right choice — you want edits to propagate
- Document this decision in code comments so future developers don't accidentally add snapshot behavior
- If snapshot behavior is later needed (e.g., "archive this setlist as performed"), add a `snapshot_json` column as an optional field

**Detection:** A user edits a song and asks "will this change my saved setlists?" — if the answer is unclear, the decision wasn't made.

**Phase:** Playlist feature phase.

---

### Pitfall 9: Drag-and-Drop Only Persists on Drop, Not on Server Confirmation

**What goes wrong:** Drag-and-drop reorder updates the UI immediately (optimistic update) but persists to the server asynchronously. If the server request fails silently (network blip, auth timeout), the UI shows the new order but the database has the old order. On next page load, the order reverts — confusing users.

**Prevention:**
- Show a subtle "saving..." / "saved" / "failed to save" indicator tied to the persistence request
- On failure, roll back the UI to the pre-drag order and show an error message
- Don't queue multiple rapid drags without debouncing — send one persistence request after the user stops dragging (300ms debounce)

**Detection:** Rapid drag-and-drop followed by a page refresh produces a different order than the UI showed.

**Phase:** Playlist builder phase.

---

## Minor Pitfalls

---

### Pitfall 10: YouTube/Spotify URLs Stored Without Validation

**What goes wrong:** URLs are stored as plain text with no format validation. Users paste the wrong thing (a search URL, a playlist URL, a shortened URL) and the link "works" (opens something) but not the intended song. Debugging why a link is wrong requires opening every link.

**Prevention:**
- Validate YouTube URLs on input: must match `youtube.com/watch?v=` or `youtu.be/` patterns
- Validate Spotify URLs: must match `open.spotify.com/track/` pattern
- Store the validated canonical URL, not the raw input
- Show a preview thumbnail or track name if the API is available (optional enhancement)

**Detection:** A `youtube.com/playlist?` or `spotify.com/album/` URL in the `youtube_url` or `spotify_url` columns.

**Phase:** Song form phase (add validation when building the input form).

---

### Pitfall 11: BPM and Chord Filters Are AND-ed When OR Would Be More Useful

**What goes wrong:** Multi-field filters default to AND logic (songs matching ALL filter criteria). A user filtering "G major AND Am chord AND 120 BPM" gets very few results. The intent is usually "find songs with these shared properties" — sometimes AND, sometimes OR, sometimes "at least 2 of 3."

**Prevention:**
- For v1, AND logic is simpler and usually correct for the core use case (building a flowing set)
- Document the filter logic explicitly in the UI ("showing songs matching ALL selected filters")
- Design the filter UI so users can easily remove individual filters to broaden results
- Defer OR/fuzzy logic to a later milestone

**Detection:** User feedback that filters return too few results despite a large catalogue.

**Phase:** Filter UI phase.

---

### Pitfall 12: No Soft Delete — Hard Deletes Break Playlist Integrity

**What goes wrong:** Songs are hard-deleted from the database. Playlists that referenced the deleted song now have a broken foreign key or a dangling reference. On load, the playlist either errors or silently drops the song.

**Prevention:**
- Use soft delete: add a `deleted_at` timestamp column to songs; filter `WHERE deleted_at IS NULL` in all queries
- Playlists referencing a soft-deleted song can display a "Song removed" placeholder without breaking
- Add a CASCADE strategy decision: deleting a song could remove it from all playlists or leave a placeholder

**Detection:** A playlist that has fewer songs than when it was saved, with no user action to explain the difference.

**Phase:** Data model phase (add `deleted_at` to the schema before any song data is entered).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial schema design | Chord progressions as flat string | Use JSONB array from day one |
| Initial schema design | Key as free text | Use enum/controlled vocabulary |
| Initial schema design | Hard deletes | Add `deleted_at` column at schema creation |
| Song data entry form | BPM exact match | Build range filter before v1 user testing |
| Song data entry form | URL type validation | Validate YouTube/Spotify patterns on input |
| Auth setup | Missing tenant scope on queries | RLS + UUID PKs before any data is stored |
| Auth setup | Opt-in auth middleware | Apply auth globally, opt-out intentionally |
| Full-text search | ILIKE on lyrics | GIN-indexed tsvector from the start |
| Playlist builder | Integer position drift | Fractional indexing before drag-and-drop is wired |
| Playlist builder | Silent persistence failure | Optimistic UI with rollback on error |
| Playlist builder | Live reference vs. snapshot ambiguity | Decide and document before implementation |
| SaaS migration | Data leakage via missing tenant filter | Integration test for IDOR on every entity |

---

## Sources

- Confidence on data modeling pitfalls (chord progressions, BPM, key normalization): HIGH — these are well-established relational data modeling principles applied to the music domain, consistent across SQL design references and music app post-mortems.
- Confidence on fractional indexing for drag-and-drop ordering: HIGH — the `fractional-indexing` pattern is documented in the Linear blog and widely referenced in list-ordering implementations.
- Confidence on Postgres FTS vs. ILIKE: HIGH — Postgres documentation explicitly recommends tsvector/GIN over LIKE for text search; covered in official Postgres docs.
- Confidence on RLS for multi-tenancy: HIGH — Supabase and Postgres documentation explicitly recommend RLS for row-level tenant isolation.
- Confidence on IDOR via sequential integer IDs: HIGH — OWASP IDOR documentation and common SaaS security audit findings.
- Confidence on playlist reference vs. snapshot decision: MEDIUM — domain-specific judgment based on common patterns in setlist management tools; no single authoritative source.
