import { test, expect } from "@playwright/test";

async function createSong(request: any, overrides: Record<string, unknown> = {}) {
  const res = await request.post("/api/songs", {
    data: {
      name: "Similar Test Song",
      bpm: 120,
      musicalKey: "C",
      keySignature: "major",
      chordProgressions: "",
      tags: [],
      ...overrides,
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id as string;
}

test.describe("GET /api/similar", () => {
  test("SIM-01: returns seed song and top 3 similar songs", async ({ request }) => {
    const seedId = await createSong(request, { name: "Seed Song", bpm: 120, musicalKey: "C", keySignature: "major" });
    await createSong(request, { name: "Close Match", bpm: 118, musicalKey: "G", keySignature: "major" }); // adjacent key, similar BPM
    await createSong(request, { name: "Far Match", bpm: 200, musicalKey: "F#", keySignature: "minor" });

    const res = await request.get(`/api/similar?songId=${seedId}`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty("seed");
    expect(body).toHaveProperty("results");
    expect(body.seed.id).toBe(seedId);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeLessThanOrEqual(3);
  });

  test("SIM-02: excludes songs listed in the exclude param", async ({ request }) => {
    const seedId = await createSong(request, { name: "Seed For Exclude", bpm: 120, musicalKey: "C", keySignature: "major" });
    const excludeId = await createSong(request, { name: "Should Be Excluded", bpm: 120, musicalKey: "G", keySignature: "major" });

    const res = await request.get(`/api/similar?songId=${seedId}&exclude=${excludeId}`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const resultIds = body.results.map((s: any) => s.id);
    expect(resultIds).not.toContain(excludeId);
  });

  test("SIM-03: returns 400 when songId is missing", async ({ request }) => {
    const res = await request.get("/api/similar");
    expect(res.status()).toBe(400);
  });

  test("SIM-04: returns 404 when songId does not exist", async ({ request }) => {
    const res = await request.get("/api/similar?songId=00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
  });

  test("SIM-05: similar songs share language tag with seed when seed has one", async ({ request }) => {
    const seedId = await createSong(request, {
      name: "Spanish Seed",
      bpm: 120,
      musicalKey: "C",
      keySignature: "major",
      tags: ["spanish"],
    });
    await createSong(request, {
      name: "Spanish Match",
      bpm: 118,
      musicalKey: "G",
      keySignature: "major",
      tags: ["spanish"],
    });
    await createSong(request, {
      name: "English Song",
      bpm: 118,
      musicalKey: "G",
      keySignature: "major",
      tags: ["english"],
    });

    const res = await request.get(`/api/similar?songId=${seedId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    for (const song of body.results) {
      const tagNames = song.tags.map((t: any) => t.name.toLowerCase());
      expect(tagNames).not.toContain("english");
    }
  });

  test("SIM-06: seed song is excluded from results", async ({ request }) => {
    const seedId = await createSong(request, { name: "Seed Not In Results", bpm: 120, musicalKey: "C", keySignature: "major" });

    const res = await request.get(`/api/similar?songId=${seedId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const resultIds = body.results.map((s: any) => s.id);
    expect(resultIds).not.toContain(seedId);
  });
});
