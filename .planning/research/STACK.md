# Technology Stack

**Project:** Song Tool — Music Database & Playlist Builder
**Researched:** 2026-03-09
**Research mode:** Ecosystem (training data only — WebSearch/WebFetch unavailable)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack React framework | App Router provides server components, API routes, and built-in deployment path to Vercel. One codebase covers frontend + backend. Eliminates need for a separate Express/Fastify server. Active community, strong SaaS precedent. |
| React | 19.x | UI layer (bundled with Next.js 15) | Ships with Next.js. No separate decision needed. React 19 concurrent features improve drag-and-drop responsiveness. |
| TypeScript | 5.x | Type safety across frontend + backend | Catches schema drift between DB and UI early. Especially valuable when the data model expands (BPM, key, chord progressions are structured data types). |

**Confidence: MEDIUM** — Next.js 15 was released late 2024; React 19 shipped stable in December 2024. Versions are from training data (cutoff Aug 2025), not live verification.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase (PostgreSQL) | latest (managed) | Primary data store + auth + full-text search | Single platform for database, auth, and storage. PostgreSQL's `tsvector` / `to_tsquery` handles lyric full-text search without a separate search service (Elasticsearch would be overkill for <10K songs). Supabase free tier covers MVP easily. Row-level security (RLS) enables multi-tenant isolation natively. Hosted — no self-managed Postgres. |

**Why Supabase over alternatives:**
- **vs. PlanetScale:** PlanetScale dropped free tier in 2024 and uses MySQL (no native tsvector for lyric search). Eliminated.
- **vs. Neon:** Neon is PostgreSQL and technically viable, but requires a separate auth solution and has less out-of-the-box DX. Supabase wins on bundled features.
- **vs. Railway/Render Postgres:** Viable, but Supabase Auth + RLS gives multi-tenant groundwork that Railway bare Postgres doesn't.
- **vs. SQLite (Turso/LibSQL):** Too limiting for multi-user hosted scenario. Full-text search is less mature. Not recommended.

**Confidence: MEDIUM** — Supabase RLS for multi-tenancy and tsvector for lyric search are well-established patterns; free tier limits unverified at research date.

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | (bundled with Supabase) | User sign-up, login, session management | Already in the stack — using a second auth provider adds complexity and cost for no v1 benefit. Supabase Auth supports email/password (sufficient for v1), magic links, and OAuth providers. JWT sessions integrate directly with Supabase RLS policies (same user ID used in database row ownership). |

**Why Supabase Auth over alternatives:**
- **vs. Clerk:** Clerk has excellent DX and Organizations API (good for multi-tenant bands), but adds $25+/month at scale and is a third-party JWT that requires extra Supabase integration steps. Defer to a later milestone if Organization management becomes a requirement.
- **vs. Auth.js (NextAuth v5):** Open-source, free, but requires custom adapter wiring to Supabase and adds more setup. Supabase Auth is simpler for this stack.
- **vs. Better Auth:** Newer library, less battle-tested for production SaaS in 2025.

**Upgrade path note:** When the project needs multi-band Organizations (SaaS milestone), Clerk's Organizations API is the cleanest upgrade. Design the `user_id` / `org_id` schema columns from day one to make this migration straightforward.

**Confidence: MEDIUM** — Supabase Auth capabilities are well-known; Clerk pricing subject to change.

---

### ORM / Database Client

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Drizzle ORM | 0.3x | Type-safe SQL queries from TypeScript | Drizzle generates fully typed queries from your schema without hiding SQL. Lightweight (no CLI daemon, no Prisma engine binary). Schema defined in TypeScript, migrations via `drizzle-kit`. Excellent Supabase compatibility. Faster cold starts than Prisma on serverless (Vercel). |

**Why Drizzle over Prisma:**
- Prisma's query engine binary adds ~10MB to serverless bundles and increases cold start times on Vercel.
- Drizzle is SQL-first — the song filtering queries (filter by BPM range, key, chord progression) benefit from transparent SQL rather than Prisma's abstraction.
- Prisma remains valid if the team prefers its DX; the project won't fail with it. But Drizzle is the current community preference for Next.js + Supabase + Vercel in 2025.

