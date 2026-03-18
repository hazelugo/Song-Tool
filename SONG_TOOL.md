# Song Tool — Project Documentation

## Overview

Song Tool is a web application built for working musicians who need to manage a live song catalog efficiently. The core use case is practical: a performer or band needs to find the right song fast — by tempo, key, mood, or chord — and build a setlist under time pressure. The interface is designed to feel like a professional tool, not a consumer app.

**Design philosophy:** Dense, scannable, and dark-native. Inspired by DAW interfaces (Ableton, Logic Pro) — functional, keyboard-friendly, and respectful of the user's time. Color is used only for meaning (status, focus, destructive actions). Musical data — BPM, key, time signature, chords — is always typographically prominent.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| UI Components | shadcn/ui v4 |
| Styling | Tailwind CSS v4 |
| Auth | Supabase Auth |
| AI | Google Gemini 2.5 Flash (function calling) |
| Testing | Playwright |
| Deployment | Vercel |

---

## Application Pages

### Landing Page (`/`)

The entry point. Introduces the app with a hero headline ("Your catalog, under control"), a brief tagline, and three navigation buttons — **Browse Songs**, **Discovery**, **Playlists**. A static data strip at the bottom previews the kind of musical metadata the tool manages: BPM, Key, Time Signature, Camelot position.

---

### Songs (`/songs`)

The primary catalog view. All songs belonging to the authenticated user are displayed in a sortable, paginated table (25 per page). This is the main working screen.

**What you can do here:**

- **Browse** the full catalog, sorted by name, BPM, key, key signature, time signature, or date added
- **Filter** using the DAW-style filter strip at the top (see Filter Panel below)
- **Add** a new song via the Add Song sheet
- **Edit** any song by clicking its row — opens the same sheet pre-populated
- **Import** multiple songs at once via CSV upload
- **Build a playlist** from the currently filtered set of songs
- **Find similar songs** to any song via the Discovery AI (navigates to `/discovery` with a pre-filled prompt)

**Empty states:**
- If the catalog is empty: "No songs yet" with an Add Song button
- If filters return no results: "No songs match your filters" with a Clear Filters button

---

### Filter Panel (used on `/songs`)

A compact horizontal toolbar that drives all song filtering via URL query parameters. All filter state lives in the URL, so links are shareable and filters survive navigation.

**Available filters:**

| Filter | Type | Behavior |
|---|---|---|
| BPM Min / Max | Number | Range filter; shows inline error if min > max |
| Key | Dropdown | Exact match from all 17 musical keys |
| Mode | Dropdown | Major or minor |
| Time Signature | Dropdown | 12 supported time signatures |
| Chord | Text | Case-insensitive substring match on chord progressions |
| Tag | Text | Case-insensitive substring match on song tags |
| Title / Lyrics | Text | Searches song name (ILIKE) and full lyric text (PostgreSQL FTS) |

Text inputs are debounced (300ms) to avoid excessive API calls while typing. A **Clear** button appears in the strip whenever any filter is active and resets all filters in one action.

---

### Discovery (`/discovery`)

AI-powered natural language song search. Instead of setting filters manually, the user types a plain English description of what they're looking for.

**Examples:**
- "upbeat major key songs around 120 BPM"
- "dark minor ballads with piano"
- "something in F# minor with a slow groove"

The prompt is sent to **Gemini 2.5 Flash** via function calling. Gemini extracts structured filters (key, mode, time signature, BPM range, search term) and the app queries the database accordingly. The interpreted filters are displayed above the results so the user can verify what was understood.

**Preset chips** below the search bar offer one-tap starting points (Upbeat & Energetic, Dark Minor Ballad, etc.).

Results can be saved as a new playlist directly from this page.

> Requires `GEMINI_API_KEY` to be configured in the environment.

---

### Playlists (`/playlists`)

A paginated list of all saved playlists. Each playlist shows its name and last-updated date. Clicking a playlist opens its detail page. Playlists can be deleted inline (with a confirmation loading state).

The **+ New Playlist** button loads all songs (up to 1000) and opens the Playlist Builder.

---

### Playlist Detail (`/playlists/[id]`)

The full editor for a single playlist.

**Features:**

