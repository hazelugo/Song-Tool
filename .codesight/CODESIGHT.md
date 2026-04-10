# song-tool — AI Context Map

> **Stack:** next-app, hono | drizzle | react | typescript

> 22 routes | 4 models | 29 components | 13 lib files | 5 env vars | 1 middleware | 54% test coverage
> **Token savings:** this file is ~3,100 tokens. Without it, AI exploration would cost ~35,800 tokens. **Saves ~32,800 tokens per conversation.**

---

# Routes

## CRUD Resources

- **`/api/playlists/[id]`** GET | PATCH/:id | DELETE/:id → [id]
- **`/`** GET | POST | DELETE/:id

## Other Routes

### next-app

- `GET` `/api/discovery` → out: { aiAvailable } [auth, db] ✓
- `POST` `/api/discovery` → out: { aiAvailable } [auth, db] ✓
- `GET` `/api/health` → out: { status, db } [db] ✓
- `DELETE` `/api/playlists/[id]/songs/[songId]` params(id, songId) → out: { error } [auth, db]
- `POST` `/api/playlists/[id]/songs` params(id) → out: { error } [auth, db]
- `PUT` `/api/playlists/[id]/songs` params(id) → out: { error } [auth, db]
- `GET` `/api/playlists/[id]/suggestions` params(id) → out: { error } [auth, db]
- `GET` `/api/playlists` → out: { data, total, page, limit } [auth, db] ✓
- `POST` `/api/playlists` → out: { data, total, page, limit } [auth, db] ✓
- `GET` `/api/similar` → out: { error } [auth, db]
- `PUT` `/api/songs/[id]` params(id) → out: { error } [auth, db]
- `DELETE` `/api/songs/[id]` params(id) → out: { error } [auth, db]
- `POST` `/api/songs/bulk` → out: { error } [auth, db]
- `GET` `/api/songs` → out: { data, total, page, pageSize } [auth, db] ✓
- `POST` `/api/songs` → out: { data, total, page, pageSize } [auth, db] ✓
- `GET` `/api/songs/search` → out: { error } [auth, db]

---

# Schema

### songs
- id: uuid (pk)
- userId: uuid (default, required, fk)
- name: text (required)
- artist: text
- bpm: integer (required)
- musicalKey: musicalKeyEnum (required)
- keySignature: keySignatureEnum (required)
- timeSignature: timeSignatureEnum (default, required)
- chordProgressions: jsonb (default, required)
- lyrics: text
- youtubeUrl: text
- spotifyUrl: text
- lyricsSearch: tsvector
- _relations_: tags: many(tags)

### tags
- id: uuid (pk)
- songId: uuid (fk, required)
- name: text (required)
- _relations_: songId -> songs.id, song: one(songs)

### playlists
- id: uuid (pk)
- userId: uuid (required, fk)
- name: text (required)
- _relations_: songs: many(playlistSongs)

### playlist_songs
- playlistId: uuid (fk, required)
- songId: uuid (fk, required)
- position: real (required)
- _relations_: playlistId -> playlists.id, songId -> songs.id

---

# Components

