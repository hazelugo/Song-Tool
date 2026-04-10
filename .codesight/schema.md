# Schema

### songs

- id: uuid (pk)
- userId: uuid (default, required, fk)
- name: text (required)
- artist: text
- bpm: integer (required)
- musicalKey: musicalKeyEnum (required)
- keySignature: keySignatureEnum (required)
- timeSignature: timeSignatureEnum (default, required)
- chordProgressions: jsonb (default, required)
- lyrics: text
- youtubeUrl: text
- spotifyUrl: text
- lyricsSearch: tsvector
- _relations_: tags: many(tags)

### tags

- id: uuid (pk)
- songId: uuid (fk, required)
- name: text (required)
- _relations_: songId -> songs.id, song: one(songs)

### playlists

- id: uuid (pk)
- userId: uuid (required, fk)
- name: text (required)
- _relations_: songs: many(playlistSongs)

### playlist_songs

- playlistId: uuid (fk, required)
- songId: uuid (fk, required)
- position: real (required)
- _relations_: playlistId -> playlists.id, songId -> songs.id
