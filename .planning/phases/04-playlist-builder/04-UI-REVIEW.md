# Phase 4 — UI Review

**Audited:** 2026-04-09
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md)
**Screenshots:** Not captured — no dev server detected on ports 3000, 5173, 8080

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Copy is purposeful and specific; default playlist name "My New Playlist" is generic |
| 2. Visuals | 3/4 | Strong DAW-aesthetic hierarchy; border-radius inconsistency between PlaylistBuilder and PlaylistEditor |
| 3. Color | 4/4 | Disciplined token usage — accent used for meaning only; chart-4 CSS variable for compatibility highlights |
| 4. Typography | 4/4 | Tight 4-size scale (xs/sm/xl/[10px]); 2 weights only; font-mono on all music data |
| 5. Spacing | 3/4 | Mostly systematic; one arbitrary `h-[calc(100vh-theme(spacing.32))]` and `text-[10px]` off-scale |
| 6. Experience Design | 3/4 | Loading/error states present throughout; destructive delete on list page has no confirmation |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Delete playlist on list page has no confirmation dialog** — Musicians under time pressure can accidentally delete a playlist with a single click on a ghost-revealed button; there is no undo. Add an inline "Are you sure? Delete / Cancel" confirmation or an AlertDialog before calling `handleDelete`. File: `src/app/playlists/page.tsx` line 74.

2. **Border-radius inconsistency between PlaylistBuilder and PlaylistEditor/detail UI** — The PlaylistBuilder uses `rounded-md` and `rounded-lg` for its song rows and panels, while the rest of the playlist UI (PlaylistEditor, SuggestionsPanel, list rows) consistently uses `rounded-sm`. The DragOverlay ghost in PlaylistEditor uses `rounded-xl` (line 301), which is markedly rounder than everything else. This creates visual incoherence across the creation vs. management flows. Standardize to `rounded-sm` throughout, matching the detail page aesthetic.

3. **Icon-only buttons have no aria-labels** — The remove (X) button in `SortablePlaylistItem` (playlist-builder.tsx line 90), the drag handle buttons, the Pencil edit button in `PlaylistNameEditor` (line 83), and the confirm/cancel icons in edit mode all lack `aria-label` attributes. Screen-reader users and keyboard navigators have no announced action. Add `aria-label="Remove song"`, `aria-label="Edit playlist name"`, etc.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

Overall the copy respects the "professional tool, not product" mandate — no marketing speak, no exclamation points, no filler.

**Strengths:**
- Empty state on detail page: "This playlist is empty / Use 'Add Songs' to get started" — specific and actionable (`src/app/playlists/[id]/page.tsx` line 89–90)
- Empty state on builder: "Playlist is empty / Drag songs here or click + to add" — instructional and accurate (`src/components/playlist-builder.tsx` lines 263–264)
- Suggestions empty state distinguishes two cases: "No compatible songs found in your catalog." vs. "All suggestions are already in this playlist." — good disambiguation (`src/components/ui/suggestions-panel.tsx` lines 102–103)
- Toast copy uses quoted names: `"${name}" saved` / `"${name}" deleted` — concrete and contextual
- Button labels are verb-object: "Save Playlist", "Add Selected", "Export as CSV", "Print Setlist"

**Issues:**
- `initialName = "My New Playlist"` (playlist-builder.tsx line 105) — the default name is consumer-speak. A blank field with placeholder "Setlist name..." would be more appropriate for the brand; it forces intentional naming and avoids saving a playlist literally named "My New Playlist"
- Delete button on list page shows `"..."` as loading state (page.tsx line 152) — this communicates nothing. Change to `"Deleting"` for clarity
- The "Loading..." text in the playlists list (page.tsx line 119) uses `font-mono` — correct for the aesthetic, but the string itself is generic; "Loading playlists..." would be marginally better

### Pillar 2: Visuals (3/4)

