---
phase: 2
slug: song-catalog
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | `playwright.config.ts` (exists) |
| **Quick run command** | `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts`
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | SONG-01..06 | e2e stub | `npm run test:e2e -- tests/e2e/songs.spec.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SONG-01 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "add song"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SONG-04 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "edit song"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SONG-05 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "delete song"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SONG-01,02,03 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "add song"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SONG-02 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "optional fields"` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | SONG-03 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "tags"` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | SONG-04 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "edit song"` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 2 | SONG-05 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "delete song"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | SONG-06 | e2e | `npm run test:e2e -- tests/e2e/songs.spec.ts --grep "pagination"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/songs.spec.ts` — test stubs for SONG-01 through SONG-06 (add, optional fields, tags, edit, delete, pagination)

*No unit test framework setup needed — project uses Playwright e2e only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lyrics "Add lyrics" toggle collapses/expands | SONG-02 | Visual UX toggle behavior | Open Add Song sheet; verify lyrics section hidden by default; click "Add lyrics"; verify textarea appears |
| Tag Enter-key does not submit form | SONG-03 | Form submit side effect | Open Add Song sheet; type tag name; press Enter; verify tag chip appears and form is NOT submitted |
| Double-confirm delete shows inline warning | SONG-05 | Two-step UI interaction | Open edit sheet; click Delete; verify "Are you sure?" inline state before final delete |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
