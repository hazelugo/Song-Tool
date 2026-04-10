---
phase: 05-gap-compile-find-similar
plan: 02
subsystem: auth
tags: [middleware, auth, supabase, route-protection]
dependency_graph:
  requires: ["@supabase/ssr (already installed)", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  provides: ["route-level auth enforcement for /songs, /playlists, /discovery"]
  affects: ["all page routes matching PROTECTED_PREFIXES"]
tech_stack:
  added: []
  patterns: ["Next.js middleware with @supabase/ssr createServerClient", "getUser() JWT validation in middleware"]
key_files:
  created: ["middleware.ts"]
  modified: []
key_decisions:
  - "Used getUser() not getSession() to validate JWT with Supabase auth server (T-05-03 mitigation)"
  - "Matcher excludes /api/* at framework level — API routes already use requireUser() server-side"
  - "PROTECTED_PREFIXES uses startsWith(prefix + '/') to prevent /songster matching /songs (T-05-04 mitigation)"
  - "loginUrl.search = '' clears all query params on redirect to avoid leaking path info"
metrics:
  duration: "~10 min"
  completed: "2026-04-10"
  tasks: 1
  files: 1
---

# Phase 05 Plan 02: Auth Middleware Summary

**One-liner:** Next.js middleware with Supabase SSR JWT validation redirecting unauthenticated users from /songs, /playlists, /discovery to /login.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create auth middleware with Supabase SSR session check | 91e3a21 | middleware.ts |

## What Was Built

Created `middleware.ts` at the project root that intercepts all page requests (excluding static assets, image optimization, and API routes) before rendering. For requests matching `/songs`, `/playlists`, or `/discovery` (and their sub-routes), the middleware validates the Supabase session using `createServerClient` from `@supabase/ssr`. Unauthenticated requests are redirected to `/login` with all query params cleared.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — all identified threats (T-05-03, T-05-04, T-05-05) were already in the plan's threat model and mitigated in the implementation.

## Self-Check

- middleware.ts exists: FOUND
- Commit 91e3a21 exists: FOUND
- TypeScript compiles clean: PASS

## Self-Check: PASSED
