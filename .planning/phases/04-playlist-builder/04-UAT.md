---
status: diagnosed
phase: 04-playlist-builder
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Playlists List Page
expected: Navigate to /playlists. You should see a list of your saved playlists showing each playlist's name, song count, and last updated time. A "New Playlist" button appears at the top. Clicking any playlist row navigates to its detail page.
result: issue
reported: "i see the playlist names and a date (doesnt specify its the last updated date) i do not see number of songs in the playlist from this overview page"
severity: major

### 2. Save as Playlist from Songs Page
expected: On the /songs page, filter or search to get some results. A "Save results as Playlist" button should be visible. Clicking it opens the PlaylistBuilder view (full-screen inline, not a modal) pre-populated with your current filtered songs.
result: issue
reported: "yes it does, however when i add a song from this pre-populated section, it does add it but it also stays in that pre-populated side instead of disappearing, which seems like its more intuitive for it to disappear"
severity: minor

### 3. PlaylistBuilder: Name, Reorder, Remove, Save
expected: Inside PlaylistBuilder, you can: type a name in the "Playlist name" field, drag songs up/down to reorder them, click × to remove a song, and click Save. On save, you are redirected to the new playlist's detail page at /playlists/[id].
result: issue
reported: "the drag is a little janky it could be smoother. after i save a playlist it does not go to the new playlists detail page it goes to the playlist page where all of the other playlists exist"
severity: major

### 4. Save as Playlist from Discovery Page
expected: On the /discovery page, run a search to get results. A "Save results as Playlist" button should be visible. Clicking it opens PlaylistBuilder pre-populated with those discovery results.
result: issue
reported: "discovery is completely broken there is no AI capability right now it is acting like a regular search bar"
severity: major

### 5. Playlist Detail: Songs with Music Data
expected: On a playlist detail page (/playlists/[id]), songs appear in order with each row showing: song name, BPM badge, Camelot position (e.g. "5A"), YouTube link button, Spotify link button, and a remove (×) button. A drag handle (grip icon) is on each row.
result: issue
reported: "on playlist detail page i see the songs in order with the following in this order: song name, camelot, key signature with maj or min, time signature, and finally bpm. there is no youtube or spotify indicator."
severity: major

### 6. Rename Playlist
expected: On the playlist detail page, click the playlist name (the h1 heading). It becomes an editable input. Type a new name and press Enter or click away. The heading updates to the new name immediately (optimistic). The change persists on page refresh.
result: pass

### 7. Add Songs from Catalog
expected: On the playlist detail page, click "Add Songs". A modal opens with a search field and a list of catalog songs (songs not already in the playlist). You can search to filter, click songs to select them (checkmarks appear), then click Save. The selected songs appear in the playlist.
result: pass

### 8. Camelot Suggestions Panel
expected: On the playlist detail page, there is a collapsible "Suggestions" section (with a Sparkles icon or chevron). Expanding it loads and shows up to 10 songs from your catalog ranked by harmonic compatibility (Camelot Wheel match + BPM proximity). Each suggestion shows the song name, BPM, key, and a reason label. Clicking a suggestion adds it to the playlist.
result: pass
note: User was unaware of the feature — discoverability is low. Consider surfacing it more prominently.

### 9. Export Playlist
expected: On the playlist detail page, there is an Export button or dropdown. Opening it shows two options: "Download CSV" and "Download Text". Clicking either triggers a file download. The CSV includes columns: Name, BPM, Key, Key Sig, Tags. The text version is one song per line.
result: pass
note: User wants export to also include Time Signature and Artist fields in both CSV and text output.

### 10. Drag-and-Drop Reorder in Playlist Detail
expected: On the playlist detail page, grab a song row by its drag handle (grip icon on the left). Drag it up or down and release. The song list reorders immediately (optimistic). Refresh the page — the new order should persist.
result: pass
note: User noted this drag is noticeably smoother than the PlaylistBuilder drag — confirms the jankiness in test 3 is specific to the builder component.

## Summary

total: 10
passed: 5
issues: 5
skipped: 0
pending: 0

## Gaps

