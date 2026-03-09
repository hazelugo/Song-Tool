---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + playwright (e2e) |
| **Config file** | vitest.config.ts / playwright.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | Scaffold | build check | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | Vercel deploy | e2e | `npm run test:e2e` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | DB tables + types | integration | `npm run db:test` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | GIN index + FTS | integration | `npm run db:test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/db.test.ts` — stubs for schema validation
- [ ] `tests/e2e/health.spec.ts` — health-check page smoke test
- [ ] vitest + playwright install if not present

*Wave 0 installs test infrastructure before feature work begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel URL returns live page | SC-1 | Requires live deployment | Open Vercel URL in browser, confirm no 404 |
| Drizzle migrations run cleanly | SC-3 | Requires Supabase connection | Run `npm run db:migrate` against staging Supabase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
