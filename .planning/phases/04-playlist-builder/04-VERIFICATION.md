---
phase: 04-playlist-builder
verified: 2026-04-10T12:00:00Z
status: human_needed
score: 22/22 truths verified
re_verification: true
gaps: []
human_verification:
  - test: "Create a playlist from filtered songs on /songs page"
    expected: "PlaylistBuilder opens with filtered results pre-loaded; after saving, browser navigates to /playlists/[newId]"
    why_human: "Full flow requires browser interaction with drag-and-drop and navigation"
  - test: "Drag to reorder songs in a saved playlist on /playlists/[id]"
    expected: "Song order updates optimistically; after page reload songs appear in new order"
    why_human: "Requires verifying optimistic update and persistence together via browser"
  - test: "Suggestions panel on playlist detail page"
    expected: "'Suggest songs' button is visible in header; clicking opens SuggestionsPanel; suggestions load and can be added"
    why_human: "Requires Camelot scoring against real catalog data in browser"
  - test: "Export CSV from playlist detail"
    expected: "Downloaded CSV has columns: Name, Artist, BPM, Key, Key Signature, Time Signature, Tags"
    why_human: "File download requires browser; column presence needs visual inspection"
---

# Phase 4: Playlist Builder Verification Report

**Phase Goal:** Build a complete playlist builder — create playlists from filtered song results, view/edit playlist detail with drag-and-drop reorder, get harmonic song suggestions, and export playlists.
**Verified:** 2026-04-10
**Status:** gaps_found — 2 gaps (1 infrastructure blocker, 1 documentation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/playlists returns playlist list with songCount, ordered by updatedAt desc | VERIFIED | route.ts uses LEFT JOIN + GROUP BY + desc(updatedAt); returns songCount |
| 2 | POST /api/playlists creates a playlist with optional initial songs | VERIFIED | Transaction in route.ts: insert playlists then insert playlistSongs |
| 3 | GET /api/playlists/[id] returns playlist with songs + tags, ordered by position | VERIFIED | findFirst with songs.song.tags relation, orderBy position asc |
| 4 | PATCH /api/playlists/[id] renames the playlist | VERIFIED | PATCH handler updates name field, returns {ok: true} |
| 5 | DELETE /api/playlists/[id] soft-deletes (sets deletedAt), returns 204 | VERIFIED | Sets deletedAt: new Date(), returns `new Response(null, {status:204})` |
| 6 | POST /api/playlists/[id]/songs adds songs at end (max position + 1) | VERIFIED | max(playlistSongs.position) + 1; onConflictDoNothing |
| 7 | PUT /api/playlists/[id]/songs reorders songs (bulk UPDATE via VALUES list) | VERIFIED | SQL bulk UPDATE with VALUES list; accepts {items: [{songId, position}]} |
| 8 | DELETE /api/playlists/[id]/songs/[songId] removes song from join table only | VERIFIED | Deletes from playlistSongs only; song record untouched |
| 9 | GET /api/playlists/[id]/suggestions returns top 10 Camelot-compatible songs | VERIFIED | Camelot + BPM scoring; scored.slice(0, 10) returned |
| 10 | src/lib/ranking.ts exports generateRank and rebalanceRanks | VERIFIED | Both functions exported; fractional midpoint logic present |
| 11 | src/lib/camelot.ts exports getCamelotPosition, getKeyCompatibility, formatCamelot | VERIFIED | All three exported; 17 enharmonic key mappings present |
| 12 | PlaylistBuilder renders sortable list, name input, Save button with DragOverlay | VERIFIED | DndContext + SortableContext + DragOverlay; Save button async onSave |
| 13 | Songs from catalog excluded from available pool after being added | VERIFIED | itemSongIds Set via useMemo; filteredSongs excludes has(song.id) |
| 14 | Saving playlist navigates to /playlists/[id] (not just /playlists) | VERIFIED | setShowBuilder(false) then router.push(`/playlists/${data.id}`) |
| 15 | Playlists list page shows name, song count, last updated label | VERIFIED | "N songs" + "Last updated [date]" in playlist rows |
| 16 | Playlist detail page shows songs with YouTube/Spotify link buttons | VERIFIED | ItemRow has conditional YouTube and Spotify SVG icon links; target="_blank" |
| 17 | User can drag to reorder in PlaylistEditor with DragOverlay + optimistic update | VERIFIED | handleDragEnd: arrayMove + setItems + PUT request; rollback on catch |
| 18 | User can rename playlist inline (PlaylistNameEditor → PATCH) | VERIFIED | Click-to-edit; PATCH on Enter/blur; reverts on error |
| 19 | User can add songs via AddSongsDialog (POST /api/playlists/[id]/songs) | VERIFIED | Dialog fetches /api/songs, multi-select, POST songIds array on save |
| 20 | User can see suggestions via "Suggest songs" header button (SuggestionsPanel) | VERIFIED | PlaylistActions renders Suggest songs Button (Sparkles); SuggestionsPanel controlled |
| 21 | User can export playlist as CSV/JSON/print with Artist + Time Signature | VERIFIED | ExportMenu CSV has 7 columns including Artist and Time Signature |
| 22 | sonner package installed — playlists/page.tsx and layout.tsx compile | FAILED | sonner in package.json but npm ls sonner shows empty; tsc TS2307 errors |

**Score:** 21/22 truths verified (1 infrastructure gap)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/ranking.ts` | Fractional indexing helpers | VERIFIED | generateRank + rebalanceRanks exported; 30 lines |
| `src/lib/camelot.ts` | Camelot Wheel key compatibility | VERIFIED | 82 lines; getCamelotPosition, getKeyCompatibility, formatCamelot; 17 keys |
| `src/app/api/playlists/route.ts` | GET list + POST create | VERIFIED | LEFT JOIN songCount aggregate; transaction for create |
| `src/app/api/playlists/[id]/route.ts` | GET detail + PATCH rename + DELETE soft | VERIFIED | All three handlers; soft delete via deletedAt |
| `src/app/api/playlists/[id]/songs/route.ts` | POST add + PUT reorder | VERIFIED | POST appends; PUT bulk UPDATE via VALUES list |
| `src/app/api/playlists/[id]/songs/[songId]/route.ts` | DELETE remove from join table | VERIFIED | Deletes playlistSongs row only |
| `src/app/api/playlists/[id]/suggestions/route.ts` | GET Camelot-based suggestions | VERIFIED | BPM filter + Camelot scoring; top 10 |
| `src/components/playlist-builder.tsx` | PlaylistBuilder + PlaylistItem | VERIFIED | DragOverlay; itemSongIds Set exclusion; async Save |
| `src/app/playlists/page.tsx` | Playlists list page | VERIFIED | Fetches /api/playlists; song count + labeled date; New Playlist |
| `src/app/playlists/[id]/page.tsx` | Playlist detail server page | VERIFIED | Drizzle query with tags; passes fields to client components |
| `src/components/ui/playlist-editor.tsx` | PlaylistEditor with dnd-kit + links | VERIFIED | DragOverlay; streaming links; remove; fractional reorder |
| `src/components/ui/add-songs-dialog.tsx` | AddSongsDialog | VERIFIED | Search + multi-select; POST on save; router.refresh |
| `src/components/ui/suggestions-panel.tsx` | SuggestionsPanel controlled | VERIFIED | open/onOpenChange props; lazy load; X close button |
| `src/components/ui/export-menu.tsx` | ExportMenu CSV+JSON+print | VERIFIED | 7-column CSV; JSON with artist/timeSignature; print setlist |
| `src/components/ui/playlist-name-editor.tsx` | PlaylistNameEditor | VERIFIED | PATCH on Enter/blur; revert on error |
| `src/components/ui/playlist-actions.tsx` | PlaylistActions client wrapper | VERIFIED | Sparkles button; SuggestionsPanel + ExportMenu + AddSongsDialog |
| `tests/e2e/playlists.spec.ts` | E2E tests for PLAY-01 to PLAY-06 | VERIFIED | Substantive tests with assertions; not stubs |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/playlists/route.ts` | `playlistSongs` table | LEFT JOIN + count aggregate | VERIFIED | `sql<number>\`cast(count(${playlistSongs.songId}) as integer)\`` present |
| `src/app/playlists/page.tsx` | `handleSave` | setShowBuilder(false) before router.push | VERIFIED | Line 72-73: setShowBuilder(false) then router.push |
| `PlaylistBuilder` filteredSongs | items state | Set exclusion filter | VERIFIED | itemSongIds = useMemo(() => new Set(items.map(...))); filteredSongs filters !itemSongIds.has |
| `PlaylistBuilder` DndContext | DragOverlay | activeId state tracking | VERIFIED | handleDragStart sets activeId; DragOverlay renders activeItem |
| `PlaylistEditor` ItemRow | Song interface | youtubeUrl/spotifyUrl fields | VERIFIED | Song interface has youtubeUrl and spotifyUrl; conditional render in ItemRow |
| `src/app/playlists/[id]/page.tsx` | SuggestionsPanel | PlaylistActions "Suggest songs" button | VERIFIED | PlaylistActions with Sparkles button toggles showSuggestions |
| `PlaylistEditor` handleDragEnd | PUT /api/playlists/[id]/songs | items.map({songId, position}) | VERIFIED | fetch PUT with `{items: newItems.map(item => ({songId: item.id, position: item.position}))}` |
| `playlist-editor.tsx` handleRemove | DELETE /api/playlists/[id]/songs/[songId] | fetch DELETE | VERIFIED | `fetch(\`/api/playlists/${playlistId}/songs/${songId}\`, {method: "DELETE"})` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `playlists/page.tsx` | playlists state | GET /api/playlists (fetch in useEffect) | Yes — LEFT JOIN aggregate query | FLOWING |
| `playlists/[id]/page.tsx` | playlist | Drizzle findFirst with relations | Yes — real DB query | FLOWING |
| `playlist-editor.tsx` | items state | initialSongs prop from server component | Yes — server-side Drizzle query | FLOWING |
| `suggestions-panel.tsx` | suggestions state | fetch /api/playlists/[id]/suggestions (useEffect on open) | Yes — scored from DB candidates | FLOWING |
| `export-menu.tsx` | songs prop | exportSongs mapped in page.tsx | Yes — from playlist Drizzle query | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| ranking.ts exports accessible | `node -e "const m=require('./src/lib/ranking.ts'); console.log(typeof m.generateRank)"` | Skipped — TypeScript file, not runnable directly | SKIP |
| camelot.ts module structure | Read src/lib/camelot.ts — exports verified | getCamelotPosition, getKeyCompatibility, formatCamelot all present | PASS |
| TypeScript compilation | `npx tsc --noEmit` | 3 errors on sonner (missing package); no other errors | PARTIAL |

Step 7b note: Server cannot be started without `npm install`. TypeScript errors are isolated to `sonner` import — all other phase 4 code compiles cleanly.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| PLAY-01 | 04-01, 04-02, 04-05, 04-06 | Save filtered song list as named playlist | SATISFIED | PlaylistBuilder on /songs; inline form on /discovery; POST /api/playlists |
| PLAY-02 | 04-01, 04-03, 04-05, 04-07 | View list of all saved playlists | SATISFIED | /playlists page fetches GET /api/playlists; shows name, song count, date |
| PLAY-03 | 04-01, 04-04, 04-06 | Open playlist and see songs in saved order | SATISFIED | /playlists/[id] page; PlaylistEditor ordered by position asc |
| PLAY-04 | 04-03, 04-04 | Reorder songs via drag-and-drop | SATISFIED | PlaylistEditor: dnd-kit + DragOverlay + PUT persistence + rollback |
| PLAY-05 | 04-01, 04-03, 04-07 | Open YouTube/Spotify link from playlist view | SATISFIED | ItemRow in playlist-editor.tsx: conditional SVG icon links, target="_blank" |
| PLAY-06 | 04-01, 04-03 | Remove song from playlist (not from DB) | SATISFIED | handleRemove → DELETE /api/playlists/[id]/songs/[songId] → playlistSongs row only |
| PLAY-07 | 04-01 | Delete saved playlist | SATISFIED | handleDelete on /playlists page → DELETE /api/playlists/[id] → sets deletedAt |

**Requirements.md discrepancy (documentation gap):** REQUIREMENTS.md marks PLAY-05, PLAY-06, PLAY-07 as `[ ]` (Pending) and the traceability table shows them as "Pending". All three are fully implemented. This needs to be updated.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/playlists/page.tsx` | 6 | `import { toast } from 'sonner'` — sonner not installed | Blocker | TypeScript compile failure; toast calls at lines 71 and 85 will fail at runtime |
| `src/app/layout.tsx` | 7 | `import { Toaster } from 'sonner'` — sonner not installed | Blocker | App-level Toaster component fails to render |
| `src/app/discovery/page.tsx` | 24 | `import { toast } from 'sonner'` — sonner not installed | Warning | Discovery page toast calls will fail at runtime |
| `.planning/REQUIREMENTS.md` | 38-40, 112-114 | PLAY-05/06/07 marked Pending despite full implementation | Info | Misleading project state documentation |

**Anti-pattern classification notes:**
- The `sonner` missing install is a build blocker: `npm ls sonner` returns empty despite being in package.json. Running `npm install` would resolve it. This is likely an environment issue where `node_modules` was not regenerated after the dependency was added.
- No placeholder/stub components were found. All components render real data.
- No hardcoded empty arrays passed as props to rendering components.

---

### Human Verification Required

#### 1. Playlist Creation Flow

**Test:** On /songs page, filter songs, click "Save results as Playlist". In PlaylistBuilder, name the playlist, reorder songs by drag, click "Save Playlist".
**Expected:** After save, browser navigates to `/playlists/[newId]` (not `/playlists`). New playlist appears in list.
**Why human:** Full navigation flow requires browser; drag-and-drop cannot be tested programmatically without Playwright.

#### 2. Drag-and-Drop Persistence in PlaylistEditor

**Test:** On /playlists/[id], drag song from position 1 to position 3. Reload the page.
**Expected:** Songs appear in the new order after reload (persisted to DB). No visual jank during drag (DragOverlay follows cursor).
**Why human:** Requires browser interaction + page reload to verify DB persistence.

#### 3. Suggestions Panel Discoverability

**Test:** On /playlists/[id] with at least 2 songs, click "Suggest songs" button in header.
**Expected:** SuggestionsPanel opens below song list with Camelot-compatible suggestions. Songs can be added with one click. Panel closes with X button.
**Why human:** Requires real catalog data and Supabase auth session; Camelot scoring output cannot be verified without matching songs in DB.

#### 4. CSV Export Column Verification

**Test:** On /playlists/[id], click Export > Export as CSV. Open the file.
**Expected:** File has 7 columns: Name, Artist, BPM, Key, Key Signature, Time Signature, Tags.
**Why human:** File download requires browser; column presence requires opening the downloaded file.

---

### Gaps Summary

**Gap 1 (Blocker — Infrastructure):** `sonner` is declared in `package.json` but not installed in `node_modules`. This causes TypeScript compile errors in `src/app/playlists/page.tsx` (core phase 4 deliverable), `src/app/layout.tsx`, and `src/app/discovery/page.tsx`. The fix is a single `npm install` — the dependency declaration already exists. This is an environment sync issue, not a code issue.

**Gap 2 (Documentation):** `REQUIREMENTS.md` has not been updated to mark PLAY-05 (streaming links), PLAY-06 (remove song), and PLAY-07 (delete playlist) as complete. All three are fully implemented in the codebase. The traceability table on lines 112-114 also shows "Pending" for these. This is a documentation tracking gap that should be updated to accurately reflect project state.

**Deviations noted (not gaps — functional alternatives):**
- Discovery page saves playlists via an inline form rather than the PlaylistBuilder component. The goal (save discovery results as a playlist) is achieved; the implementation differs from PLAN-02's specified approach.
- The PUT /api/playlists/[id]/songs interface accepts `{items: [{songId, position}]}` (fractional positions preserved) rather than a simple ordered songId array. Client and server are consistent; this is an improvement over the original plan spec.
- The API routes use real Supabase auth (`requireUser()`) rather than the hardcoded USER_ID described in the summaries. This is functionally superior to the v1 plan's "no auth" approach.

---

*Verified: 2026-04-10*
*Verifier: Claude (gsd-verifier)*
