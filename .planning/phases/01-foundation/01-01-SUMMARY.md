---
phase: 01-foundation
plan: "01"
subsystem: ui
tags: [next.js, shadcn, tailwind, playwright, next-themes, sidebar]

# Dependency graph
requires: []
provides:
  - Next.js 15 app scaffolded with TypeScript, Tailwind v4, ESLint, App Router
  - Left sidebar nav shell (Song Tool header, Songs/Discovery/Playlists links, dark mode toggle)
  - ThemeProvider (next-themes) with system default, attribute=class
  - SidebarProvider wrapping AppSidebar + main content area
  - Placeholder pages for /songs, /discovery, /playlists
  - GET /api/health endpoint returning {status: ok, db: pending}
  - Root page redirecting to /songs
  - Playwright smoke test scaffold with 3 tests (all passing)
affects: [01-02, all subsequent phases]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - shadcn@4.0.2 (Radix/nova preset)
    - "@base-ui/react@1.2.0"
    - next-themes@0.4.6
    - lucide-react@0.577.0
    - tailwindcss@4
    - "@playwright/test@1.58.2"
  patterns:
    - ThemeProvider wraps SidebarProvider wraps (AppSidebar + main) in root layout
    - Client components use "use client" directive
    - SidebarMenuButton uses render prop (not asChild) in shadcn v4

key-files:
  created:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/components/app-sidebar.tsx
    - src/components/theme-provider.tsx
    - src/app/songs/page.tsx
    - src/app/discovery/page.tsx
    - src/app/playlists/page.tsx
    - src/app/api/health/route.ts
    - playwright.config.ts
    - tests/e2e/health.spec.ts
  modified:
    - package.json (name, scripts, dependencies)
    - src/app/globals.css (shadcn tokens added)
    - src/lib/utils.ts (shadcn cn helper)

key-decisions:
  - "shadcn v4 uses render prop instead of asChild for SidebarMenuButton — use render={<Link href=... />} pattern"
  - "shadcn nova preset chosen (Radix + Lucide + Geist) — matches project clean/minimal aesthetic"
  - "suppressHydrationWarning on html element required by next-themes to avoid hydration mismatch"
  - "ThemeProvider -> SidebarProvider nesting order established as permanent pattern for all layouts"
  - "Next.js 16.1.6 installed (branded as Next.js 15 era app — latest stable at time of execution)"

patterns-established:
  - "SidebarMenuButton render prop: <SidebarMenuButton render={<Link href={item.url} />}>"
  - "Layout wrapping order: ThemeProvider > SidebarProvider > (AppSidebar + main)"
  - "Dark mode: attribute=class, defaultTheme=system, enableSystem, disableTransitionOnChange"

requirements-completed: []

# Metrics
duration: 18min
completed: 2026-03-09
---

# Phase 1 Plan 01: App Scaffold and Nav Shell Summary

**Next.js 16 app with shadcn sidebar (Songs/Discovery/Playlists), next-themes dark mode toggle, health endpoint, and passing Playwright smoke tests — awaiting Vercel deploy verification**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-09T20:40:42Z
- **Completed:** 2026-03-09T21:00:00Z (est)
- **Tasks:** 2 of 3 complete (Task 3 = human checkpoint)
- **Files modified:** 22

## Accomplishments
- Scaffolded Next.js 16 app (TypeScript, Tailwind v4, App Router, src-dir layout)
- Built AppSidebar with "Song Tool" header, 3 nav links (Music/Search/ListMusic icons), dark mode toggle in footer
- Wired ThemeProvider (next-themes) + SidebarProvider as permanent root layout pattern
- GET /api/health returns `{"status":"ok","db":"pending"}` (db wired in plan 01-02)
- Created 3 placeholder pages (/songs, /discovery, /playlists) with h1 headings
- Playwright smoke tests: all 3 pass locally (homepage redirect, health endpoint 200, sidebar nav)

## Task Commits

1. **Task 1: Scaffold Next.js 15 app with nav shell** - `510a1b5` (feat)
2. **Task 2: Add Playwright smoke test scaffold** - `3a7d2f1` (feat)

Task 3 (Checkpoint: Vercel deploy + Supabase setup) — awaiting human verification.

