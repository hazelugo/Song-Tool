# Dependency Graph

## Most Imported Files (change these carefully)

- `src/db/schema.ts` — imported by **29** files
- `src/lib/utils.ts` — imported by **28** files
- `src/components/ui/button.tsx` — imported by **23** files
- `src/db/index.ts` — imported by **17** files
- `src/lib/validations/song.ts` — imported by **12** files
- `src/lib/auth.ts` — imported by **11** files
- `src/components/ui/input.tsx` — imported by **8** files
- `src/lib/camelot.ts` — imported by **6** files
- `src/components/ui/label.tsx` — imported by **6** files
- `src/components/page-error.tsx` — imported by **5** files
- `src/lib/supabase/server.ts` — imported by **3** files
- `src/components/ui/badge.tsx` — imported by **3** files
- `src/lib/audio.ts` — imported by **2** files
- `src/lib/supabase/client.ts` — imported by **2** files
- `src/lib/ranking.ts` — imported by **2** files
- `src/components/ui/skeleton.tsx` — imported by **2** files
- `src/lib/parse-prompt.ts` — imported by **1** files
- `src/lib/validations/filter.ts` — imported by **1** files
- `src/lib/chords.ts` — imported by **1** files
- `src/components/discovery/chain-card.tsx` — imported by **1** files

## Import Map (who imports what)

- `src/db/schema.ts` ← `route.ts`, `src/app/api/discovery/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts`, `src/app/api/playlists/[id]/songs/route.ts` +24 more
- `src/lib/utils.ts` ← `src/app/chords/page.tsx`, `src/app/discovery/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/discovery/chain-card.tsx` +23 more
- `src/components/ui/button.tsx` ← `src/app/discovery/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/app/page.tsx`, `src/app/playlists/[id]/page.tsx` +18 more
- `src/db/index.ts` ← `route.ts`, `src/app/api/discovery/route.ts`, `src/app/api/health/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts` +12 more
- `src/lib/validations/song.ts` ← `src/app/api/songs/[id]/route.ts`, `src/app/api/songs/bulk/route.ts`, `src/app/api/songs/route.ts`, `src/app/chords/page.tsx`, `src/app/metronome/page.tsx` +7 more
- `src/lib/auth.ts` ← `src/app/api/discovery/route.ts`, `src/app/api/playlists/[id]/route.ts`, `src/app/api/playlists/[id]/songs/[songId]/route.ts`, `src/app/api/playlists/[id]/songs/route.ts`, `src/app/api/playlists/[id]/suggestions/route.ts` +6 more
- `src/components/ui/input.tsx` ← `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/playlist-builder.tsx`, `src/components/songs/song-filters.tsx`, `src/components/songs/song-form.tsx` +3 more
- `src/lib/camelot.ts` ← `src/app/api/playlists/[id]/suggestions/route.ts`, `src/app/api/similar/route.ts`, `src/components/discovery/chain-card.tsx`, `src/components/discovery/song-card.tsx`, `src/components/ui/live-mode.tsx` +1 more
- `src/components/ui/label.tsx` ← `src/app/chords/page.tsx`, `src/app/login/page.tsx`, `src/app/metronome/page.tsx`, `src/components/playlist-builder.tsx`, `src/components/songs/song-filters.tsx` +1 more
- `src/components/page-error.tsx` ← `src/app/discovery/error.tsx`, `src/app/error.tsx`, `src/app/playlists/[id]/error.tsx`, `src/app/playlists/error.tsx`, `src/app/songs/error.tsx`
