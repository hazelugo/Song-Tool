# Feature Landscape

**Domain:** Music metadata database and playlist builder web app
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on domain knowledge of comparable tools; WebSearch unavailable in this session)

---

## Context: What This Product Is

A web-based tool for musicians and bands to catalog songs with musical metadata (BPM, key, key signature, chord progressions, lyrics, streaming URLs) and build setlists or playlists by filtering on shared musical properties. Target user: bands doing setlist planning, not general consumers.

Comparable products researched (from training data knowledge):
- **DJ tools:** Rekordbox, Serato, Traktor — heavy on BPM/key analysis, filtering, harmonic mixing
- **Setlist builders:** Setlist.fm, Setlist Helper, Bandhelper — song management, set ordering, notes
- **Music library managers:** iTunes/Music, Musicbrainz Picard, beets — metadata organization, tagging
- **Lyric/chord apps:** Ultimate Guitar, Chordify, OnSong — chord charts, lyrics, transposition
- **General playlist tools:** Spotify, Apple Music — filtering, queuing, smart playlists

---

## Table Stakes

Features users expect in this category. Missing = product feels incomplete or users seek alternatives.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add/edit/delete songs | Core CRUD — without it there is no product | Low | Required fields: name, BPM, key, key signature, chord progressions |
| BPM field per song | Every music tool in this space stores BPM | Low | Integer or decimal; range typically 60–220 |
| Musical key field per song | Harmonic mixing and key-matching is baseline expectation | Low | Must support all 12 keys (C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B) |
| Key signature field | Separate from key (e.g. key of A minor vs A major); expected in band contexts | Low | Major/minor at minimum; extended modes optional |
| Chord progressions field | Core differentiator of this tool — expected by the target user | Medium | Free text or structured (see differentiators) |
| Lyrics field | Expected in band/setlist tools; enables rehearsal reference | Low | Free text, possibly long-form |
| Search/filter songs by metadata | Without filtering, the catalog is just a list | Medium | Filter by BPM range, exact key, key signature, chord pattern |
| Sort results by any column | Standard in any list/table UI | Low | BPM ascending/descending, alphabetical by name, etc. |
| Named playlists / setlists | Core output of the workflow — saving a filtered/ordered list | Medium | Create, name, view, delete |
| View saved playlists | Must be able to retrieve and use what was saved | Low | List view of playlists, click to open |
| Manual drag-and-drop ordering | Expected in setlist tools for fine-tuning set order | Medium | Within a playlist after filtering/sorting |
| User login / authentication | Multi-user shared database requires accounts | Medium | Email/password minimum; supports small groups sharing a database |
| Lyric keyword search | "What songs have the word 'fire' in the chorus" — expected by bands | Medium | Full-text search against lyrics field |
| Link to streaming source per song | Bands use YouTube/Spotify to reference recordings | Low | URL field, opens in new tab — no API required |
| Responsive web interface | Must work on phones/tablets for use at rehearsal | Medium | Not native app, but must be usable on mobile |

---

## Differentiators

Features that distinguish this product from generic playlist tools. Not expected by default, but high value to the target user.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Chord progression matching/filtering | Find all songs using I-IV-V or "same changes as Song X" — unique to this tool | High | Requires structured chord entry OR smart text parsing; fuzzy matching vs exact |
| Harmonic key compatibility filter | Show songs in keys that are harmonically adjacent (Camelot wheel / circle of fifths) — common in DJ tools, rare in band tools | High | Requires Camelot wheel or circle-of-fifths logic; "keys that sound good next to G major" |
| BPM range filter (not just exact) | "Find songs between 100–110 BPM" — more useful than exact match | Low | Simple range input; expected in DJ tools but not all setlist apps |
| Multiple streaming links per song | YouTube for full recording + Spotify for reference — some songs have both | Low | Two URL fields (YouTube, Spotify) is already in spec; could extend to Soundcloud etc. |
| Inline lyric preview in search results | See lyric snippet in results without opening song — speeds rehearsal workflow | Medium | Highlighted match excerpt shown in result row |
| Transposition indicator | "This song is in G but we play it in Eb — what key is that?" — useful for cover bands | Medium | UI math: offset all keys by N semitones; doesn't change stored data |
| Set pacing / energy arc notes | Annotate playlist with "slow section here" or "key change warning" — used in Bandhelper | Low | Simple notes field on playlist, not per-song |
| Song tags / custom categories | Freeform tags like "ballad", "opener", "crowd-pleaser" — enables secondary filtering | Low | Tag array per song; multi-select filter |
| Duplicate/clone song | Same song in different keys or tempos — useful for bands that play arrangements | Low | Copy song record, modify fields |
| Export setlist to PDF or text | Print setlist for the stage — essential for live use | Medium | Simple template render; no layout complexity needed |
| "Similar songs" suggestion | After saving a setlist, suggest songs with matching BPM/key not yet included | High | Algorithmic; requires scoring function; good for v2 |
| Per-user vs shared song library | One user's personal songs vs band-wide shared catalog | High | Multi-tenant architecture concern; deferrable to SaaS phase |

