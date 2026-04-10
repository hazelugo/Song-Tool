# Requirements: Song Tool

**Defined:** 2026-03-09
**Core Value:** Find songs that share musical DNA — match by BPM, key, key signature, or chord progressions — so building a set that flows is fast and musical.

## v1 Requirements

Requirements for initial release. Each maps to a roadmap phase.

**Note:** v1 is a shared, open database — no authentication required. Anyone with the URL can add, edit, and view songs and playlists. Auth and accounts move to v2.

### Songs

- [ ] **SONG-01**: User can add a song with required fields: name, BPM (integer), key (dropdown of 12 keys), key signature (major/minor dropdown), chord progressions (free text)
- [ ] **SONG-02**: User can add optional fields per song: lyrics (long text), YouTube URL, Spotify URL
- [ ] **SONG-03**: User can add one or more freeform tags to a song (e.g. "opener", "ballad", "crowd-pleaser")
- [ ] **SONG-04**: User can edit any field of an existing song
- [ ] **SONG-05**: User can delete a song from the database
- [ ] **SONG-06**: User can view all songs in a paginated table with key metadata columns visible

### Discovery

- [ ] **DISC-01**: User can filter songs by BPM range (set minimum and maximum BPM values)
- [ ] **DISC-02**: User can filter songs by musical key (select from the 12-key dropdown)
- [ ] **DISC-03**: User can filter songs by key signature (major or minor)
- [ ] **DISC-04**: User can filter songs by chord progression (keyword text match against the chord progressions field)
- [ ] **DISC-05**: User can search songs by lyric keyword or phrase (full-text search)
- [ ] **DISC-06**: User can filter songs by tag
- [ ] **DISC-07**: User can apply multiple filters simultaneously and see combined results
- [ ] **DISC-08**: User can sort filtered results by any column (BPM, name, key, etc.) in ascending or descending order

### Playlists

- [x] **PLAY-01**: User can save the current filtered and ordered song list as a named playlist
- [x] **PLAY-02**: User can view a list of all saved playlists
- [x] **PLAY-03**: User can open a saved playlist and see all its songs in saved order
- [x] **PLAY-04**: User can reorder songs within a saved playlist via drag-and-drop
- [ ] **PLAY-05**: User can open a song's YouTube or Spotify link from within a playlist view (opens in new tab)
- [ ] **PLAY-06**: User can remove a song from a playlist without deleting the song from the database
- [ ] **PLAY-07**: User can delete a saved playlist

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication & Accounts

- **AUTH-01**: User can create an account with email and password
- **AUTH-02**: User can log in and session persists across browser refresh
- **AUTH-03**: User can log out from any page
- **AUTH-04**: User can reset password via email link

### Discovery (Advanced)

- **DISC-ADV-01**: User can filter by harmonically compatible keys (circle of fifths / Camelot wheel)
- **DISC-ADV-02**: User can filter by chord progressions using structured notation (Roman numerals, Nashville Number System)
- **DISC-ADV-03**: BPM tolerance slider — enter a target BPM and adjust the ±N tolerance with a slider

### Playlists (Advanced)

- **PLAY-ADV-01**: User can export a playlist to PDF or plain text for printing
- **PLAY-ADV-02**: User can add freeform notes to a playlist (e.g. "slow section here", "key change warning")
- **PLAY-ADV-03**: User can duplicate a song record to create an alternate arrangement

### SaaS & Multi-tenancy

- **SAAS-01**: Users can belong to a band/group with a shared song library
- **SAAS-02**: Group admin can invite members via email
- **SAAS-03**: Subscription billing (Stripe) — bands pay for shared access
- **SAAS-04**: Per-user personal library separate from shared band library

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auto-fetch YouTube/Spotify metadata | API keys, quotas, legal risk — manual URL entry is sufficient |
| Spotify API playlist creation | OAuth complexity for marginal value — open links individually instead |
| Audio playback within the app | Licensing, infrastructure — use external streaming links |
| Auto-BPM / auto-key detection from audio | Requires audio upload + ML pipeline — massive scope for v1 |
| Social features (public profiles, sharing) | Not core use case; adds moderation complexity |
| Mobile native app (iOS/Android) | Doubles build cost; responsive web covers rehearsal use case |
| Real-time collaborative editing | WebSockets/CRDT complexity — shared DB with auth is sufficient |
| Chord chart / tab notation rendering | Deep domain (VexFlow, LilyPond) — store as plain text and display as-is |
| AI song recommendations | Adds model cost; manual curation is the point |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SONG-01 | Phase 2 | Pending |
| SONG-02 | Phase 2 | Pending |
| SONG-03 | Phase 2 | Pending |
| SONG-04 | Phase 2 | Pending |
| SONG-05 | Phase 2 | Pending |
| SONG-06 | Phase 2 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| DISC-05 | Phase 3 | Pending |
| DISC-06 | Phase 3 | Pending |
| DISC-07 | Phase 3 | Pending |
| DISC-08 | Phase 3 | Pending |
| PLAY-01 | Phase 4 | Complete |
| PLAY-02 | Phase 4 | Complete |
| PLAY-03 | Phase 4 | Complete |
| PLAY-04 | Phase 4 | Complete |
| PLAY-05 | Phase 4 | Pending |
| PLAY-06 | Phase 4 | Pending |
| PLAY-07 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 — traceability filled by roadmapper*
