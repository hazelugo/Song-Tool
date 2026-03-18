WITH source_songs AS (
  SELECT
    id AS old_id,
    gen_random_uuid() AS new_id,
    name, bpm, musical_key, key_signature, time_signature,
    chord_progressions, lyrics, youtube_url, spotify_url
  FROM songs
  WHERE user_id = 'c1633228-8e06-4b89-899e-88b9df356218'
    AND deleted_at IS NULL
),
inserted_songs AS (
  INSERT INTO songs (id, user_id, name, bpm, musical_key, key_signature, time_signature, chord_progressions, lyrics, youtube_url, spotify_url, created_at, updated_at)
  SELECT new_id, '0b4d56ec-0c6e-4862-ba61-d3da97d8d5fd', name, bpm, musical_key, key_signature, time_signature, chord_progressions, lyrics, youtube_url, spotify_url, now(), now()
  FROM source_songs
  RETURNING id
)
INSERT INTO tags (id, song_id, name, created_at)
SELECT gen_random_uuid(), ss.new_id, t.name, now()
FROM tags t
JOIN source_songs ss ON t.song_id = ss.old_id;