- **ChordsPage** [client] — `src/app/chords/page.tsx`
- **DiscoveryError** [client] — props: error, reset — `src/app/discovery/error.tsx`
- **DiscoveryPage** [client] — `src/app/discovery/page.tsx`
- **GlobalError** [client] — props: error, reset — `src/app/error.tsx`
- **RootLayout** — `src/app/layout.tsx`
- **LoginPage** [client] — `src/app/login/page.tsx`
- **MetronomePage** [client] — `src/app/metronome/page.tsx`
- **Home** — `src/app/page.tsx`
- **PlaylistEditorError** [client] — props: error, reset — `src/app/playlists/[id]/error.tsx`
- **LiveModePage** — props: params — `src/app/playlists/[id]/live/page.tsx`
- **PlaylistDetailPage** — props: params — `src/app/playlists/[id]/page.tsx`
- **PlaylistsError** [client] — props: error, reset — `src/app/playlists/error.tsx`
- **ViewPlaylistsPage** [client] — `src/app/playlists/page.tsx`
- **SongsError** [client] — props: error, reset — `src/app/songs/error.tsx`
- **SongsPage** [client] — `src/app/songs/page.tsx`
- **AppSidebar** [client] — `src/components/app-sidebar.tsx`
- **ChainCard** [client] — props: song, isSelected, isSeed, onClick — `src/components/discovery/chain-card.tsx`
- **SongCard** [client] — props: song, onClick, onFindSimilar — `src/components/discovery/song-card.tsx`
- **PageError** [client] — props: error, reset, context — `src/components/page-error.tsx`
- **PlaylistBuilder** [client] — props: availableSongs, onSave, initialName, initialItems, onClose, onDelete — `src/components/playlist-builder.tsx`
- **CsvImportDialog** [client] — props: onSuccess — `src/components/songs/csv-import-dialog.tsx`
- **DeleteConfirm** [client] — props: onConfirm, isDeleting — `src/components/songs/delete-confirm.tsx`
- **SongFilters** [client] — `src/components/songs/song-filters.tsx`
- **SongForm** [client] — props: defaultValues, onSubmit, isSubmitting, metronomeHref — `src/components/songs/song-form.tsx`
- **SongSheet** [client] — props: open, onOpenChange, song, onSuccess, onFindSimilar — `src/components/songs/song-sheet.tsx`
- **SongTable** [client] — props: data, onRowClick, isLoading, pageCount, pageIndex, onPageChange, sortingProp, onSortingChange — `src/components/songs/song-table.tsx`
- **TagInput** [client] — props: value, onChange, id — `src/components/songs/tag-input.tsx`
- **ThemeProvider** [client] — `src/components/theme-provider.tsx`
- **PlaylistViewPage** [client] — `tests/e2e/page.tsx`

---

# Libraries

- `src/hooks/use-mobile.ts` — function useIsMobile: () => void
- `src/lib/audio.ts`
  - function playTick: (accent, audioCtx, when) => void
  - function playChord: (frequencies, audioCtx, waveform) => ActiveChordNodes
  - function stopChord: (nodes, audioCtx) => void
  - type ActiveChordNodes
- `src/lib/auth.ts` — function requireUser: () => Promise<
- `src/lib/camelot.ts`
  - function getCamelotPosition: (musicalKey, keySignature) => CamelotPosition | null
  - function getKeyCompatibility: (key1, sig1, key2, sig2) => CompatibilityResult
  - function formatCamelot: (pos) => string
  - type CamelotPosition
  - type CompatibilityResult
- `src/lib/chords.ts`
  - function noteToFrequency: (semitone, octave) => number
  - function getDiatonicChords: (key, keySig) => ChordDef[]
  - interface ChordDef
  - const NOTE_SEMITONES: Record<MusicalKey, number>
- `src/lib/parse-prompt.ts` — function parsePrompt: (raw) => ParsedFilters, interface ParsedFilters
- `src/lib/ranking.ts` — function generateRank: (prev, next) => number, function rebalanceRanks: (items) => T[]
- `src/lib/similar-query.ts` — function buildSimilarQuery: (song) => string
- `src/lib/supabase/client.ts` — function createClient: () => void
- `src/lib/supabase/server.ts` — function createClient: () => void
- `src/lib/utils.ts` — function cn: (...inputs) => void
- `src/lib/validations/route.ts`
  - function GET: (_request, {...}) => void
  - function PUT: (request, {...}) => void
  - function DELETE: (_request, {...}) => void
- `src/proxy.ts` — function proxy: (request) => void, const config

---

# Config

## Environment Variables

