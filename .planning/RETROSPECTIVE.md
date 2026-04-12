# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-11
**Phases:** 5 | **Plans:** 16 | **Commits:** ~200

### What Was Built

- Full song catalog: CRUD, all musical metadata, tag management, paginated TanStack table
- Multi-filter discovery engine: BPM range, key, key signature, chords, lyric FTS, tags — URL-based state
- Playlist builder: create from filtered results, dnd-kit reorder, Camelot harmonic suggestions, CSV export
- Auth-gated app: Supabase email/password + Next.js middleware protecting all page routes
- Find Similar Songs: seedId-based flow from any song to pre-seeded discovery chain

### What Worked

- **GSD phased execution** — Breaking work into small plans (avg ~45 min/plan) kept context tight and made deviations recoverable
- **URL-based filter state** — No extra state library; bookmarkable and testable for free
- **Drizzle + Supabase** — Schema-first approach caught type mismatches early; generated tsvector column was clean
- **Fractional indexing for positions** — Single-row UPDATE per reorder; rebalance edge case handled upfront
- **dnd-kit DragOverlay pattern** — Consistent between PlaylistBuilder and PlaylistEditor; activation constraint eliminated accidental drags
- **Playwright global auth setup** — Cookie-based session via Supabase REST API made all e2e API tests runnable

### What Was Inefficient

- **Auth deferred too long** — Hardcoded USER_ID ran through phases 1–4; Phase 5 retrofitted auth. Earlier wiring would have avoided the gap-closure phase entirely.
- **DISC-06 (tag filter UI) fell through** — API and filterSchema had tag support from Phase 3; the UI control was never wired to FILTER_KEYS. A checklist-level item missed in execution.
- **Discovery page deviation** — Phase 3 built AI natural language UI with unimplemented backend (POST /api/discovery). Phase 5 had to clean up the orphaned stub. The deviation was logged but not resolved promptly.
- **Phase 4 had 7 plans** — More than any other phase; earlier scope review could have split it. Gap-closure plans 04-05 through 04-07 were reactive rather than planned.
- **Nyquist compliance was retroactive** — Validation tests added after phases completed rather than upfront. Caught real bugs (timeSignature missing from createSong helper) but earlier TDD would have caught them during execution.

### Patterns Established

- `postgres({ prepare: false })` required for Supabase Transaction pool (port 6543) — document in every new project using Supabase
- `getUser()` not `getSession()` in middleware — validates JWT with auth server, not local cache
- `startsWith(prefix + '/')` for route matching — prevents prefix substring collisions
- Playwright `global-setup.ts` via Supabase REST auth → cookie chunks → `storageState` — reusable pattern for any Supabase + Playwright project
- `websearch_to_tsquery` for lyric FTS — `to_tsquery` throws on raw user input
- `EXISTS` subquery for tag filter — `JOIN` duplicates rows when song has multiple matching tags

### Key Lessons

1. **Wire auth in Phase 1.** Retrofitting auth after 4 phases of hardcoded USER_ID creates a dedicated cleanup phase. Auth belongs in the foundation.
2. **UI controls need explicit checklist items.** API support ≠ feature shipped. DISC-06 had backend, filterSchema, and DB index — all that was missing was one array entry in the UI. Ticket-level granularity prevents this.
3. **Resolve deviations in the same phase.** The AI discovery deviation was logged and left open for 2 phases. Immediate resolution or revert is cheaper than deferred cleanup.
4. **Playwright auth setup is not optional.** API-level e2e tests with `request` fixture require a global auth setup from day one — not something to add retroactively.
5. **Plan at the ticket level for complex phases.** Phase 4's 7 plans would have been cleaner as two separate phases (core builder + polish/gaps). Phase size is a signal of scope creep.

### Cost Observations

- Phases 2–4 executed by Gemini (external AI agent)
- Phase 5 and gap closure by Claude Sonnet
- Sessions: ~8 (estimated from velocity data)
- Notable: Multi-agent execution (Gemini + Claude) worked well for execution; Claude handled planning, verification, and gap analysis

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0      | 5      | 16    | First milestone — baseline established |

### Cumulative Quality

| Milestone | E2E Tests | Auth Setup | Nyquist Compliance |
|-----------|-----------|------------|-------------------|
| v1.0      | Playwright (chromium) | Global setup added post-phase | Retroactive on phases 4–5 |

### Top Lessons (Verified Across Milestones)

1. Auth belongs in Phase 1 — retrofitting is a whole phase of cleanup
2. API support ≠ feature shipped — UI controls need their own checklist items
3. Resolve deviations immediately — open deviations accumulate into gap-closure phases
