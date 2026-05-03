import { describe, it, expect } from "vitest";
import { songSchema } from "../../src/lib/validations/song";
import { filterSchema } from "../../src/lib/validations/filter";

describe("songSchema — BPM coercion", () => {
  const base = {
    name: "Test",
    musicalKey: "C" as const,
    keySignature: "major" as const,
    timeSignature: "4/4" as const,
    chordProgressions: "",
    tags: [],
  };

  it("accepts integer BPM", () => {
    const result = songSchema.safeParse({ ...base, bpm: 120 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpm).toBe(120);
  });

  it("rounds decimal BPM up (12.6 → 13)", () => {
    const result = songSchema.safeParse({ ...base, bpm: 12.6 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpm).toBe(13);
  });

  it("rounds decimal BPM down (12.4 → 12)", () => {
    const result = songSchema.safeParse({ ...base, bpm: 12.4 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpm).toBe(12);
  });

  it("coerces string BPM '120' to 120", () => {
    const result = songSchema.safeParse({ ...base, bpm: "120" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpm).toBe(120);
  });

  it("rejects BPM below 1", () => {
    const result = songSchema.safeParse({ ...base, bpm: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects BPM above 500", () => {
    const result = songSchema.safeParse({ ...base, bpm: 501 });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric BPM", () => {
    const result = songSchema.safeParse({ ...base, bpm: "fast" });
    expect(result.success).toBe(false);
  });

  it("accepts boundary values 1 and 500", () => {
    expect(songSchema.safeParse({ ...base, bpm: 1 }).success).toBe(true);
    expect(songSchema.safeParse({ ...base, bpm: 500 }).success).toBe(true);
  });
});

describe("filterSchema — BPM coercion", () => {
  it("rounds decimal bpmMin (80.7 → 81)", () => {
    const result = filterSchema.safeParse({ bpmMin: "80.7" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpmMin).toBe(81);
  });

  it("rounds decimal bpmMax (120.2 → 120)", () => {
    const result = filterSchema.safeParse({ bpmMax: "120.2" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bpmMax).toBe(120);
  });

  it("rejects bpmMin below 1", () => {
    const result = filterSchema.safeParse({ bpmMin: "0" });
    expect(result.success).toBe(false);
  });

  it("accepts valid key enum value", () => {
    const result = filterSchema.safeParse({ key: "C#" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid key enum value", () => {
    const result = filterSchema.safeParse({ key: "H" });
    expect(result.success).toBe(false);
  });

  it("accepts valid time signature", () => {
    const result = filterSchema.safeParse({ timeSig: "6/8" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time signature", () => {
    const result = filterSchema.safeParse({ timeSig: "5/5" });
    expect(result.success).toBe(false);
  });

  it("caps lyric at 500 chars", () => {
    const result = filterSchema.safeParse({ lyric: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts empty filter object", () => {
    const result = filterSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
