---
phase: 02-song-catalog
plan: "02"
subsystem: ui
tags: [react-hook-form, zod, shadcn, components]

# Dependency graph
requires: [02-01]
provides:
  - TagInput: controlled chip/pill input (Enter key creates pill with × remove; normalizes to lowercase)
  - SongForm: react-hook-form + Zod form with all required and optional song fields
  - DeleteConfirm: inline "Are you sure?" confirmation before DELETE API call
  - SongSheet: slide-out sheet wrapping SongForm + DeleteConfirm; handles add/edit mode
affects: [02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - react-hook-form Controller pattern for custom TagInput integration
    - Sheet component (shadcn) as slide-out container for add/edit form
    - Lyrics field behind "Add lyrics" toggle — collapsed by default
    - Tag normalization: toLowerCase + trim + deduplicate on submit

key-files:
  created:
    - src/components/songs/tag-input.tsx
    - src/components/songs/song-form.tsx
    - src/components/songs/delete-confirm.tsx
    - src/components/songs/song-sheet.tsx

key-decisions:
  - "TagInput uses Enter key (not comma) to create pills — prevents conflict with chord progressions CSV input"
  - "Lyrics textarea collapsed behind toggle by default — keeps form compact since lyrics can be very long"
  - "SongSheet is a single component for both Add and Edit — empty on add, pre-filled on edit"
  - "Delete confirmation is inline (not a separate dialog) — simpler, still prevents accidental deletion"

requirements-completed: [SONG-01, SONG-02, SONG-03, SONG-04, SONG-05]

# Metrics
duration: ~40min
completed: 2026-03-10
---

# Phase 2 Plan 02: Song Form Components

**TagInput chip component, SongForm (react-hook-form + Zod), DeleteConfirm inline confirmation, and SongSheet slide-out wrapping all form UI**

## Accomplishments

- Built `TagInput` — controlled chip/pill input where Enter creates a colored Badge pill with × remove; normalizes tags to lowercase + trimmed + deduplicated before form submission
- Built `SongForm` — react-hook-form form with all fields: name, BPM, musical key dropdown, key signature dropdown, chord progressions textarea, optional lyrics (behind toggle), YouTube URL, Spotify URL, tags (TagInput)
- Built `DeleteConfirm` — inline "Are you sure?" reveal with confirm/cancel buttons; calls DELETE API on confirm
- Built `SongSheet` — shadcn Sheet slide-out that renders empty form for Add mode or pre-filled form for Edit mode; handles POST (add) or PUT (edit) on save; closes on success

## Files Created

- `src/components/songs/tag-input.tsx` — Controlled TagInput component
- `src/components/songs/song-form.tsx` — Full form with react-hook-form + Zod + all fields
- `src/components/songs/delete-confirm.tsx` — Inline delete confirmation
- `src/components/songs/song-sheet.tsx` — Unified add/edit sheet wrapper

## Decisions Made

- **TagInput uses Enter (not comma)**: Comma is used as chord progression separator — avoid UX confusion
- **Lyrics toggle**: `<details>` or state toggle keeps the form compact for songs without lyrics
- **Delete at bottom of sheet**: Placed at bottom of SongSheet to be accessible but not prominent

## Self-Check: PASSED

- FOUND: src/components/songs/tag-input.tsx exports TagInput
- FOUND: src/components/songs/song-form.tsx exports SongForm
- FOUND: src/components/songs/delete-confirm.tsx exports DeleteConfirm
- FOUND: src/components/songs/song-sheet.tsx exports SongSheet
- VERIFIED: Sheet opens empty on Add, pre-filled on Edit
- VERIFIED: Tags normalize to lowercase on submit

---
*Phase: 02-song-catalog*
*Completed: 2026-03-10*
