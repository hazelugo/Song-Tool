## Design Context

### Users
Working musicians and performers actively managing a live song catalog. Their context: booking gigs, building setlists, prepping for rehearsal — often under time pressure. They need to find the right song fast, not browse leisurely. The interface should respect their time and feel like a professional tool, not a consumer app.

### Brand Personality
**Precise. Purposeful. Dark.**

Like a DAW opened at 2am in a recording studio — functional, serious, and quietly satisfying to use. Not flashy or decorative. The music is the content; the UI recedes.

Reference: Ableton Live, Logic Pro — dense but organized, respects user intelligence, rewards familiarity.

Anti-reference: Streaming apps (Spotify consumer aesthetic), playful SaaS (rounded bubbles, pastel gradients, marketing-speak).

### Aesthetic Direction
- Dark-mode primary, light-mode parity (both get equal polish)
- Neutral OKLCH palette — color used for meaning only (status, focus, destructive)
- Dense but scannable: tabular layouts, monospaced data (BPM, key, time sig)
- Minimal chrome: navigation stays out of the way
- Geist Sans for UI, Geist Mono for musical data values

### Design Principles
1. **Function earns every pixel** — No decorative elements that don't carry information or aid interaction.
2. **Scan speed over visual delight** — Optimize typography and contrast for rapid scanning under time pressure.
3. **Dark-native, light-consistent** — Design dark first; translate to light without losing density or character.
4. **Music data is the hero** — Key, BPM, time signature, chord progressions should be typographically prominent.
5. **Professional tool, not product** — Ableton/Logic aesthetic: structured, information-dense, zero marketing tone.


# song-tool — Project Context

**Stack:** next-app, hono | drizzle | typescript

22 routes | 4 models | 5 env vars | 186 import links

**API areas:** /api/discovery, /api/health, /api/playlists, /api/similar, /api/songs, /

**High-impact files** (change carefully):
- src/db/schema.ts (imported by 29 files)
- src/lib/utils.ts (imported by 28 files)
- src/components/ui/button.tsx (imported by 23 files)
- src/db/index.ts (imported by 17 files)
- src/lib/validations/song.ts (imported by 12 files)

**Required env vars:** BASE_URL, CI, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL

---

## Instructions for Claude Code

### Two-Step Rule (mandatory)
**Step 1 — Orient:** Use wiki articles to find WHERE things live.
**Step 2 — Verify:** Read the actual source files listed in the wiki article BEFORE writing any code.

Wiki articles are structural summaries extracted by AST. They show routes, models, and file locations.
They do NOT show full function logic, middleware internals, or dynamic runtime behavior.
**Never write or modify code based solely on wiki content — always read source files first.**

Read in order at session start:
1. `.codesight/wiki/index.md` — orientation map (~200 tokens)
2. `.codesight/wiki/overview.md` — architecture overview (~500 tokens)
3. Domain article (e.g. `.codesight/wiki/auth.md`) → check "Source Files" section → read those files
4. `.codesight/CODESIGHT.md` — full context map for deep exploration

Routes marked `[inferred]` in wiki articles were detected via regex — verify against source before trusting.
If any source file shows ⚠ in the wiki, re-run `npx codesight --wiki` before proceeding.

Or use the codesight MCP server for on-demand queries:
   - `codesight_get_wiki_article` — read a specific wiki article by name
   - `codesight_get_wiki_index` — get the wiki index
   - `codesight_get_summary` — quick project overview
   - `codesight_get_routes --prefix /api/users` — filtered routes
   - `codesight_get_blast_radius --file src/lib/db.ts` — impact analysis before changes
   - `codesight_get_schema --model users` — specific model details

Only open specific files after consulting codesight context. This saves ~32,765 tokens per conversation.
