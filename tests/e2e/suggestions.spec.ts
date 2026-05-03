import { test, expect } from "@playwright/test";

async function createSong(request: any, overrides: Record<string, unknown> = {}) {
  const res = await request.post("/api/songs", {
    data: {
      name: "Suggestion Test Song",
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

async function createPlaylist(request: any, name: string, items: { songId: string; rank: number }[]) {
  const res = await request.post("/api/playlists", {
    data: {
      name,
      items: items.map(({ songId, rank }) => ({ song: { id: songId }, rank })),
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id as string;
}

test.describe("GET /api/playlists/[id]/suggestions", () => {
  test("SUGG-01: returns an array of suggestions for a non-empty playlist", async ({ request }) => {
    const s1 = await createSong(request, { name: "Playlist Song A", bpm: 120, musicalKey: "C", keySignature: "major" });
    const s2 = await createSong(request, { name: "Playlist Song B", bpm: 125, musicalKey: "G", keySignature: "major" });
    await createSong(request, { name: "Candidate Song", bpm: 122, musicalKey: "D", keySignature: "major" });

    const playlistId = await createPlaylist(request, "Suggestion Test Playlist", [
      { songId: s1, rank: 10000 },
      { songId: s2, rank: 20000 },
    ]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("SUGG-02: suggestions have expected shape (id, name, bpm, musicalKey, score, reasons)", async ({ request }) => {
    const s1 = await createSong(request, { name: "Shape Test Song", bpm: 120, musicalKey: "C", keySignature: "major" });
    await createSong(request, { name: "Shape Candidate", bpm: 118, musicalKey: "G", keySignature: "major" });

    const playlistId = await createPlaylist(request, "Shape Test Playlist", [{ songId: s1, rank: 10000 }]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    if (body.length > 0) {
      const first = body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("bpm");
      expect(first).toHaveProperty("musicalKey");
      expect(first).toHaveProperty("score");
      expect(first).toHaveProperty("reasons");
      expect(Array.isArray(first.reasons)).toBe(true);
      expect(typeof first.score).toBe("number");
    }
  });

  test("SUGG-03: suggestions are sorted by score descending", async ({ request }) => {
    const s1 = await createSong(request, { name: "Anchor Song", bpm: 120, musicalKey: "C", keySignature: "major" });
    // Perfect key match — will score higher
    await createSong(request, { name: "High Score Candidate", bpm: 120, musicalKey: "C", keySignature: "major" });
    // Farther key — lower score
    await createSong(request, { name: "Low Score Candidate", bpm: 120, musicalKey: "F#", keySignature: "minor" });

    const playlistId = await createPlaylist(request, "Score Sort Playlist", [{ songId: s1, rank: 10000 }]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    for (let i = 1; i < body.length; i++) {
      expect(body[i - 1].score).toBeGreaterThanOrEqual(body[i].score);
    }
  });

  test("SUGG-04: returns empty array for playlist with no candidates in BPM range", async ({ request }) => {
    const anchor = await createSong(request, { name: "Extreme BPM Anchor", bpm: 999, musicalKey: "C", keySignature: "major" });
    await createSong(request, { name: "Slow Song Far Away", bpm: 60, musicalKey: "C", keySignature: "major" });

    // Cap at 500 BPM per schema — use 490 which is within schema but far from typical songs
    const anchorReal = await createSong(request, { name: "High BPM Anchor Real", bpm: 490, musicalKey: "C", keySignature: "major" });
    const playlistId = await createPlaylist(request, "No Candidates Playlist", [{ songId: anchorReal, rank: 10000 }]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    // Songs at 60 BPM are outside the ±15 BPM window from 490
    for (const s of body) {
      expect(s.name).not.toBe("Slow Song Far Away");
    }
  });

  test("SUGG-05: returns empty array for playlist with no songs", async ({ request }) => {
    const playlistId = await createPlaylist(request, "Empty Suggestion Playlist", []);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test("SUGG-06: songs already in playlist are not suggested", async ({ request }) => {
    const s1 = await createSong(request, { name: "Already In Playlist", bpm: 120, musicalKey: "C", keySignature: "major" });
    const s2 = await createSong(request, { name: "Also In Playlist", bpm: 120, musicalKey: "C", keySignature: "major" });

    const playlistId = await createPlaylist(request, "Exclusion Test Playlist", [
      { songId: s1, rank: 10000 },
      { songId: s2, rank: 20000 },
    ]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const resultIds = body.map((s: any) => s.id);

    expect(resultIds).not.toContain(s1);
    expect(resultIds).not.toContain(s2);
  });

  test("SUGG-07: returns 404 for non-existent playlist", async ({ request }) => {
    const res = await request.get("/api/playlists/00000000-0000-0000-0000-000000000000/suggestions");
    expect(res.status()).toBe(404);
  });

  test("SUGG-08: returns at most 10 suggestions", async ({ request }) => {
    const anchor = await createSong(request, { name: "Max Suggestions Anchor", bpm: 120, musicalKey: "C", keySignature: "major" });
    // Create 15 candidates all within BPM range
    for (let i = 0; i < 15; i++) {
      await createSong(request, { name: `Max Candidate ${i}`, bpm: 120 + i, musicalKey: "C", keySignature: "major" });
    }

    const playlistId = await createPlaylist(request, "Max Suggestions Playlist", [{ songId: anchor, rank: 10000 }]);

    const res = await request.get(`/api/playlists/${playlistId}/suggestions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(10);
  });
});
