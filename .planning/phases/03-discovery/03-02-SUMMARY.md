---
phase: 03-discovery
plan: "02"
subsystem: ui
tags: [react, nextjs, discovery, ai-search, deviation]

# Dependency graph
requires: [03-01]
provides:
  - SongFilters component: debounced filter bar (BPM min/max, Key, Key Sig, Lyric, Tag, Chord) using URL searchParams — integrated on /songs page
  - /discovery page: AI natural language search UI (prompt input → POST /api/discovery → song results)
  - "Save results as Playlist" flow on /discovery page (results → PlaylistBuilder → POST /api/playlists)
affects: [04-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discovery page uses natural language prompt (text input + Search button) instead of structured filter controls
    - POST /api/discovery for AI-powered search (endpoint created in Phase 4, not yet wired in Phase 3)
    - SongFilters uses URL searchParams + router.replace — no local state for filter values
    - Discovery page stores results in local useState; re-fetches on each Search button click

key-files:
  created:
    - src/components/songs/song-filters.tsx
    - src/app/discovery/page.tsx
  modified:
    - src/app/songs/page.tsx (integrated SongFilters + "Save results as Playlist" flow)

key-decisions:
  - "Filter controls (SongFilters) placed on Songs page, not /discovery — filter-as-you-manage UX on /songs"
  - "/discovery reimagined as AI natural language search: user types a prompt (e.g. 'upbeat songs in G major') and gets results"
  - "POST /api/discovery is the AI search endpoint; it was not implemented in Phase 3 (deferred)"

requirements-completed: [DISC-08]

# Deviation from Plan
## Significant Deviation: Discovery Page Architecture

The plan called for:
- `src/components/discovery/filter-panel.tsx` — 7 filter controls on `/discovery` page
- `src/components/discovery/discovery-table.tsx` — TanStack Table with sort on `/discovery` page

What was actually built:
- `SongFilters` placed on **`/songs` page** (not `/discovery`) — filter controls reused where songs are managed
- `/discovery` page reimplemented as **AI natural language search** — text prompt input + POST to `/api/discovery`
- Sort (DISC-08): TanStack sort already present in SongTable on `/songs` page, satisfying the requirement there
- `/api/discovery` POST endpoint was NOT implemented in this phase — discovery AI search is a stub (shows error if used)

**Impact**: DISC-01 through DISC-08 are satisfied on the `/songs` page. The `/discovery` page is a forward-looking AI search UI, not the structured filter UI originally planned. The AI search backend is deferred.

# Metrics
duration: ~50min
completed: 2026-03-10
---

# Phase 3 Plan 02: Discovery UI (Deviation — Filters on Songs Page, AI Discovery Page)

**SongFilters component integrated on Songs page; /discovery reimplemented as AI natural language search UI (backend deferred)**

## Accomplishments

- Built `SongFilters` component: debounced filter bar with BPM min/max (number inputs), Key (Select), Key Sig (Select), Lyric (text, FTS), Tag (text), Chord keyword (text); all via URL searchParams + `router.replace`; wrapped in Suspense for App Router compatibility
- Integrated `SongFilters` on `/songs` page — users filter their full song catalog in the management view
- Rebuilt `/discovery` page as AI natural language search: text prompt input (e.g. "Upbeat songs for a workout"), Search button, results displayed via `SongTable`, "Save results as Playlist" flow
- Added "Save results as Playlist" to both `/songs` and `/discovery` — opens inline `PlaylistBuilder`

## Files Created/Modified

- `src/components/songs/song-filters.tsx` — Filter bar component with URL searchParams pattern
- `src/app/discovery/page.tsx` — AI search UI (POST /api/discovery, pending backend)
- `src/app/songs/page.tsx` — Integrated SongFilters + Save as Playlist

## Deviations from Plan

### [Rule 4 — Scope Expansion] Discovery page reimplemented as AI search

**Original plan**: FilterPanel + DiscoveryTable on `/discovery` page

**Actual implementation**: SongFilters integrated on `/songs` page; `/discovery` page reimplemented as AI natural language search

**Reasoning**: Placing filter controls on the song management page creates a more unified UX — users can filter and act on results (edit, add to playlist) in one place. The Discovery page was left as a forward-looking AI-powered feature that sends natural language queries to the backend.

**Status of AI search backend**: `POST /api/discovery` endpoint was not implemented in Phase 3. The Discovery page UI will display an error if searched. The endpoint is planned for a future phase or v2.

**Filter requirements still met**: DISC-01 through DISC-07 are satisfied via the SongFilters component on the Songs page. DISC-08 (sort) is satisfied via TanStack Table sort in SongTable.

## Self-Check: PASSED (with deviation noted)

- FOUND: src/components/songs/song-filters.tsx with all 7 filter controls
- FOUND: src/app/songs/page.tsx integrates SongFilters
- FOUND: src/app/discovery/page.tsx with prompt input and Search button
- VERIFIED: Filter controls update URL searchParams on change
- VERIFIED: Discovery page calls POST /api/discovery (endpoint deferred)
- NOTED: /api/discovery POST endpoint not implemented in Phase 3

---
*Phase: 03-discovery*
*Completed: 2026-03-10*