**Confidence: MEDIUM** — Drizzle's rise over Prisma for serverless is well-documented through mid-2025; version numbers from training data.

---

### Infrastructure / Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | latest | Frontend + API hosting | Zero-config Next.js deployment. Free hobby tier covers MVP. Serverless functions handle API routes. Built-in preview deployments. Path to Pro tier ($20/month) for production SaaS. Matches "lightweight hosted" constraint exactly. |
| Supabase | (managed) | Database + Auth hosting | Already in stack. Supabase handles its own infra. Free tier: 500MB DB, 50MB file storage, 50K monthly active users. Scales to Pro ($25/month). |

**Why Vercel over alternatives:**
- **vs. Railway:** Railway is excellent for full Docker deployments but is heavier than needed for a Next.js app. Add cost without benefit.
- **vs. Netlify:** Supabase + Next.js ecosystem has stronger Vercel integration guides and examples.
- **vs. Fly.io:** Better for containerized apps with persistent servers; overkill for this stack.

**Confidence: MEDIUM** — Vercel free tier limits can change; architecture direction is well-established.

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | 6.x | Drag-and-drop playlist reordering | The project's playlist workflow requires drag-to-reorder. `@dnd-kit` is accessibility-first, touch-compatible, and composable. Use for the "sort by drag" step in the filter → sort → drag → save workflow. |
| `zod` | 3.x | Schema validation (shared frontend/backend) | Validates song form inputs and API request bodies. Pairs with React Hook Form for zero-config form validation. One schema definition validates both the form and the API route. |
| `react-hook-form` | 7.x | Form state management (song add/edit) | Uncontrolled forms with excellent performance. Minimal re-renders for the song metadata form (many fields). Integrates directly with Zod via `@hookform/resolvers`. |
| `tailwindcss` | 4.x | Utility-first CSS | Fast UI iteration without custom CSS files. Tailwind v4 uses CSS-native config (no `tailwind.config.js` required). Pairs well with shadcn/ui. |
| `shadcn/ui` | latest (copy-paste) | Component primitives (tables, dialogs, forms) | Not a dependency — components are copied into the project. Provides accessible, styled Table, Dialog, Input, Button, Select components that match what this app needs. No version lock-in. |
| `@tanstack/react-table` | 8.x | Song list table with sortable columns | TanStack Table v8 handles client-side column sorting, filtering, and virtual rendering. Pairs with shadcn/ui's Table component for rendering. Gives the "sort by any field" requirement without custom sort logic. |
| `stripe` | 16.x | Payments (deferred) | When SaaS billing milestone arrives. Install then, not now. Noted here for architectural awareness: design `users` table with a `stripe_customer_id` nullable column from day one. |

**Why `@dnd-kit` over alternatives:**
- **vs. `react-beautiful-dnd`:** Atlassian deprecated `react-beautiful-dnd` in 2023. Do not use.
- **vs. `@hello-pangea/dnd`:** Community fork of `react-beautiful-dnd`; viable but smaller ecosystem than `@dnd-kit`.
- **vs. HTML5 native drag:** Inconsistent mobile behavior, poor accessibility.