## Files Created/Modified
- `src/app/layout.tsx` - Root layout: ThemeProvider > SidebarProvider > AppSidebar + main
- `src/app/page.tsx` - Root redirect to /songs
- `src/components/app-sidebar.tsx` - Left sidebar with Song Tool header, nav links, dark mode toggle
- `src/components/theme-provider.tsx` - next-themes ThemeProvider client component wrapper
- `src/app/songs/page.tsx` - Placeholder: h1 "Songs"
- `src/app/discovery/page.tsx` - Placeholder: h1 "Discovery"
- `src/app/playlists/page.tsx` - Placeholder: h1 "Playlists"
- `src/app/api/health/route.ts` - GET /api/health -> {status: ok, db: pending}
- `playwright.config.ts` - Playwright config: testDir=tests/e2e, webServer=npm run dev
- `tests/e2e/health.spec.ts` - 3 smoke tests (all passing)
- `package.json` - Updated name, added test:e2e script, next-themes, @playwright/test deps
- `src/components/ui/sidebar.tsx` - shadcn sidebar component (via npx shadcn add sidebar)
- `src/components/ui/button.tsx` - shadcn button component
- `src/lib/utils.ts` - shadcn cn() utility

## Decisions Made

- **shadcn nova preset:** Matches the clean/minimal aesthetic (Radix + Lucide + Geist). Installs with `--defaults` flag.
- **SidebarMenuButton render prop:** shadcn v4 Radix Base uses `render={<Link href=... />}` instead of `asChild` — this is the new API pattern for composable links.
- **suppressHydrationWarning:** Required on `<html>` tag when using next-themes to suppress server/client theme mismatch during hydration.
- **ThemeProvider nesting:** ThemeProvider must wrap SidebarProvider (not inside it) so sidebar styles respond to theme class on html element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SidebarMenuButton asChild prop — not supported in shadcn v4**
- **Found during:** Task 1 (npm run build TypeScript check)
- **Issue:** Plan specified `<SidebarMenuButton asChild>` but shadcn v4 uses Radix Base's `render` prop instead — TypeScript error: "Property 'asChild' does not exist"
- **Fix:** Changed to `<SidebarMenuButton render={<Link href={item.url} />}>` per new shadcn v4 API
- **Files modified:** `src/components/app-sidebar.tsx`
- **Verification:** `npm run build` exits 0, all 3 Playwright tests pass
- **Committed in:** `510a1b5` (Task 1 commit)

**2. [Rule 3 - Blocking] Scaffolded to temp dir — create-next-app rejects "Song Tool" name**
- **Found during:** Task 1 (create-next-app)
- **Issue:** `create-next-app .` in a directory named "Song Tool" fails — npm name restrictions disallow spaces and capitals
- **Fix:** Scaffolded to `/Documents/song-tool-scaffold`, then rsync'd files (minus .git/node_modules) to real project dir
- **Files modified:** All scaffolded files
- **Verification:** `npm install` succeeded in real project dir, build passes
- **Committed in:** `510a1b5` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both required for correct operation. No scope creep. shadcn v4 API change is a normal version difference.

## Issues Encountered
- Next.js version installed is 16.1.6 (create-next-app@latest in March 2026 — project was planned as "Next.js 15" era). Functions identically; all patterns still apply.
- shadcn init is interactive by default — required `--defaults` and `-p nova` flags for non-interactive invocation.

## User Setup Required

**External services require manual configuration for the Vercel checkpoint:**

1. **GitHub**: Push repo to GitHub remote (if not already done)
2. **Vercel**: Import GitHub repo at https://vercel.com/new
3. **Environment Variable**: Add `DATABASE_URL` in Vercel project settings (Transaction-mode Supabase pooler, port 6543)
4. **Supabase**: Create a new project at https://supabase.com/dashboard

After setup, confirm:
- Vercel URL loads with "Song Tool" sidebar
- `{VERCEL_URL}/api/health` returns `{"status":"ok","db":"pending"}`
- Paste Vercel URL so plan 01-02 can reference it

## Next Phase Readiness
- App shell complete — Songs/Discovery/Playlists nav is the permanent structure all subsequent phases fill in
- Health endpoint returns static response; plan 01-02 will wire the actual Supabase database connection
- Playwright test scaffold ready for 01-02 to extend with db-connected assertions
- Vercel deployment needed before plan 01-02 can validate db connectivity

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