- **Rename** the playlist inline
- **Reorder songs** by drag and drop (dnd-kit, with an 8px activation threshold to prevent accidental drags)
- **Add songs** via the Add Songs dialog (only shows songs not already in the playlist)
- **Smart Suggestions** panel: recommends songs from the catalog based on Camelot key compatibility with songs already in the playlist
- **Export** the playlist as CSV, JSON, or a print-ready setlist (with or without lyrics)
- **Live Mode** button: enters the full-screen performance view (only shown when the playlist has songs)

---

### Live Mode (`/playlists/[id]/live`)

A full-screen, tablet-optimized presentation view designed for use on stage or in rehearsal.

**What it shows for each song:**
- Large song name
- Data strip: BPM · Key · Camelot position · Time Signature
- Chord progressions
- Tags

**Navigation:**
- Large left/right chevron buttons on either side
- Keyboard: `←`/`↑` for previous, `→`/`↓`/`Space` for next
- Progress dots at the bottom for playlists up to 24 songs (click any dot to jump)
- Song counter in the top bar (e.g., "3 / 15")

**Lyrics toggle:**
- A `Lyrics` button appears in the top bar if the current song has lyrics
- Tap it (or press `L`) to switch to a scrollable lyrics view, which also shows a compact header with key/Camelot/BPM
- Automatically returns to the data view when advancing to the next song

Exiting via the `×` button returns to the playlist detail page.

---

### Metronome (`/metronome`)

A standalone tempo reference tool using the Web Audio API.

- BPM input (40–240) with a slider
- 12 time signatures supported
- Visual beat indicators (beat 1 is highlighted)
- Precise scheduling via a lookahead scheduler (25ms interval, 0.1s schedule-ahead window) to avoid timing drift
- Keyboard shortcuts: arrow keys to adjust BPM, space to navigate
- State persists in URL parameters (`?bpm=120&timeSig=4/4`)

---

## Data Model

### `songs`

The core table. Each row represents one song in a user's catalog.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (auth user) |
| `name` | text | Song title |
| `bpm` | integer | Tempo (1–500) |
| `musical_key` | enum | 17 values: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B |
| `key_signature` | enum | major / minor |
| `time_signature` | enum | 12 values: 4/4, 3/4, 6/8, 5/4, 7/8, etc. |
| `chord_progressions` | JSONB | Array of chord strings (e.g., `["Am", "F", "C", "G"]`) |
| `lyrics` | text | Full lyric text (optional) |
| `youtube_url` | text | Optional YouTube link |
| `spotify_url` | text | Optional Spotify link |
| `lyrics_search` | tsvector | Generated column for full-text search |
| `created_at` | timestamp | |
| `updated_at` | timestamp | Auto-updated on change |
| `deleted_at` | timestamp | Soft delete — null means active |

### `tags`

Freeform labels attached to songs. Many-to-one with songs, cascade deleted.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `song_id` | UUID | FK → songs |
| `name` | text | Lowercase, trimmed |

### `playlists`

Named, ordered collections of songs.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | Owner |
| `name` | text | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | Soft delete |

### `playlist_songs`

Join table between playlists and songs. Position uses a real number for fractional indexing — drag-and-drop reordering requires only a single-row UPDATE rather than renumbering all positions.

| Column | Type | Notes |
|---|---|---|
| `playlist_id` | UUID | FK → playlists (cascade delete) |
| `song_id` | UUID | FK → songs (no cascade — soft-deleted songs stay in playlists) |
| `position` | real | Fractional index for ordering |

---

## API Routes

### `GET /api/songs`

Returns a paginated, filtered, sorted list of songs for the authenticated user.

**Query parameters:**

| Param | Description |
|---|---|
| `bpmMin` / `bpmMax` | BPM range (integer) |
| `key` | Musical key (exact match) |
| `keySig` | `major` or `minor` |
| `timeSig` | Time signature (exact match) |
| `chord` | Substring match on chord progressions (ILIKE on JSONB cast to text) |
| `lyric` | OR search: song name (ILIKE) + lyrics full-text (`websearch_to_tsquery`) |
| `tag` | Substring match on tags via EXISTS subquery (avoids row duplication) |
| `sort` | Column: `name`, `bpm`, `musicalKey`, `keySignature`, `timeSignature`, `createdAt` |
| `sortDir` | `asc` or `desc` |
| `page` | Page number (1-based, default 1) |
| `limit` | Page size (default 25, max 1000) |