**Confidence: MEDIUM** — `@dnd-kit` as the canonical DnD library for React is well-established. TanStack Table v8 stable through mid-2025. Tailwind v4 was released in early 2025 — verify CSS-native config behavior before use; v3 remains fully supported if v4 has migration friction.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Remix / React Router 7 | Remix/RR7 is excellent but has less Supabase + Vercel DX tooling. Next.js has more SaaS starter templates and Supabase integration examples. |
| Framework | Next.js 15 | SvelteKit | Smaller ecosystem for SaaS patterns. Requires different mental model; fewer auth/payment integrations. |
| Database | Supabase | Neon + separate Auth | More moving parts. Neon is good PostgreSQL hosting but forces a separate auth choice. Supabase bundles more. |
| Database | Supabase | PlanetScale | MySQL (no tsvector), no free tier as of 2024. Eliminated. |
| ORM | Drizzle | Prisma | Binary engine adds cold start latency on Vercel serverless. Drizzle preferred for this deployment target. |
| Auth | Supabase Auth | Clerk | Adds cost and integration complexity in v1. Re-evaluate at SaaS milestone if Organization management is needed. |
| DnD | @dnd-kit | react-beautiful-dnd | Deprecated by Atlassian in 2023. Do not use. |
| Styling | Tailwind + shadcn/ui | MUI / Chakra UI | Heavier bundle, more opinionated visual style, harder to customize. Tailwind + shadcn/ui is lighter and more composition-friendly. |
| Search | PostgreSQL tsvector | Algolia / Typesense | Overkill for <10K songs. External search services add cost and complexity. PostgreSQL full-text search handles lyric keyword search natively. Revisit at 100K+ songs. |

---

## Installation

```bash
# Bootstrap Next.js with TypeScript + Tailwind
npx create-next-app@latest song-tool --typescript --tailwind --app --src-dir

# Database ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Validation + Forms
npm install zod react-hook-form @hookform/resolvers

# Table
npm install @tanstack/react-table

# Drag-and-drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# shadcn/ui (interactive CLI, run separately)
npx shadcn@latest init
npx shadcn@latest add table dialog button input select badge
```

---

## Full-Text Search: Lyric Search Implementation Note

PostgreSQL `tsvector` is the right choice for this scale. Implementation pattern:

1. Add a `lyrics_tsv tsvector` generated column to the `songs` table, populated from the `lyrics` text column.
2. Create a GIN index on `lyrics_tsv`.
3. Query with `to_tsquery` via Drizzle's `sql` template literal for raw SQL escape hatch.

This gives fast keyword and phrase search without any external service. At 500–50K songs, query times will be sub-10ms. No Algolia, no Elasticsearch.

**Confidence: HIGH** — PostgreSQL tsvector is a well-documented, mature feature.

---

## Multi-Tenant Architecture Note (v1 groundwork)

Design the database schema with multi-tenancy in mind from day one:

- `users` table: managed by Supabase Auth (UUID primary key)
- All song rows carry `user_id UUID REFERENCES auth.users(id)` (or `org_id` for band-level data)
- Supabase RLS policies enforce row ownership: `USING (auth.uid() = user_id)`
- When the SaaS milestone arrives, add an `organizations` table and switch policies to `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = songs.org_id)`

This means zero schema migration for user-level isolation in v1, and a targeted migration (add `org_id`, update RLS policies) for multi-band SaaS — no full rebuild.

**Confidence: HIGH** — Supabase RLS for multi-tenancy is a documented, recommended pattern.

---

## Sources

**Note:** WebSearch and WebFetch tools were unavailable during this research session. All findings are from training data with knowledge cutoff August 2025. Confidence is therefore MEDIUM at best for version numbers and pricing. Verify the following before finalizing:

- Next.js current stable version: https://nextjs.org/blog
- Drizzle ORM changelog: https://github.com/drizzle-team/drizzle-orm/releases
- Supabase pricing/limits: https://supabase.com/pricing
- @dnd-kit releases: https://github.com/clauderic/dnd-kit/releases
- Tailwind v4 migration guide: https://tailwindcss.com/docs/v4-upgrade
- TanStack Table v8: https://tanstack.com/table/latest
- Clerk pricing (for SaaS milestone planning): https://clerk.com/pricing

**Training data sources consulted:**
- Next.js 15 App Router documentation (training data)
- Supabase documentation — Auth, RLS, Full-text search (training data)
- Drizzle ORM documentation (training data)
- @dnd-kit documentation and GitHub (training data)
- Community discussion patterns: T3 Stack, Supabase + Next.js SaaS starters (training data)
