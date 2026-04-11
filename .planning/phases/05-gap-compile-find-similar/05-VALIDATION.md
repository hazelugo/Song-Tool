---
phase: 5
slug: gap-compile-find-similar
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
completed: 2026-04-10
---

# Phase 5 — Validation Strategy

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
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SC-2a: seedId pre-seeds chain | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "SC-2a"` | ✅ | ✅ complete |
| 05-01-02 | 01 | 1 | SC-2b: no seedId, no similar request | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "SC-2b"` | ✅ | ✅ complete |
| 05-01-03 | 01 | 1 | SC-4: POST /api/discovery removed | e2e | `npm run test:e2e -- tests/e2e/discovery.spec.ts --grep "SC-4"` | ✅ | ✅ complete |
| 05-01-04 | 01 | 1 | SC-1: tsc clean compile | build | `npx tsc --noEmit` | n/a | ✅ complete |
| 05-02-01 | 02 | 2 | SC-3: auth redirect /songs | e2e | `npm run test:e2e -- tests/e2e/auth.spec.ts` | ✅ | ✅ complete |
| 05-02-02 | 02 | 2 | SC-3: auth redirect /playlists | e2e | `npm run test:e2e -- tests/e2e/auth.spec.ts` | ✅ | ✅ complete |
| 05-02-03 | 02 | 2 | SC-3: auth redirect /discovery | e2e | `npm run test:e2e -- tests/e2e/auth.spec.ts` | ✅ | ✅ complete |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/e2e/discovery.spec.ts` — Phase 5 tests (SC-2a, SC-2b, SC-4); replaces stale AI-search tests from Phase 3
- [x] `tests/e2e/auth.spec.ts` — Auth redirect tests (SC-3) for /songs, /playlists, /discovery

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auth redirect in production | SC-3 | Auth tests self-skip in environments without Supabase credentials — they verify the redirect only when credentials are configured | Navigate to /songs in a browser without an active Supabase session; confirm redirect to /login |

---

## Validation Audit 2026-04-10

| Metric | Count |
|--------|-------|
| Gaps found | 7 |
| Resolved (automated) | 6 |
| Escalated to manual-only | 1 |

Retroactive validation — VALIDATION.md reconstructed from SUMMARY.md artifacts after phase execution. All 7 gaps identified by gsd-nyquist-auditor:
- SC-2a (seedId pre-seeds chain): test written in discovery.spec.ts
- SC-2b (no seedId, no request): test written in discovery.spec.ts
- SC-4 (POST removed): test written in discovery.spec.ts
- SC-3 ×3 (auth redirects): tests written in auth.spec.ts with conditional skip for unconfigured environments
- Stale discovery.spec.ts (8 AI-search tests for removed behavior): rewritten with 3 current tests

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no gaps without automated verify
- [x] Wave 0: test files created
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-04-10