**Strengths:**
- PlaylistEditor song rows: track number, song name, Camelot badge, key/signature, time signature, BPM — information density is high and well-layered; this matches the DAW reference
- The Camelot badge uses `bg-primary/10 text-primary` to create a distinct semantic highlight without injecting raw color
- Drag handle is visually recessive (`text-muted-foreground/40`) until hover — appropriately quiet
- Playlists list page uses a `border-l-2` left-border accent on hover — a subtle but effective affordance borrowed from code editor / IDE design
- SuggestionsPanel uses `uppercase tracking-widest` section label pattern consistent with the rest of the app
- DragOverlay ghost has `opacity-95 shadow-md` to visually lift the dragged item

**Issues:**
- **Border-radius fragmentation**: PlaylistBuilder uses `rounded-md` for song rows and `rounded-lg` for panel containers. The detail page and all other playlist components use `rounded-sm`. The DragOverlay uses `rounded-xl` (playlist-editor.tsx line 301). This is the most visible visual inconsistency — the builder feels like a different product from the editor
- **Add button on builder library is opacity-0 by default** (playlist-builder.tsx line 225: `opacity-0 group-hover:opacity-100`) — on touch devices this affordance is invisible; users may not discover the add action
- **PlaylistBuilder lacks a song count for the library panel** — the right panel shows "{N} songs" at the bottom footer, but the left library panel has no count. Adding "Library · 148 songs" to the panel header would help orientation
- **No visual distinction between "selected" state in AddSongsDialog** — only a `bg-muted` background change and a `Check` icon at the far right indicate selection. Given the list can be long, a left-border accent or stronger fill would scan faster for a musician quickly adding multiple songs

### Pillar 3: Color (4/4)

**Strengths:**
- All colors use OKLCH design tokens from `globals.css` — no hardcoded colors in the application UI layer
- `--chart-4` is used exclusively for compatibility highlights in the SuggestionsPanel (score ≥ 3) and playlist list hover accent — appropriate and contained usage
- `text-primary` / `bg-primary/10` is used only on the Camelot badge in PlaylistEditor (line 82) — exactly one semantic use, not decorative
- `text-destructive` with `hover:bg-destructive/10` is correctly applied only to remove/delete actions
- The hardcoded hex values in `export-menu.tsx` (lines 110–172) are entirely inside print HTML strings generated in a new window — they are not rendered in the app UI and represent print-page styling, which correctly uses absolute colors for paper output. This is not a flag

**No accent overuse detected.** Color is used for meaning only across all 6 components.

### Pillar 4: Typography (4/4)

**Strengths:**
- Font size scale in playlist components: `text-xs`, `text-sm`, `text-xl`, and one `text-[10px]` — effectively 4 sizes, with the `text-[10px]` used only for the playlist date stamp on the list page (a metadata label that benefits from being visually quieter than `text-xs`)
- Font weight scale: `font-medium` and `font-semibold` only — clean 2-weight system
- `font-mono` is applied consistently to all music data values: Camelot position, key/signature badges, time signature, BPM in suggestions, date stamps, pagination counter — this matches the "music data is the hero / Geist Mono for musical data values" design principle
- `tabular-nums` on BPM and date values — columns will align correctly even when numbers vary in digit count
- `uppercase tracking-widest` is used for section labels ("Playlists", "Smart Suggestions") — consistent with IDE/DAW convention for panel headers

**Minor note:** `text-[10px]` in `src/app/playlists/page.tsx` line 140 is an arbitrary Tailwind value slightly off the standard scale. The intent is a sub-xs label for date metadata, which is reasonable, but `text-xs` with `opacity-70` would achieve the same effect without an off-scale token.

### Pillar 5: Spacing (3/4)

**Strengths:**
- Padding pattern: `p-2`, `p-3`, `p-4`, `p-6` — standard Tailwind 4-step scale, consistent
- Gap pattern: `gap-2`, `gap-4`, `gap-6` — consistent even spacing for flex containers
- `space-y-2` for the builder's drag list, `space-y-6` for the detail page layout — appropriate hierarchy
- `px-4 py-3` for song rows across both PlaylistEditor and SuggestionsPanel — consistent row rhythm