**Response:** `{ data: SongWithTags[], total: number, page: number, pageSize: number }`

### `POST /api/songs`

Creates a new song. Validates the body against the song schema (Zod). Chord progressions are parsed from a comma/space-separated string into a `string[]` array. Tags are inserted in the same database transaction.

### `POST /api/songs/bulk`

Bulk creates songs from a validated array (used by the CSV import flow). Runs all inserts in a single transaction.

### `GET /api/songs/[id]`, `PUT /api/songs/[id]`, `DELETE /api/songs/[id]`

Standard single-song read, update, and soft-delete operations.

### `POST /api/discovery`

Accepts a natural language prompt (max 500 chars). Calls Gemini 2.5 Flash with a `extract_filters` function declaration. Gemini returns structured filter values; the API validates them against known enum values, builds a Drizzle query, and returns matching songs plus the parsed filter summary.

**Response:** `{ results: SongWithTags[], parsedFilters: Filters }`

### `GET /api/playlists`, `POST /api/playlists`

List (paginated) and create playlists.

### `GET /api/playlists/[id]`, `PUT /api/playlists/[id]`, `DELETE /api/playlists/[id]`

Read, update (name or song order), and soft-delete a playlist.

### `POST /api/playlists/[id]/songs`, `DELETE /api/playlists/[id]/songs/[songId]`

Add or remove a song from a playlist.

### `GET /api/playlists/[id]/suggestions`

Returns up to 5 songs from the catalog not already in the playlist, ranked by Camelot key compatibility with the songs currently in the playlist.

---

## Camelot Wheel

The Camelot Wheel is a harmonic mixing system used by DJs and music producers to identify keys that sound good together. Each of the 24 major/minor keys is assigned a number (1–12) and letter (A = minor, B = major).

**Compatibility rules:**
- **Score 3 — Perfect match:** Same Camelot position (same key)
- **Score 2 — Compatible:** Same number, different letter (relative major/minor, e.g., 8A ↔ 8B), or same letter, adjacent number (e.g., 8B ↔ 9B, wraps 1↔12)
- **Score 0 — Incompatible:** Everything else

This scoring drives the Smart Suggestions panel on the playlist detail page and the key compatibility display in Live Mode.

---

## CSV Import

Songs can be imported in bulk via a `.csv` file. The import dialog provides a drag-and-drop upload zone, parses the file client-side, validates each row against the song schema (Zod), and shows a preview table before committing.

**Required columns:** `name`, `bpm`, `key`, `keySig`
**Optional columns:** `timeSig` (defaults to 4/4), `chords`, `lyrics`, `youtube`, `spotify`, `tags`

Column headers are normalized (case-insensitive, whitespace-stripped). Tags can be semicolon or comma separated. Invalid rows are shown in the preview and skipped on import — valid rows are imported regardless.

---

## Export Formats

From any playlist detail page:

| Format | Contents |
|---|---|
| **CSV** | Song name, BPM, key, key signature, tags |
| **JSON** | Full playlist object with song metadata and export timestamp |
| **Print Setlist** | Browser print dialog — table layout with song name, BPM, key, time signature |
| **Print with Lyrics** | One song per printed page — includes all metadata plus full lyrics |

---

## Full-Text Search

Lyrics are indexed using PostgreSQL's built-in full-text search via a **generated `tsvector` column** (`lyrics_search`) that is automatically kept in sync with the `lyrics` column.

Queries use `websearch_to_tsquery` (not `to_tsquery`) because it handles raw user input gracefully — partial words, special characters, and conjunctions — without throwing a syntax error.

The Title/Lyrics filter searches both the song name (via `ILIKE`) and the lyrics index (via `@@`) in a single `OR` condition.

---

## Authentication

Authentication is handled by **Supabase Auth**. All API routes and server components verify the session and reject unauthorized requests. Song and playlist queries are always scoped to the authenticated user's ID — users can only see and modify their own data.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase transaction pooler, port 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (used client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (used client-side) |
| `GEMINI_API_KEY` | Google Gemini API key — required for Discovery AI search |

> The `DATABASE_URL` must use `postgres({ prepare: false })` in the Drizzle client because Supabase's transaction pooler does not support prepared statements.