---

## Anti-Features

Features to deliberately NOT build in v1, with rationale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Spotify API playlist creation | OAuth complexity, rate limits, token management, API changes — high maintenance for marginal value | Let users open Spotify links individually; "copy setlist to clipboard" is sufficient |
| Auto-fetch YouTube/Spotify metadata | API keys, quota limits, legal ambiguity, maintenance burden | Require manual URL entry — user pastes their own links |
| Audio playback within the app | Significant complexity (licensing, streaming, storage); competing with Spotify/YouTube | Open external links in new tab |
| Auto-BPM detection from audio | Requires audio upload, processing pipeline, storage — massive scope increase | Manual BPM entry; users typically know their songs' BPM |
| Auto-key detection from audio | Same as above; adds ML/audio processing complexity | Manual key entry |
| Social features (follow, share, public profiles) | Not the core use case; adds complexity, moderation needs | Build for small private groups first |
| Mobile native app (iOS/Android) | Doubles build/maintenance cost; responsive web covers rehearsal use case | Responsive web only |
| Music streaming integration (listen within app) | Licensing, infrastructure, competing with streaming platforms | Link to external platforms |
| Complex subscription/billing in v1 | Distracts from core product validation | Defer to SaaS milestone; use single shared login for now |
| Real-time collaboration editing | Conflict resolution, websockets, operational transforms — CRDTs are hard | Shared database with simple auth is sufficient for small groups |
| Chord chart rendering / tab notation | Sheet music rendering is a deep domain (VexFlow, LilyPond etc.) | Store chord progressions as plain text; display as-is |
| AI song recommendations | Undifferentiated; adds model/API cost; not what bands need | Manual curation is the point — bands know their catalog |

---

## Feature Dependencies

```
User login/auth
  └── Multi-user access to shared song database
        └── Per-user vs shared library (deferred to SaaS phase)

Add song (with all fields)
  └── Lyrics field
        └── Lyric keyword search
  └── BPM field
        └── BPM range filter
        └── "Similar songs" suggestion (deferred)
  └── Key field
        └── Harmonic key compatibility filter (differentiator)
        └── Transposition indicator (differentiator)
  └── Chord progressions field
        └── Chord progression matching/filter (differentiator)
  └── YouTube URL field
        └── Link opens in new tab (table stakes)
  └── Spotify URL field
        └── Link opens in new tab (table stakes)

Search/filter songs
  └── Sort by column
  └── Drag-and-drop reordering
        └── Save as named playlist
              └── View saved playlists
                    └── Export setlist to PDF/text (differentiator)
```

---

## MVP Recommendation

**Prioritize for v1:**

1. Song CRUD with all metadata fields (BPM, key, key signature, chord progressions, lyrics, YouTube URL, Spotify URL)
2. Filter songs by BPM range, exact key, key signature — these are the primary discovery vectors
3. Lyric keyword search — fast to implement, high utility for bands
4. Sort by any column + drag-and-drop ordering within results
5. Save named playlist from current filtered/ordered view
6. View saved playlists; open individual song links
7. User login (email/password; small-group shared access)

**Defer to v2:**

- Chord progression structured matching (complex UX problem — how do you enter "I-IV-V"? Roman numerals? Named chords? Needs design work)
- Harmonic key compatibility filter (Camelot wheel) — high value but requires extra data modeling
- Export setlist to PDF — useful but not blocking MVP validation
- Song tags — easy to add but not needed for core workflow
- Transposition indicator — nice-to-have for cover bands

**Never build (anti-features above):**
- Auto-fetch, audio processing, social features, streaming integration

---

## Chord Progressions Field — Special Note

This field is unique to this product and deserves design attention before implementation. Options:

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| Free text ("G D Em C") | Simple to implement, flexible | Hard to filter/match programmatically | Good for v1 |
| Roman numeral notation ("I V vi IV") | Key-agnostic, musically correct | Requires UX education; harder to parse | Good for v2 |
| Structured chord array | Enables exact/fuzzy matching | Complex data model + entry UX | Defer to v2 |

**v1 recommendation:** Store as free text. Allow lyric-style search against it (keyword match). Filtering by exact chord progression string is a v2 problem once you understand how users actually enter data.

---

## Sources

- Domain knowledge from training data (Rekordbox, Serato, Bandhelper, Setlist.fm, Spotify, Ultimate Guitar feature sets)
- Project spec: `/Users/hector/Documents/Song Tool/.planning/PROJECT.md`
- Confidence: MEDIUM — WebSearch was unavailable; findings are based on well-established domain knowledge of music software categories. Core table stakes and anti-features are HIGH confidence. Differentiator ordering is MEDIUM confidence and should be validated with target users.
