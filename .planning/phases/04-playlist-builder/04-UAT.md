---
status: complete
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
  artifacts: []
  missing: [YouTube and Spotify link buttons in PlaylistEditor song rows]

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
  artifacts: []
  missing: [router.push('/playlists/[id]') using returned playlist id from POST response]

- truth: "Drag-and-drop reorder in PlaylistBuilder is smooth"
  status: failed
  reason: "User reported: the drag is a little janky it could be smoother"
  severity: minor
  test: 3
  artifacts: []
  missing: []

- truth: "Adding a song from the available songs section in PlaylistBuilder removes it from the available list"
  status: failed
  reason: "User reported: when i add a song from this pre-populated section, it does add it but it also stays in that pre-populated side instead of disappearing"
  severity: minor
  test: 2
  artifacts: []
  missing: [filter added songs out of availableSongs list in PlaylistBuilder state]

- truth: "Playlists list shows each playlist's name, song count, and last updated date labeled clearly"
  status: failed
  reason: "User reported: i see the playlist names and a date (doesnt specify its the last updated date) i do not see number of songs in the playlist from this overview page"
  severity: major
  test: 1
  artifacts: []
  missing: [song count column, labeled last-updated date]