- truth: "Playlist detail song rows show YouTube and Spotify link buttons"
  status: failed
  reason: "User reported: there is no youtube or spotify indicator on the playlist detail page"
  severity: major
  test: 5
  root_cause: "Song interface in playlist-editor.tsx does not include youtubeUrl/spotifyUrl fields and ItemRow has no button markup for them — feature was never implemented in this component"
  artifacts:
    - path: "src/components/ui/playlist-editor.tsx"
      issue: "Song interface missing youtubeUrl/spotifyUrl; ItemRow has no streaming link buttons"
  missing:
    - "Add youtubeUrl: string | null and spotifyUrl: string | null to Song interface"
    - "Add conditional link buttons in ItemRow for each non-null streaming URL"

- truth: "Discovery page provides intelligent song discovery beyond a plain text search bar"
  status: failed
  reason: "User reported: discovery is completely broken there is no AI capability right now it is acting like a regular search bar"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "Saving a playlist in PlaylistBuilder navigates to the new playlist's detail page /playlists/[id]"
  status: failed
  reason: "User reported: after i save a playlist it does not go to the new playlists detail page it goes to the playlist page where all of the other playlists exist"
  severity: major
  test: 3
  root_cause: "handleSave in playlists/page.tsx calls router.push('/playlists/[id]') correctly but never calls setShowBuilder(false) first, so the builder is still mounted when navigation fires — the still-live /playlists page component shadows the push. Also, onClick in PlaylistBuilder calls onSave without await so the async save runs as a floating Promise."
  artifacts:
    - path: "src/app/playlists/page.tsx"
      issue: "handleSave never calls setShowBuilder(false) before router.push; builder stays mounted and shadows navigation"
    - path: "src/components/playlist-builder.tsx"
      issue: "onClick fires onSave without await — async save is a floating Promise"
  missing:
    - "Call setShowBuilder(false) in handleSave before or alongside router.push"
    - "Await onSave in PlaylistBuilder button onClick"

- truth: "Drag-and-drop reorder in PlaylistBuilder is smooth"
  status: failed
  reason: "User reported: the drag is a little janky it could be smoother"
  severity: minor
  test: 3
  root_cause: "PlaylistBuilder is missing DragOverlay — dnd-kit physically moves the real DOM node, causing full-list repaints on every pointer-move. PlaylistEditor uses DragOverlay with dropAnimation={null} so only a lightweight portal clone moves. Also missing activationConstraint: {distance: 8} on PointerSensor."
  artifacts:
    - path: "src/components/playlist-builder.tsx"
      issue: "No DragOverlay; PointerSensor has no activationConstraint"
  missing:
    - "Add DragOverlay with dropAnimation={null}, track activeId via onDragStart/onDragCancel"
    - "Add activationConstraint: { distance: 8 } to PointerSensor"

- truth: "Adding a song from the available songs section in PlaylistBuilder removes it from the available list"
  status: failed
  reason: "User reported: when i add a song from this pre-populated section, it does add it but it also stays in that pre-populated side instead of disappearing"
  severity: minor
  test: 2
  root_cause: "filteredSongs in PlaylistBuilder derives from availableSongs prop filtered only by search term — it never excludes songs already present in items state. addItem appends to items but availableSongs is an external prop that never changes."
  artifacts:
    - path: "src/components/playlist-builder.tsx"
      issue: "filteredSongs computation (line 159) does not exclude songs whose id is already in items"
  missing:
    - "Build a Set of current item song IDs from items state and filter them out of filteredSongs"

- truth: "Playlists list shows each playlist's name, song count, and last updated date labeled clearly"
  status: failed
  reason: "User reported: i see the playlist names and a date (doesnt specify its the last updated date) i do not see number of songs in the playlist from this overview page"
  severity: major
  test: 1
  root_cause: "GET /api/playlists selects only from playlists table with no join to playlistSongs — no songCount is computed or returned. PlaylistSummary interface only has {id, name, updatedAt}. Date is rendered with toLocaleDateString() and no label."
  artifacts:
    - path: "src/app/api/playlists/route.ts"
      issue: "SELECT query never joins playlistSongs — no songCount in response"
    - path: "src/app/playlists/page.tsx"
      issue: "PlaylistSummary missing songCount field; date rendered with no 'Last updated:' label"
  missing:
    - "LEFT JOIN playlistSongs grouped by playlist id to compute songCount aggregate"
    - "Add songCount to PlaylistSummary interface and render it in each row"
    - "Prefix date with 'Last updated:' label"
