import { describe, it, expect } from "vitest";
import {
  getCamelotPosition,
  getKeyCompatibility,
  formatCamelot,
} from "../../src/lib/camelot";

describe("getCamelotPosition", () => {
  it("returns correct position for C major (8B)", () => {
    expect(getCamelotPosition("C", "major")).toEqual({ number: 8, letter: "B" });
  });

  it("returns correct position for C minor (5A)", () => {
    expect(getCamelotPosition("C", "minor")).toEqual({ number: 5, letter: "A" });
  });

  it("returns correct position for A major (11B)", () => {
    expect(getCamelotPosition("A", "major")).toEqual({ number: 11, letter: "B" });
  });

  it("returns correct position for A minor (8A)", () => {
    expect(getCamelotPosition("A", "minor")).toEqual({ number: 8, letter: "A" });
  });

  it("treats enharmonic equivalents identically — C# and Db (3B major)", () => {
    expect(getCamelotPosition("C#", "major")).toEqual(getCamelotPosition("Db", "major"));
  });

  it("treats enharmonic equivalents identically — F# and Gb (2B major)", () => {
    expect(getCamelotPosition("F#", "major")).toEqual(getCamelotPosition("Gb", "major"));
  });

  it("treats enharmonic equivalents identically — A# and Bb (6B major)", () => {
    expect(getCamelotPosition("A#", "major")).toEqual(getCamelotPosition("Bb", "major"));
  });

  it("treats enharmonic equivalents identically — D# and Eb minor", () => {
    expect(getCamelotPosition("D#", "minor")).toEqual(getCamelotPosition("Eb", "minor"));
  });

  it("treats enharmonic equivalents identically — G# and Ab minor", () => {
    expect(getCamelotPosition("G#", "minor")).toEqual(getCamelotPosition("Ab", "minor"));
  });

  it("returns null for unknown key", () => {
    expect(getCamelotPosition("X", "major")).toBeNull();
  });

  it("returns null for unknown signature", () => {
    expect(getCamelotPosition("C", "diminished")).toBeNull();
  });

  it("covers all 17 keys without returning null", () => {
    const keys = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];
    for (const key of keys) {
      expect(getCamelotPosition(key, "major")).not.toBeNull();
      expect(getCamelotPosition(key, "minor")).not.toBeNull();
    }
  });

  it("all positions are numbers 1–12", () => {
    const keys = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];
    for (const key of keys) {
      for (const sig of ["major", "minor"]) {
        const pos = getCamelotPosition(key, sig)!;
        expect(pos.number).toBeGreaterThanOrEqual(1);
        expect(pos.number).toBeLessThanOrEqual(12);
        expect(["A", "B"]).toContain(pos.letter);
      }
    }
  });
});

describe("getKeyCompatibility", () => {
  it("score 3 — perfect match: same key returns 'Same key'", () => {
    const result = getKeyCompatibility("C", "major", "C", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(3);
      expect(result.reason).toBe("Same key");
    }
  });

  it("score 2 — relative major/minor: same Camelot number, different letter", () => {
    // C major = 8B, A minor = 8A — relative pair
    const result = getKeyCompatibility("C", "major", "A", "minor");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
      expect(result.reason).toBe("Relative major/minor");
    }
  });

  it("score 2 — adjacent key: same letter, ±1 position", () => {
    // G major = 9B, D major = 10B — adjacent
    const result = getKeyCompatibility("G", "major", "D", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
      expect(result.reason).toBe("Adjacent key");
    }
  });

  it("score 2 — adjacent key wraps from 1 to 12", () => {
    // B major = 1B, E major = 12B — wrap-around adjacent
    const result = getKeyCompatibility("B", "major", "E", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
    }
  });

  it("score 0 — incompatible keys", () => {
    // C major (8B) vs F# major (2B) — far apart
    const result = getKeyCompatibility("C", "major", "F#", "major");
    expect(result.compatible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("score 0 — unknown key returns incompatible", () => {
    const result = getKeyCompatibility("X", "major", "C", "major");
    expect(result.compatible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("is symmetric — same result regardless of argument order", () => {
    const r1 = getKeyCompatibility("G", "major", "D", "major");
    const r2 = getKeyCompatibility("D", "major", "G", "major");
    expect(r1.compatible).toBe(r2.compatible);
    expect(r1.score).toBe(r2.score);
  });

  it("enharmonic keys are compatible with each other (C# vs Db)", () => {
    const result = getKeyCompatibility("C#", "major", "Db", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) expect(result.score).toBe(3);
  });
});

describe("formatCamelot", () => {
  it("formats as number+letter string", () => {
    expect(formatCamelot({ number: 8, letter: "B" })).toBe("8B");
    expect(formatCamelot({ number: 1, letter: "A" })).toBe("1A");
    expect(formatCamelot({ number: 12, letter: "A" })).toBe("12A");
  });
});
