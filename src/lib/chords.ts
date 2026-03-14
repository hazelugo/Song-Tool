import { MUSICAL_KEYS } from "@/lib/validations/song";

type MusicalKey = (typeof MUSICAL_KEYS)[number];

export const NOTE_SEMITONES: Record<MusicalKey, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Keys traditionally spelled with flats: those whose name ends in 'b', plus F (has Bb in scale)
const FLAT_KEYS = new Set<string>(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);

export function noteToFrequency(semitone: number, octave = 4): number {
  return 440 * Math.pow(2, (semitone + octave * 12 - 57) / 12);
}

type Quality = "major" | "minor" | "dim";

const MAJOR_SCALE: Array<{ interval: number; quality: Quality }> = [
  { interval: 0, quality: "major" },
  { interval: 2, quality: "minor" },
  { interval: 4, quality: "minor" },
  { interval: 5, quality: "major" },
  { interval: 7, quality: "major" },
  { interval: 9, quality: "minor" },
  { interval: 11, quality: "dim" },
];

const MINOR_SCALE: Array<{ interval: number; quality: Quality }> = [
  { interval: 0, quality: "minor" },
  { interval: 2, quality: "dim" },
  { interval: 3, quality: "major" },
  { interval: 5, quality: "minor" },
  { interval: 7, quality: "minor" },
  { interval: 8, quality: "major" },
  { interval: 10, quality: "major" },
];

const TRIAD_INTERVALS: Record<Quality, [number, number, number]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
};

const MAJOR_ROMAN_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_ROMAN_NUMERALS = ["i", "ii°", "III", "iv", "v", "VI", "VII"];

export interface ChordDef {
  label: string;
  roman: string;
  quality: Quality;
  frequencies: [number, number, number];
}

export function getDiatonicChords(key: MusicalKey, keySig: "major" | "minor"): ChordDef[] {
  const rootSemitone = NOTE_SEMITONES[key];
  const scale = keySig === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const romans = keySig === "major" ? MAJOR_ROMAN_NUMERALS : MINOR_ROMAN_NUMERALS;
  const noteNames = FLAT_KEYS.has(key) ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;

  return scale.map((degree, i) => {
    const noteSemitone = (rootSemitone + degree.interval) % 12;
    const noteName = noteNames[noteSemitone];
    const qualitySuffix =
      degree.quality === "minor" ? "m" : degree.quality === "dim" ? "°" : "";
    const label = noteName + qualitySuffix;

    // Build triad frequencies starting from octave 3
    const absoluteRoot = 3 * 12 + noteSemitone;
    const frequencies = TRIAD_INTERVALS[degree.quality].map((interval) => {
      const abs = absoluteRoot + interval;
      return noteToFrequency(abs % 12, Math.floor(abs / 12));
    }) as [number, number, number];

    return { label, roman: romans[i], quality: degree.quality, frequencies };
  });
}
