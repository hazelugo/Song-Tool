# Project Context

This is a typescript project using next-app, hono with drizzle.

The API has 22 routes. See .codesight/routes.md for the full route map with methods, paths, and tags.
The database has 4 models. See .codesight/schema.md for the full schema with fields, types, and relations.
The UI has 29 components. See .codesight/components.md for the full list with props.
Middleware includes: auth.

High-impact files (most imported, changes here affect many other files):
- src/db/schema.ts (imported by 29 files)
- src/lib/utils.ts (imported by 28 files)
- src/components/ui/button.tsx (imported by 23 files)
- src/db/index.ts (imported by 17 files)
- src/lib/validations/song.ts (imported by 12 files)
- src/lib/auth.ts (imported by 11 files)
- src/components/ui/input.tsx (imported by 8 files)
- src/lib/camelot.ts (imported by 6 files)

Required environment variables (no defaults):
- BASE_URL (playwright.config.ts)
- CI (playwright.config.ts)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (route.ts)
- NEXT_PUBLIC_SUPABASE_URL (route.ts)

Read .codesight/wiki/index.md for orientation (WHERE things live). Then read actual source files before implementing. Wiki articles are navigation aids, not implementation guides.
Read .codesight/CODESIGHT.md for the complete AI context map including all routes, schema, components, libraries, config, middleware, and dependency graph.
