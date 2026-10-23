import { z } from "zod";

// Must match timeSignatureEnum in schema.ts exactly
export const TIME_SIGNATURES = [
  "4/4",
  "3/4",
  "2/4",
  "2/2",
  "6/8",
  "9/8",
  "12/8",
  "5/4",
  "7/8",
  "7/4",
  "3/8",
  "6/4",
] as const;

// Must match musicalKeyEnum in schema.ts exactly (17 values)
export const MUSICAL_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const;

// Form schema: chordProgressions is raw textarea string; tags managed separately
export const songSchema = z.object({
  name: z.string().min(1, "Song name is required").max(255),
  artist: z.string().max(255).optional(),
  bpm: z.coerce.number().transform(Math.round).pipe(z.number().min(1).max(500)),
  musicalKey: z.enum(MUSICAL_KEYS, {
    message: "Select a key",
  }),
  keySignature: z.enum(["major", "minor"] as const, {
    message: "Select major or minor",
  }),
  timeSignature: z.enum(TIME_SIGNATURES, {
    message: "Select a time signature",
  }),
  chordProgressions: z.string().default(""),
  lyrics: z.string().optional(),
  youtubeUrl: z
    .union([z.string().url({ message: "Invalid YouTube URL" }), z.literal("")])
    .optional(),
  spotifyUrl: z
    .union([z.string().url({ message: "Invalid Spotify URL" }), z.literal("")])
    .optional(),
  tags: z.array(z.string()).default([]),
});

// API schema: same shape but chordProgressions + tags handled at API boundary
export const songApiSchema = songSchema;

export type SongFormValues = z.infer<typeof songSchema>;
export type SongFormInput = z.input<typeof songSchema>;

/**
 * Parses raw text input into stored chord progression strings.
 * Preserves newlines so each line of chords/sections is kept distinct.
 * If input is a single line, splits by commas as before for backwards compatibility.
 */
export function parseChordProgressions(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  if (raw.includes("\n")) {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return raw
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Formats stored chord progressions back into textarea text for editing.
 * Multi-line progressions are joined with newlines; single-chord arrays join with commas.
 */
export function formatChordProgressions(chordProgressions: unknown): string {
  if (!Array.isArray(chordProgressions) || chordProgressions.length === 0) {
    return "";
  }
  const items = chordProgressions.filter((c): c is string => typeof c === "string");
  if (items.length === 0) return "";

  const hasLineStructure = items.some(
    (item) => item.includes(",") || item.includes(" ") || item.includes(":") || item.includes("\n")
  );

  if (hasLineStructure) {
    return items.join("\n");
  }

  return items.join(", ");
}
