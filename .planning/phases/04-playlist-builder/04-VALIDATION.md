---
phase: 4
slug: playlist-builder
status: complete
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-10
completed: 2026-03-11
last_audited: 2026-04-10
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | `playwright.config.ts` (exists) |
| **Quick run command** | `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (quick), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts`
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PLAY-01..06 | e2e stub | `npm run test:e2e -- tests/e2e/playlists.spec.ts` | ✅ | ✅ complete |
| 04-01-02 | 01 | 1 | PLAY-01 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "PLAY-01"` | ✅ | ✅ complete |
| 04-01-03 | 01 | 1 | PLAY-05 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "PLAY-05"` | ✅ | ✅ complete |
| 04-01-04 | 01 | 1 | PLAY-06 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "PLAY-06"` | ✅ | ✅ complete |
| 04-02-01 | 02 | 2 | PLAY-01 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "save playlist"` | ✅ | ✅ complete |
| 04-03-01 | 03 | 3 | PLAY-02 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "PLAY-02"` | ✅ | ✅ complete |
| 04-03-02 | 03 | 3 | PLAY-04 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "streaming"` | ✅ | ✅ complete |
| 04-04-01 | 04 | 4 | PLAY-03 | e2e | `npm run test:e2e -- tests/e2e/playlists.spec.ts --grep "drag"` | ✅ | ✅ complete |
| 04-05-T1 | 05 | 1 | PLAY-01 | e2e (API) | `npm run test:e2e -- --project=chromium tests/e2e/playlists.spec.ts --grep "songCount"` | ✅ | ⬜ pending (env) |
| 04-07-T1 | 07 | 1 | PLAY-02 | e2e (API) | `npm run test:e2e -- --project=chromium tests/e2e/playlists.spec.ts --grep "song fields"` | ✅ | ⬜ pending (env) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/e2e/playlists.spec.ts` — test stubs for PLAY-01 through PLAY-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag song to new position and order persists after reload | PLAY-03 | dnd-kit drag events are hard to simulate in Playwright | Open playlist → drag first song to last position → reload page → verify order is persisted |
| Export playlist as CSV downloads a file | Bonus | File download assertion in Playwright requires extra setup | Click Export → CSV → verify file downloaded with correct columns |
| Camelot suggestion panel shows compatible songs | Bonus | Requires songs in database with matching BPM/key | Add 5+ songs → create playlist with 2-3 → open suggestions → verify songs shown with reason labels |
| Playlist row shows "Last updated [date]" label in UI | PLAY-01 | Client-side render; requires authenticated browser session | Navigate to /playlists → verify each row shows "Last updated" prefix on date |
| Save redirect navigates to /playlists/[id] after builder save | PLAY-01 | Requires authenticated browser session with overlay dismissal | Create playlist in PlaylistBuilder → save → verify browser URL is /playlists/[newId] |
| Added song disappears from PlaylistBuilder library panel | PLAY-01 | Requires authenticated browser session with builder open | Open builder → add a song → verify it no longer appears in the available songs list |
| DragOverlay renders smooth clone; original shows opacity-30 placeholder | PLAY-03 | Visual/UX behavior; requires authenticated browser interaction | Open playlist editor → drag a song → verify smooth overlay follows cursor, original dims to 30% opacity |
| YouTube/Spotify icon buttons appear in playlist editor song rows | PLAY-04 | Requires authenticated session and songs with streaming URLs in DB | Add a song with YouTube/Spotify URLs → open playlist detail → hover row → verify icon link buttons appear |
| "Suggest songs" header button opens suggestions panel | PLAY-04 | Requires authenticated browser session with songs in playlist | Open playlist detail with songs → click "Suggest songs" button → verify panel appears below song list |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Wave 0: tests/e2e/playlists.spec.ts created
- [x] `nyquist_compliant: false` — drag-and-drop persistence test is manual only (dnd-kit + Playwright limitations)
- [x] Feedback latency < 120s

---

## Validation Audit 2026-04-10

| Metric | Count |
|--------|-------|
| Plans audited (new) | 3 (05, 06, 07) |
| Gaps found | 8 |
| Automatable | 2 |
| Resolved (tests written) | 2 |
| Pending execution (missing env) | 2 |
| Escalated to manual-only | 6 |

Tests written: `tests/e2e/playlists.spec.ts` — 3 new tests added (songCount × 2, song fields × 1). Awaiting env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to execute.
