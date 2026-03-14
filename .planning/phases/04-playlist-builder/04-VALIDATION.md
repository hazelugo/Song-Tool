---
phase: 4
slug: playlist-builder
status: complete
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-10
completed: 2026-03-11
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

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Wave 0: tests/e2e/playlists.spec.ts created
- [x] `nyquist_compliant: false` — drag-and-drop persistence test is manual only (dnd-kit + Playwright limitations)
- [x] Feedback latency < 120s