- `BASE_URL` **required** — playwright.config.ts
- `CI` **required** — playwright.config.ts
- `DATABASE_URL` (has default) — .env.local
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` **required** — route.ts
- `NEXT_PUBLIC_SUPABASE_URL` **required** — route.ts

## Config Files

- `drizzle.config.ts`
- `next.config.ts`
- `tsconfig.json`

## Key Dependencies

- @supabase/supabase-js: ^2.99.1
- drizzle-orm: ^0.45.1
- hono: ^4.12.5
- next: 16.1.6
- react: 19.2.3
- zod: ^4.3.6

---

# Middleware

## auth
- auth — `src/lib/auth.ts`

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `src/db/schema.ts` — imported by **29** files
- `src/lib/utils.ts` — imported by **28** files
- `src/components/ui/button.tsx` — imported by **23** files
- `src/db/index.ts` — imported by **17** files
- `src/lib/validations/song.ts` — imported by **12** files
- `src/lib/auth.ts` — imported by **11** files
- `src/components/ui/input.tsx` — imported by **8** files
- `src/lib/camelot.ts` — imported by **6** files
- `src/components/ui/label.tsx` — imported by **6** files
- `src/components/page-error.tsx` — imported by **5** files
- `src/lib/supabase/server.ts` — imported by **3** files
- `src/components/ui/badge.tsx` — imported by **3** files
- `src/lib/audio.ts` — imported by **2** files
- `src/lib/supabase/client.ts` — imported by **2** files
- `src/lib/ranking.ts` — imported by **2** files
- `src/components/ui/skeleton.tsx` — imported by **2** files
- `src/lib/parse-prompt.ts` — imported by **1** files
- `src/lib/validations/filter.ts` — imported by **1** files
- `src/lib/chords.ts` — imported by **1** files
- `src/components/discovery/chain-card.tsx` — imported by **1** files

## Import Map (who imports what)

- `src/db/schema.ts` ← `route.ts`, `src/app/api/discovery/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts`, `src/app/api/playlists/[id]/songs/route.ts` +24 more
- `src/lib/utils.ts` ← `src/app/chords/page.tsx`, `src/app/discovery/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/discovery/chain-card.tsx` +23 more
- `src/components/ui/button.tsx` ← `src/app/discovery/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/app/page.tsx`, `src/app/playlists/[id]/page.tsx` +18 more
- `src/db/index.ts` ← `route.ts`, `src/app/api/discovery/route.ts`, `src/app/api/health/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts` +12 more
- `src/lib/validations/song.ts` ← `src/app/api/songs/[id]/route.ts`, `src/app/api/songs/bulk/route.ts`, `src/app/api/songs/route.ts`, `src/app/chords/page.tsx`, `src/app/metronome/page.tsx` +7 more
- `src/lib/auth.ts` ← `src/app/api/discovery/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts`, `src/app/api/playlists/[id]/songs/route.ts`, `src/app/api/playlists/[id]/suggestions/route.ts` +6 more
- `src/components/ui/input.tsx` ← `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/playlist-builder.tsx`, `src/components/songs/song-filters.tsx`, `src/components/songs/song-form.tsx` +3 more
- `src/lib/camelot.ts` ← `src/app/api/playlists/[id]/suggestions/route.ts`, `src/app/api/similar/route.ts`, `src/components/discovery/chain-card.tsx`, `src/components/discovery/song-card.tsx`, `src/components/ui/live-mode.tsx` +1 more
- `src/components/ui/label.tsx` ← `src/app/chords/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/playlist-builder.tsx`, `src/components/songs/song-filters.tsx` +1 more
- `src/components/page-error.tsx` ← `src/app/discovery/error.tsx`, `src/app/error.tsx`, `src/app/playlists/[id]/error.tsx`, `src/app/playlists/error.tsx`, `src/app/songs/error.tsx`

---

# Test Coverage

> **54%** of routes and models are covered by tests
> 8 test files found

## Covered Routes

- GET:/api/discovery
- POST:/api/discovery
- GET:/api/health
- GET:/api/playlists
- POST:/api/playlists
- GET:/api/songs
- POST:/api/songs
- GET:/
- POST:/
- DELETE:/

## Covered Models

- songs
- tags
- playlists
- playlist_songs

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_