# Milestones

## v1.0 MVP (Shipped: 2026-04-11)

**Phases completed:** 5 phases, 16 plans, 11 tasks

**Key accomplishments:**

- Next.js 16 app with shadcn sidebar (Songs/Discovery/Playlists), next-themes dark mode toggle, health endpoint, Playwright smoke tests passing, and live Vercel deployment approved
- Drizzle schema with four tables (JSONB chords, tsvector GIN index, pgEnum keys, fractional position), committed migration SQL applied to live Supabase, and /api/health confirmed returning {status:ok,db:ok} on Vercel (https://haze-song-tool.vercel.app)
- Drizzle relations, Zod validation schemas, complete song CRUD API routes, and Playwright e2e test stubs for SONG-01 through SONG-06
- TagInput chip component, SongForm (react-hook-form + Zod), DeleteConfirm inline confirmation, and SongSheet slide-out wrapping all form UI
- TanStack Table with pagination, Songs page wired end-to-end (filters + sheet + table), and all SONG e2e tests passing
- Zod filterSchema + extended GET /api/songs with 7 dynamic AND filter conditions + Discovery e2e test stubs
- SongFilters component integrated on Songs page; /discovery reimplemented as AI natural language search UI (backend deferred)
- Complete playlist API routes (9 endpoints), fractional indexing library, Camelot harmonic compatibility library, and Playwright e2e stubs
- PlaylistBuilder component for creating playlists, "Save as Playlist" wired on Songs and Discovery pages, and Playlists list page
- Full playlist detail page with PlaylistEditor, AddSongsDialog, SuggestionsPanel, ExportMenu, and PlaylistNameEditor
- dnd-kit drag-and-drop in PlaylistEditor with DragOverlay, optimistic reorder, PUT /api/playlists/[id]/songs persistence, and error rollback
- Playlists list now shows per-playlist song counts (LEFT JOIN aggregate) and labeled dates; save navigates to the new playlist detail page by dismissing the builder overlay first
- PlaylistBuilder now excludes added songs from the library panel and uses DragOverlay with activation constraint for smooth, jank-free reordering
- One-liner:
- One-liner:
- One-liner:

---
