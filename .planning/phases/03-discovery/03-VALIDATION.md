---
phase: 3
slug: discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | `playwright.config.ts` (exists) |
| **Quick run command** | `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (quick), ~90 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:e2e -- --project=chromium tests/e2e/health.spec.ts`
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DISC-01..08 | e2e stub | `npm run test:e2e -- tests/e2e/discovery.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DISC-01 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-01"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | DISC-02,03 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-02"` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | DISC-04 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-04"` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | DISC-05 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-05"` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | DISC-06 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-06"` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | DISC-07 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-07"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | DISC-08 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "DISC-08"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | DISC-01..08 | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/discovery.spec.ts` — test stubs for DISC-01 through DISC-08 (filter stubs created in Plan 01 Wave 1, filled in Plan 02 Wave 2)

*No framework changes needed — Playwright config already exists and covers the `/discovery` page URL.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clear filters button resets all fields and restores full song list | DISC-07 | Visual confirmation of UI reset | Open discovery page with filters applied → click "Clear filters" → verify all inputs are empty and all songs reappear |
| Sort indicator arrow changes direction on second click | DISC-08 | Visual icon state change | Click BPM header once → verify up arrow; click again → verify down arrow; click third time → verify neutral icon |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
