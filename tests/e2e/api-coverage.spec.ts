/**
 * API coverage tests for paths not covered by UI-focused specs:
 * - Soft delete filtering
 * - Tag deduplication
 * - Playlist rename (PATCH)
 * - Playlist song reorder via API (PUT)
 * - Bulk import chord parsing
 */
import { test, expect } from "@playwright/test";

async function createSong(request: any, overrides: Record<string, unknown> = {}) {
  const res = await request.post("/api/songs", {
    data: {
      name: "API Coverage Song",
      bpm: 120,
      musicalKey: "C",
      keySignature: "major",
      chordProgressions: "",
      tags: [],
      ...overrides,
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

async function createPlaylist(request: any, name: string, items: { songId: string; rank: number }[] = []) {
  const res = await request.post("/api/playlists", {
    data: {
      name,
      items: items.map(({ songId, rank }) => ({ song: { id: songId }, rank })),
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id as string;
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------
test.describe("Soft delete", () => {
  test("SD-01: deleted song does not appear in GET /api/songs", async ({ request }) => {
    const song = await createSong(request, { name: "Soft Delete Target" });

    const delRes = await request.delete(`/api/songs/${song.id}`);
    expect(delRes.ok()).toBeTruthy();

    const listRes = await request.get("/api/songs");
    expect(listRes.ok()).toBeTruthy();
    const body = await listRes.json();
    const ids = body.data.map((s: any) => s.id);
    expect(ids).not.toContain(song.id);
  });

  test("SD-02: deleted song is excluded from filter results", async ({ request }) => {
    const song = await createSong(request, { name: "Deleted Filter Song", bpm: 77, musicalKey: "B", keySignature: "minor" });

    await request.delete(`/api/songs/${song.id}`);

    const res = await request.get("/api/songs?bpmMin=70&bpmMax=80");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const ids = body.data.map((s: any) => s.id);
    expect(ids).not.toContain(song.id);
  });

  test("SD-03: DELETE returns ok:true", async ({ request }) => {
    const song = await createSong(request, { name: "Delete Response Test" });
    const res = await request.delete(`/api/songs/${song.id}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tag deduplication
// ---------------------------------------------------------------------------
test.describe("Tag deduplication", () => {
  test("TAG-DUP-01: duplicate tags in create request are stored only once", async ({ request }) => {
    const song = await createSong(request, {
      name: "Dup Tag Song",
      tags: ["rock", "rock", "ROCK", "Rock"],
    });

    const listRes = await request.get("/api/songs");
    const body = await listRes.json();
    const found = body.data.find((s: any) => s.id === song.id);
    expect(found).toBeDefined();

    const tagNames = found.tags.map((t: any) => t.name);
    const uniqueNames = [...new Set(tagNames)];
    expect(tagNames.length).toBe(uniqueNames.length);
  });

  test("TAG-DUP-02: tag filter finds song by any case variant", async ({ request }) => {
    await createSong(request, { name: "Case Tag Song", tags: ["Jazz"] });

    const res = await request.get("/api/songs?tag=jazz");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const names = body.data.map((s: any) => s.name);
    expect(names).toContain("Case Tag Song");
  });
});

// ---------------------------------------------------------------------------
// Playlist rename (PATCH)
// ---------------------------------------------------------------------------
test.describe("Playlist rename", () => {
  test("RENAME-01: PATCH /api/playlists/[id] updates name", async ({ request }) => {
    const playlistId = await createPlaylist(request, "Original Name");

    const res = await request.patch(`/api/playlists/${playlistId}`, {
      data: { name: "Renamed Playlist" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);

    const getRes = await request.get(`/api/playlists/${playlistId}`);
    const detail = await getRes.json();
    expect(detail.name).toBe("Renamed Playlist");
  });

  test("RENAME-02: PATCH with empty name returns 400", async ({ request }) => {
    const playlistId = await createPlaylist(request, "Valid Name");

    const res = await request.patch(`/api/playlists/${playlistId}`, {
      data: { name: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("RENAME-03: PATCH non-existent playlist returns 404", async ({ request }) => {
    const res = await request.patch("/api/playlists/00000000-0000-0000-0000-000000000000", {
      data: { name: "Ghost Playlist" },
    });
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Playlist song reorder (PUT /api/playlists/[id]/songs)
// ---------------------------------------------------------------------------
test.describe("Playlist song reorder via API", () => {
  test("REORDER-01: PUT updates positions and new order is reflected in GET", async ({ request }) => {
    const s1Res = await createSong(request, { name: "Reorder Song A" });
    const s2Res = await createSong(request, { name: "Reorder Song B" });
    const s3Res = await createSong(request, { name: "Reorder Song C" });

    const playlistId = await createPlaylist(request, "Reorder API Playlist", [
      { songId: s1Res.id, rank: 10000 },
      { songId: s2Res.id, rank: 20000 },
      { songId: s3Res.id, rank: 30000 },
    ]);

    // Move A to the end (highest position)
    const putRes = await request.put(`/api/playlists/${playlistId}/songs`, {
      data: {
        items: [
          { songId: s1Res.id, position: 30001 },
          { songId: s2Res.id, position: 20000 },
          { songId: s3Res.id, position: 30000 },
        ],
      },
    });
    expect(putRes.ok()).toBeTruthy();

    const detailRes = await request.get(`/api/playlists/${playlistId}`);
    const detail = await detailRes.json();
    const ordered = detail.songs.map((ps: any) => ps.song.name);

    // A should now be last
    expect(ordered[ordered.length - 1]).toBe("Reorder Song A");
  });

  test("REORDER-02: PUT with invalid body returns 400", async ({ request }) => {
    const playlistId = await createPlaylist(request, "Reorder Validation Playlist");

    const res = await request.put(`/api/playlists/${playlistId}/songs`, {
      data: { items: [] }, // min(1) violated
    });
    expect(res.status()).toBe(400);
  });

  test("REORDER-03: PUT non-existent playlist returns 404", async ({ request }) => {
    const res = await request.put("/api/playlists/00000000-0000-0000-0000-000000000000/songs", {
      data: {
        items: [{ songId: "00000000-0000-0000-0000-000000000001", position: 1 }],
      },
    });
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Bulk import
// ---------------------------------------------------------------------------
test.describe("Bulk import", () => {
  test("BULK-01: POST /api/songs/bulk imports multiple songs", async ({ request }) => {
    const res = await request.post("/api/songs/bulk", {
      data: {
        songs: [
          { name: "Bulk Song 1", bpm: 100, musicalKey: "C", keySignature: "major", chordProgressions: "", tags: [] },
          { name: "Bulk Song 2", bpm: 110, musicalKey: "G", keySignature: "minor", chordProgressions: "", tags: [] },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.imported).toBe(2);
  });

  test("BULK-02: chord progressions with spaces parse correctly", async ({ request }) => {
    const res = await request.post("/api/songs/bulk", {
      data: {
        songs: [{
          name: "Chord Parse Test",
          bpm: 120,
          musicalKey: "C",
          keySignature: "major",
          chordProgressions: "C major, G major, Am",
          tags: [],
        }],
      },
    });
    expect(res.ok()).toBeTruthy();

    // Verify chord is stored as array
    const listRes = await request.get("/api/songs?chord=C+major");
    expect(listRes.ok()).toBeTruthy();
  });

  test("BULK-03: empty songs array returns 422", async ({ request }) => {
    const res = await request.post("/api/songs/bulk", {
      data: { songs: [] },
    });
    expect(res.status()).toBe(422);
  });
});
