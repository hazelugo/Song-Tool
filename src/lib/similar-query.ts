import type { SongWithTags } from "@/db/schema";

/** Builds a natural-language query string from a song's key musical properties.
 *  e.g. "G minor 128 BPM" — matches what parsePrompt in /api/discovery can interpret. */
export function buildSimilarQuery(song: SongWithTags): string {
  return `${song.musicalKey} ${song.keySignature} ${song.bpm} BPM`;
}
