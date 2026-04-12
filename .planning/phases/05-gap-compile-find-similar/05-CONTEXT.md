# Phase 5: Gap Closure - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the remaining v1.0 audit gaps in one focused pass:
1. Restore the Find Similar Songs flow (discovery page ignores `?q=` param — chain opens empty)
2. Add Next.js middleware to redirect unauthenticated users from protected routes to `/login`
3. Resolve the orphaned `POST /api/discovery` endpoint

Two audit gaps are **already resolved** (do not re-implement):
- Sonner compile blocker — sonner is installed, `npx tsc --noEmit` exits 0
- timeSig filter in SongFilters UI — present at `src/components/songs/song-filters.tsx` lines 282–293

</domain>

<decisions>
## Implementation Decisions

### Find Similar pre-seeding
- **D-01:** Change songs page to push `/discovery?seedId={song.id}` — NOT the current `?q=buildSimilarQuery(...)` text query
- **D-02:** Discovery page reads `seedId` param via `useSearchParams`, calls `/api/similar?songId={seedId}` on mount, and pre-populates column 1 with the results
- **D-03:** The existing `buildSimilarQuery` function in `src/lib/similar-query.ts` is no longer called from the songs page for this flow — the song ID is sufficient
- **D-04:** If `seedId` is present but the fetch fails (song not found), chain opens empty — same as current behavior

### Auth middleware scope
- **D-05:** Create `middleware.ts` at project root (Next.js convention) using Supabase SSR pattern
- **D-06:** Protected routes (redirect to `/login` if unauthenticated): `/songs`, `/playlists`, `/discovery` and all sub-routes (e.g. `/playlists/[id]`, `/playlists/[id]/live`)
- **D-07:** Public routes (pass through freely): `/`, `/login`, `/metronome`, `/chords`, `/api/*`, `/_next/*`, static assets
- **D-08:** Redirect target: `/login` (existing login page at `src/app/login/page.tsx`)
- **D-09:** Use `@supabase/ssr` `createServerClient` in middleware — matches the existing pattern in `src/lib/supabase/server.ts`

### POST /api/discovery removal
- **D-10:** Delete the `POST` handler from `src/app/api/discovery/route.ts` — keep only the `GET` export
- **D-11:** The `parsePrompt` function in `src/lib/parse-prompt.ts` may become dead code after removal — check and remove if unused elsewhere
- **D-12:** `src/lib/similar-query.ts` remains (still used by discovery chain flow via `/api/similar`)

### Claude's Discretion
- Exact matcher pattern for middleware route matching (string prefix vs regex)
- Whether to use `updateSession` helper or inline session check in middleware
- Order of session refresh vs route check in middleware logic

</decisions>

<specifics>
## Specific Ideas

- The `/chords` page should stay public — user confirmed this explicitly alongside `/metronome`
- The `?q=` URL param on discovery is being replaced by `?seedId=` — old links from songs page with `?q=` will simply open an empty chain (acceptable)

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above and the milestone audit.

### Audit source
- `.planning/v1.0-MILESTONE-AUDIT.md` — Full gap list, integration failures, and tech debt inventory. Downstream agents MUST read the `integration:` section to understand exactly what was broken.

### Existing auth infrastructure
- `src/lib/auth.ts` — `requireUser()` helper; shows how Supabase session is read server-side
- `src/lib/supabase/server.ts` — `createClient()` for server components; middleware should use `createServerClient` from `@supabase/ssr` directly (same pattern)

### Find Similar existing code
- `src/app/songs/page.tsx` — Current `router.push('/discovery?q=...')` call that needs to change to `?seedId={id}`
- `src/app/discovery/page.tsx` — `DiscoveryContent` component; where `useSearchParams` and `seedId` effect must be added
- `src/lib/similar-query.ts` — `buildSimilarQuery` function; no longer needed for the Find Similar flow after D-01
- `src/app/api/similar/route.ts` — Existing endpoint that discovery already uses for chain expansion; also used for `seedId` pre-seeding

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/server.ts` — server-side Supabase client; middleware uses same `@supabase/ssr` package
- `/api/similar` route — already handles `?songId=` and returns similar songs; re-used for pre-seeding

### Established Patterns
- `requireUser()` in API routes — session check pattern; middleware replicates this at the route level
- `useSearchParams` + `useEffect` — standard Next.js pattern for reading URL params in client components; needed for seedId in discovery page

### Integration Points
- `src/app/songs/page.tsx` line ~179 — `router.push('/discovery?q=...')` — change to `?seedId=`
- `src/app/discovery/page.tsx` `DiscoveryContent` function — add `useSearchParams`, read `seedId`, fire init effect
- `src/app/api/discovery/route.ts` — remove `POST` export, keep `GET`
- `middleware.ts` (new file at project root) — intercepts requests before page rendering

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 5 scope

</deferred>

---

*Phase: 05-gap-compile-find-similar*
*Context gathered: 2026-04-10*
