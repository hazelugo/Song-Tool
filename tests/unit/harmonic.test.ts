import { describe, it, expect } from "vitest";
import {
  getKeyPosition,
  getKeyCompatibility,
} from "../../src/lib/harmonic";

describe("getKeyPosition", () => {
  it("returns correct position for C major", () => {
    expect(getKeyPosition("C", "major")).toEqual({ number: 8, mode: "major" });
  });

  it("returns correct position for C minor", () => {
    expect(getKeyPosition("C", "minor")).toEqual({ number: 5, mode: "minor" });
  });

  it("returns correct position for A major", () => {
    expect(getKeyPosition("A", "major")).toEqual({ number: 11, mode: "major" });
  });

  it("returns correct position for A minor", () => {
    expect(getKeyPosition("A", "minor")).toEqual({ number: 8, mode: "minor" });
  });

  it("treats enharmonic equivalents identically — C# and Db major", () => {
    expect(getKeyPosition("C#", "major")).toEqual(getKeyPosition("Db", "major"));
  });

  it("treats enharmonic equivalents identically — F# and Gb major", () => {
    expect(getKeyPosition("F#", "major")).toEqual(getKeyPosition("Gb", "major"));
  });

  it("treats enharmonic equivalents identically — A# and Bb major", () => {
    expect(getKeyPosition("A#", "major")).toEqual(getKeyPosition("Bb", "major"));
  });

  it("treats enharmonic equivalents identically — D# and Eb minor", () => {
    expect(getKeyPosition("D#", "minor")).toEqual(getKeyPosition("Eb", "minor"));
  });

  it("treats enharmonic equivalents identically — G# and Ab minor", () => {
    expect(getKeyPosition("G#", "minor")).toEqual(getKeyPosition("Ab", "minor"));
  });

  it("returns null for unknown key", () => {
    expect(getKeyPosition("X", "major")).toBeNull();
  });

  it("returns null for unknown signature", () => {
    expect(getKeyPosition("C", "diminished")).toBeNull();
  });

  it("covers all 17 keys without returning null", () => {
    const keys = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];
    for (const key of keys) {
      expect(getKeyPosition(key, "major")).not.toBeNull();
      expect(getKeyPosition(key, "minor")).not.toBeNull();
    }
  });

  it("all positions are numbers 1–12", () => {
    const keys = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];
    for (const key of keys) {
      for (const sig of ["major", "minor"]) {
        const pos = getKeyPosition(key, sig)!;
        expect(pos.number).toBeGreaterThanOrEqual(1);
        expect(pos.number).toBeLessThanOrEqual(12);
        expect(["major", "minor"]).toContain(pos.mode);
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

  it("score 2 — relative major/minor: same circle position, opposite mode", () => {
    // C major = position 8, A minor = position 8 — relative pair
    const result = getKeyCompatibility("C", "major", "A", "minor");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
      expect(result.reason).toBe("Relative major/minor");
    }
  });

  it("score 2 — adjacent key: same mode, ±1 position", () => {
    // G major = 9, D major = 10 — adjacent
    const result = getKeyCompatibility("G", "major", "D", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
      expect(result.reason).toBe("Adjacent key");
    }
  });

  it("score 2 — adjacent key across the 12↔1 boundary (wraps)", () => {
    // B major = 1, E major = 12 — adjacent
    const result = getKeyCompatibility("B", "major", "E", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(2);
      expect(result.reason).toBe("Adjacent key");
    }
  });

  it("score 0 — incompatible keys: C major and F# major", () => {
    // C major = 8, F# major = 2 — 6 steps away (tritone)
    const result = getKeyCompatibility("C", "major", "F#", "major");
    expect(result.compatible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("score 0 — unknown key input returns incompatible", () => {
    const result = getKeyCompatibility("X", "major", "C", "major");
    expect(result.compatible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("compatibility is symmetric — order of arguments does not matter", () => {
    const r1 = getKeyCompatibility("G", "major", "D", "major");
    const r2 = getKeyCompatibility("D", "major", "G", "major");
    expect(r1).toEqual(r2);
  });

  it("enharmonic keys produce identical compatibility results", () => {
    // C# major and Db major are enharmonically equivalent
    const result = getKeyCompatibility("C#", "major", "Db", "major");
    expect(result.compatible).toBe(true);
    if (result.compatible) {
      expect(result.score).toBe(3);
    }
  });
});
