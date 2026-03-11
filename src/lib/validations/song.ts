import { z } from "zod";

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
  bpm: z.coerce.number({ error: "BPM must be a number" }).int().min(1).max(500),
  musicalKey: z.enum(MUSICAL_KEYS, { error: "Select a key" }),
  keySignature: z.enum(["major", "minor"] as const, {
    error: "Select major or minor",
  }),
  chordProgressions: z.string().default(""),
  lyrics: z.string().optional(),
  youtubeUrl: z
    .union([z.string().url({ error: "Invalid YouTube URL" }), z.literal("")])
    .optional(),
  spotifyUrl: z
    .union([z.string().url({ error: "Invalid Spotify URL" }), z.literal("")])
    .optional(),
  tags: z.array(z.string()).default([]),
});

// API schema: same shape but chordProgressions + tags handled at API boundary
export const songApiSchema = songSchema;

export type SongFormValues = z.infer<typeof songSchema>;
