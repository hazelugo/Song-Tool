/**
 * Camelot Wheel — harmonic key compatibility for DJs / producers.
 *
 * Each key maps to a Camelot position: a number (1–12) and letter (A=minor, B=major).
 * Compatible keys are: same position, ±1 position (same letter), same number (A↔B).
 */

export type CamelotPosition = { number: number; letter: "A" | "B" };

// All 17 enharmonic keys mapped to Camelot positions
const KEY_TO_CAMELOT: Record<string, Record<string, CamelotPosition>> = {
  C: { major: { number: 8, letter: "B" }, minor: { number: 5, letter: "A" } },
  "C#": { major: { number: 3, letter: "B" }, minor: { number: 12, letter: "A" } },
  Db: { major: { number: 3, letter: "B" }, minor: { number: 12, letter: "A" } },
  D: { major: { number: 10, letter: "B" }, minor: { number: 7, letter: "A" } },
  "D#": { major: { number: 5, letter: "B" }, minor: { number: 2, letter: "A" } },
  Eb: { major: { number: 5, letter: "B" }, minor: { number: 2, letter: "A" } },
  E: { major: { number: 12, letter: "B" }, minor: { number: 9, letter: "A" } },
  F: { major: { number: 7, letter: "B" }, minor: { number: 4, letter: "A" } },
  "F#": { major: { number: 2, letter: "B" }, minor: { number: 11, letter: "A" } },
  Gb: { major: { number: 2, letter: "B" }, minor: { number: 11, letter: "A" } },
  G: { major: { number: 9, letter: "B" }, minor: { number: 6, letter: "A" } },
  "G#": { major: { number: 4, letter: "B" }, minor: { number: 1, letter: "A" } },
  Ab: { major: { number: 4, letter: "B" }, minor: { number: 1, letter: "A" } },
  A: { major: { number: 11, letter: "B" }, minor: { number: 8, letter: "A" } },
  "A#": { major: { number: 6, letter: "B" }, minor: { number: 3, letter: "A" } },
  Bb: { major: { number: 6, letter: "B" }, minor: { number: 3, letter: "A" } },
  B: { major: { number: 1, letter: "B" }, minor: { number: 10, letter: "A" } },
};

export function getCamelotPosition(
  musicalKey: string,
  keySignature: string,
): CamelotPosition | null {
  return KEY_TO_CAMELOT[musicalKey]?.[keySignature] ?? null;
}

export type CompatibilityResult =
  | { compatible: true; reason: string; score: number }
  | { compatible: false; score: number };

/**
 * Returns compatibility between two keys.
 * Score: 3 = perfect match, 2 = adjacent/relative, 1 = BPM-only compatible, 0 = incompatible
 */
export function getKeyCompatibility(
  key1: string,
  sig1: string,
  key2: string,
  sig2: string,
): CompatibilityResult {
  const pos1 = getCamelotPosition(key1, sig1);
  const pos2 = getCamelotPosition(key2, sig2);

  if (!pos1 || !pos2) return { compatible: false, score: 0 };

  // Perfect match — same Camelot position
  if (pos1.number === pos2.number && pos1.letter === pos2.letter) {
    return { compatible: true, reason: "Same key", score: 3 };
  }

  // Relative major/minor — same number, different letter (e.g., 8A ↔ 8B)
  if (pos1.number === pos2.number) {
    return { compatible: true, reason: "Relative major/minor", score: 2 };
  }

  // Adjacent on wheel — same letter, ±1 position (wraps 1↔12)
  if (pos1.letter === pos2.letter) {
    const diff = Math.abs(pos1.number - pos2.number);
    if (diff === 1 || diff === 11) {
      return { compatible: true, reason: "Adjacent key", score: 2 };
    }
  }

  return { compatible: false, score: 0 };
}

/** Format Camelot position as string, e.g. "8B" */
export function formatCamelot(pos: CamelotPosition): string {
  return `${pos.number}${pos.letter}`;
}
