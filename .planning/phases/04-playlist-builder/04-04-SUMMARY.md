---
phase: 04-playlist-builder
plan: "04"
subsystem: ui
tags: [dnd-kit, drag-and-drop, fractional-indexing, optimistic-ui]

# Dependency graph
requires: [04-01, 04-02, 04-03]
provides:
  - Complete drag-and-drop reorder in PlaylistEditor: PointerSensor + KeyboardSensor, DragOverlay ghost, optimistic arrayMove, PUT /api/playlists/[id]/songs on drag end, rollback on failure
  - PUT /api/playlists/[id]/songs: accepts ordered songId array, recalculates positions sequentially in transaction, updates playlist.updatedAt
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PointerSensor (mouse/touch) + KeyboardSensor (accessibility) registered in useSensors
    - DragStartEvent stores activeId for DragOverlay rendering
    - DragEndEvent: arrayMove(songs, over.index, active.index) for optimistic local reorder
    - Persist: PUT /api/playlists/[id]/songs with { songIds: songs.map(s => s.id) }
    - Rollback: setSongs(previousOrder) if PUT returns !ok
    - PUT handler loops songIds with index-based sequential positions in transaction
    - position as real (float) — sequential integers sufficient for this approach; fractional used for append

key-files:
  modified:
    - src/components/ui/playlist-editor.tsx (completed dnd-kit integration with DragOverlay, optimistic update, rollback)
    - src/app/api/playlists/[id]/songs/route.ts (PUT handler, transaction, sequential positions)

key-decisions:
  - "Full songId array for reorder (not delta/patch): simpler to implement; positions are always recalculated sequentially server-side"
  - "Optimistic update (setSongs(arrayMove)) before API call: UI feels instant; rollback restores previous order if API fails"
  - "DragOverlay renders a copy of the row with opacity and scale — avoids layout shift in the sortable list"
  - "KeyboardSensor included for accessibility: Tab to focus drag handle, Space to pick up, arrow keys to move, Space to drop"

requirements-completed: [PLAY-03]

# Metrics
duration: ~40min
completed: 2026-03-10
---

# Phase 4 Plan 04: Drag-and-Drop Reorder

**dnd-kit drag-and-drop in PlaylistEditor with DragOverlay, optimistic reorder, PUT /api/playlists/[id]/songs persistence, and error rollback**

## Accomplishments

- Completed `PlaylistEditor` drag-and-drop:
  - `PointerSensor` (activationConstraint: distance 8px to avoid accidental drags) + `KeyboardSensor` (with `sortableKeyboardCoordinates`)
  - `DndContext` wraps song list with `onDragStart` (captures activeId) + `onDragEnd` (handles reorder)
  - `SortableContext` with `items={songs.map(s => s.song.id)}` + `verticalListSortingStrategy`
  - Each `ItemRow` uses `useSortable({ id: song.song.id })` with `CSS.Transform.toString(transform)` for smooth animation
  - `DragOverlay` renders `<ItemRow isDragOverlay>` ghost with shadow + reduced opacity
  - On drag end: `arrayMove` for optimistic local reorder → `PUT /api/playlists/[id]/songs` → `router.refresh()` on success; `setSongs(prev)` rollback on failure

- Completed `PUT /api/playlists/[id]/songs` handler:
  - Accepts `{ songIds: string[] }` (full ordered array)
  - In transaction: loops songIds, updates each `playlistSongs.position = i + 1`; updates `playlists.updatedAt`
  - Returns `{ ok: true }` on success

## Files Modified

- `src/components/ui/playlist-editor.tsx` — Full dnd-kit integration
- `src/app/api/playlists/[id]/songs/route.ts` — PUT handler for reorder

## Decisions Made

- **Full array reorder (not fractional per-drag)**: Simpler server implementation; positions are sequential integers after each reorder. Fractional indexing (`generateRank`) is used only for the `append` case (POST /songs add to end)
- **activationConstraint: distance 8px**: Prevents accidental drag when clicking remove or link buttons in the row
- **Optimistic + rollback**: User sees instant reorder; API failure is silent except for UI revert — appropriate for v1

## Self-Check: PASSED

- FOUND: PlaylistEditor uses DndContext + SortableContext + DragOverlay
- FOUND: onDragEnd calls arrayMove then PUT /api/playlists/[id]/songs
- FOUND: PUT /api/playlists/[id]/songs handler with transaction + sequential positions
- VERIFIED: PointerSensor has activationConstraint.distance = 8
- VERIFIED: KeyboardSensor registered for accessibility
- VERIFIED: Rollback: setSongs(prev) called if PUT !ok

---
*Phase: 04-playlist-builder*
*Completed: 2026-03-10*