**Issues:**
- `h-[calc(100vh-theme(spacing.32))]` in PlaylistBuilder (playlist-builder.tsx line 184) — an arbitrary computed height that subtracts the header. This works but is fragile if the header ever changes height, and it diverges from the standard spacing scale. A flex layout (`flex-1`) would be more robust
- `sm:h-[600px]` in AddSongsDialog (add-songs-dialog.tsx line 102) — hardcoded pixel height for the dialog, combined with `h-[80vh]` on mobile. The dual-mode sizing is functional but the fixed `600px` is off-scale. Using a CSS custom property or a Tailwind arbitrary rem value (`h-[37.5rem]`) would at least document intent, though the hardcoded pixel approach is common for modal dialogs
- `p-10` on the empty state in PlaylistBuilder (line 262) — this is a valid Tailwind token but stands out as larger than the surrounding `p-4`/`p-6` rhythm; `p-8` would align better

### Pillar 6: Experience Design (3/4)

**Strengths:**
- **Loading states**: All async data fetches have loading states — playlists list (line 118: `"Loading..."`), AddSongsDialog (line 116: `"Loading songs..."`), SuggestionsPanel (line 95: `"Finding compatible songs..."`)
- **Error boundaries**: Both `/playlists` and `/playlists/[id]` have `error.tsx` files delegating to `PageError` — server-level errors are caught
- **Empty states**: All three empty cases are covered — empty playlists list, empty playlist detail, empty builder, no-matching-songs in AddSongsDialog, no suggestions
- **Disabled states on async actions**: New Playlist button disabled during song fetch (page.tsx line 111), delete button disabled during deletion (line 148), "Add Selected" disabled during save (add-songs-dialog.tsx line 157), remove button disabled during `isRemoving` (playlist-editor.tsx line 109)
- **Optimistic + rollback**: PlaylistEditor drag reorder optimistically updates local state and rolls back on API failure (playlist-editor.tsx lines 230, 243)
- **Keyboard accessibility**: `KeyboardSensor` registered in both PlaylistBuilder and PlaylistEditor; `handleKeyDown` in PlaylistNameEditor handles Enter and Escape
- **Toast feedback**: Success and error toasts on playlist create, delete (playlists/page.tsx lines 70, 81, 83)

**Issues:**
- **No confirmation on playlist delete from list page** — `handleDelete` fires immediately on button click with no confirmation step (page.tsx line 74). The delete button is hidden on desktop behind `sm:opacity-0 sm:group-hover:opacity-100`, which provides some protection against accidental clicks, but a musician who fatfinger-clicks on mobile (where the button is `opacity-100` always) can irreversibly delete a playlist. This is the most impactful gap in the interaction design
- **Silent failure on add-songs save error** — In AddSongsDialog, the catch block only logs to console (line 90: `console.error(e)`); no toast or inline error message is shown to the user. The modal closes on success (`setOpen(false)`) but on failure stays open with no feedback. Add `toast.error("Failed to add songs")` in the catch
- **Silent failure on suggestions add** — `handleAdd` in SuggestionsPanel has a fully silent catch (lines 63–65, comment: `// silent`). If the add fails, the suggestion disappears from the list (it's filtered out optimistically) but the song is not actually in the playlist. Add error recovery: either don't remove the suggestion from the list until the API confirms, or restore it on failure with a toast
- **No aria-labels on icon-only buttons** — GripVertical drag handles, the X/Pencil/Check/X buttons in name editor, and the Plus button in builder library all lack `aria-label` attributes. The dnd-kit `attributes` object provides `aria-roledescription="sortable"` for drag handles, but no custom label describes the action

---

## Files Audited

- `src/components/playlist-builder.tsx`
- `src/components/ui/playlist-editor.tsx`
- `src/components/ui/add-songs-dialog.tsx`
- `src/components/ui/suggestions-panel.tsx`
- `src/components/ui/export-menu.tsx`
- `src/components/ui/playlist-name-editor.tsx`
- `src/app/playlists/page.tsx`
- `src/app/playlists/[id]/page.tsx`
- `src/app/playlists/error.tsx`
- `src/app/playlists/[id]/error.tsx`
- `src/app/globals.css`
- `src/app/songs/page.tsx` (Save as Playlist integration)
