# Song Tool

## What This Is

A web app that functions as a musical database and playlist builder. Users add songs with musical metadata (BPM, key, key signature, chord progressions, lyrics, and optional streaming links) and can filter songs by shared properties to build playlists. Built initially for personal/small-group use with a clear path toward a subscription-based SaaS for bands.

## Core Value

Find songs that share musical DNA — match by BPM, key, key signature, or chord progressions — so building a set that flows is fast and musical.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can add a song with required fields: name, BPM, key, key signature, chord progressions
- [ ] User can add optional fields per song: lyrics, YouTube URL, Spotify URL
- [ ] User can filter/search songs by one or more musical properties (BPM, key, key signature, chord progressions)
- [ ] User can search song database by lyric keyword or phrase
- [ ] Search results can be sorted by any field (BPM, key, etc.)
- [ ] Search results can be manually reordered via drag-and-drop
- [ ] User can save a named playlist from filtered results
- [ ] User can view saved playlists and open individual song links (YouTube, Spotify)
- [ ] User can edit and delete songs from the database
- [ ] App requires login (multi-user support for small groups)

### Out of Scope

- Auto-fetching YouTube/Spotify links — manual URL input only (avoids API complexity)
- Spotify API playlist creation — open links individually instead
- Subscription billing and payments — deferred to a later milestone
- Public/anonymous access — authentication required for all use

## Context

- Expected scale: under 500 songs to start, growing over time
- Testing phase: small group; long-term goal is a subscription SaaS for bands
- User wants "lightweight" — minimize infrastructure and framework complexity in v1
- Hosted online — must be browser-accessible, not local-only
- Playlist workflow: filter → sort → drag to fine-tune order → save with a name

## Constraints

- **Simplicity**: Prefer lightweight stack — avoid over-engineering for v1
- **Hosting**: Must be deployable to a live URL (not local-only)
- **Multi-tenant readiness**: Architecture should accommodate multiple users/groups without a full rebuild later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual URL input per song | Avoids YouTube/Spotify API dependencies in v1 | — Pending |
| Hosted (not local) | Small group testing requires shared access | — Pending |
| Auth required from v1 | Enables multi-user testing and lays groundwork for SaaS | — Pending |

---
*Last updated: 2026-03-09 after initialization*
