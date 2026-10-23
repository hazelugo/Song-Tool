/**
 * Harmonic key compatibility based on the Circle of Fifths.
 *
 * Each key maps to a Circle of Fifths position (1–12) and mode ("major" | "minor").
 * Compatible keys are:
 * - Perfect match: same key (score 3)
 * - Relative major/minor: same root pitch class, opposite mode (score 2)
 * - Adjacent keys: ±1 step on the Circle of Fifths (score 2)
 */

export type KeyPosition = { number: number; mode: "major" | "minor" };

// All 17 enharmonic keys mapped to Circle of Fifths positions (1–12)
const KEY_TO_POSITION: Record<string, Record<string, KeyPosition>> = {
  C: { major: { number: 8, mode: "major" }, minor: { number: 5, mode: "minor" } },
  "C#": { major: { number: 3, mode: "major" }, minor: { number: 12, mode: "minor" } },
  Db: { major: { number: 3, mode: "major" }, minor: { number: 12, mode: "minor" } },
  D: { major: { number: 10, mode: "major" }, minor: { number: 7, mode: "minor" } },
  "D#": { major: { number: 5, mode: "major" }, minor: { number: 2, mode: "minor" } },
  Eb: { major: { number: 5, mode: "major" }, minor: { number: 2, mode: "minor" } },
  E: { major: { number: 12, mode: "major" }, minor: { number: 9, mode: "minor" } },
  F: { major: { number: 7, mode: "major" }, minor: { number: 4, mode: "minor" } },
  "F#": { major: { number: 2, mode: "major" }, minor: { number: 11, mode: "minor" } },
  Gb: { major: { number: 2, mode: "major" }, minor: { number: 11, mode: "minor" } },
  G: { major: { number: 9, mode: "major" }, minor: { number: 6, mode: "minor" } },
  "G#": { major: { number: 4, mode: "major" }, minor: { number: 1, mode: "minor" } },
  Ab: { major: { number: 4, mode: "major" }, minor: { number: 1, mode: "minor" } },
  A: { major: { number: 11, mode: "major" }, minor: { number: 8, mode: "minor" } },
  "A#": { major: { number: 6, mode: "major" }, minor: { number: 3, mode: "minor" } },
  Bb: { major: { number: 6, mode: "major" }, minor: { number: 3, mode: "minor" } },
  B: { major: { number: 1, mode: "major" }, minor: { number: 10, mode: "minor" } },
};

export function getKeyPosition(
  musicalKey: string,
  keySignature: string,
): KeyPosition | null {
  return KEY_TO_POSITION[musicalKey]?.[keySignature] ?? null;
}

export type CompatibilityResult =
  | { compatible: true; reason: string; score: number }
  | { compatible: false; score: number };

/**
 * Returns harmonic compatibility between two keys.
 * Score: 3 = perfect match, 2 = adjacent/relative, 0 = incompatible
 */
export function getKeyCompatibility(
  key1: string,
  sig1: string,
  key2: string,
  sig2: string,
): CompatibilityResult {
  const pos1 = getKeyPosition(key1, sig1);
  const pos2 = getKeyPosition(key2, sig2);

  if (!pos1 || !pos2) return { compatible: false, score: 0 };

  // Perfect match — same key
  if (pos1.number === pos2.number && pos1.mode === pos2.mode) {
    return { compatible: true, reason: "Same key", score: 3 };
  }

  // Relative major/minor — same circle position, opposite mode (e.g., C major ↔ A minor)
  if (pos1.number === pos2.number) {
    return { compatible: true, reason: "Relative major/minor", score: 2 };
  }

  // Adjacent on circle of fifths — same mode, ±1 position (wraps 1↔12)
  if (pos1.mode === pos2.mode) {
    const diff = Math.abs(pos1.number - pos2.number);
    if (diff === 1 || diff === 11) {
      return { compatible: true, reason: "Adjacent key", score: 2 };
    }
  }

  return { compatible: false, score: 0 };
}
