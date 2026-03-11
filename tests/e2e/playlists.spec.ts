import { test, expect } from "@playwright/test";

// Helper to create a song and return its ID
async function createSong(request: any, name: string) {
  const res = await request.post("/api/songs", {
    data: {
      name,
      bpm: 120,
      musicalKey: "C",
      keySignature: "major",
      chordProgressions: "",
      tags: [],
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id;
}

test.describe("Playlists — CRUD", () => {
  test("PLAY-01: create playlist with name; appears in list", async ({
    request,
  }) => {
    const res = await request.post("/api/playlists", {
      data: { name: "My Setlist" },
    });
    expect(res.ok()).toBeTruthy();
    const playlist = await res.json();
    expect(playlist.name).toBe("My Setlist");

    // Verify it appears in the list
    const listRes = await request.get("/api/playlists");
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(list.some((p: any) => p.id === playlist.id)).toBeTruthy();
  });

  test("PLAY-02: create playlist with initial songs", async ({ request }) => {
    const songId1 = await createSong(request, "Song A");
    const songId2 = await createSong(request, "Song B");

    const res = await request.post("/api/playlists", {
      data: {
        name: "Setlist with Songs",
        songs: [songId1, songId2],
      },
    });
    expect(res.ok()).toBeTruthy();
    const playlist = await res.json();

    // Verify songs are attached via GET /id
    const detailRes = await request.get(`/api/playlists/${playlist.id}`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();
    expect(detail.songs).toHaveLength(2);
    expect(detail.songs[0].song.name).toBe("Song A");
    expect(detail.songs[1].song.name).toBe("Song B");
  });

  test("PLAY-03: view playlist details (songs ordered by position)", async ({
    request,
  }) => {
    // This test relies on the API's default insertion order (10000, 20000)
    // Reordering tests will come in a later phase with UI drag-and-drop
    const songId1 = await createSong(request, "First Song");
    const songId2 = await createSong(request, "Second Song");

    const res = await request.post("/api/playlists", {
      data: {
        name: "Ordered List",
        songs: [songId1, songId2],
      },
    });
    const playlist = await res.json();

    const detailRes = await request.get(`/api/playlists/${playlist.id}`);
    const detail = await detailRes.json();

    expect(detail.songs[0].position).toBeLessThan(detail.songs[1].position);
  });

  test("PLAY-04: delete playlist", async ({ request }) => {
    const res = await request.post("/api/playlists", {
      data: { name: "To Be Deleted" },
    });
    const playlist = await res.json();

    const delRes = await request.delete(`/api/playlists/${playlist.id}`);
    expect(delRes.ok()).toBeTruthy();

    const getRes = await request.get(`/api/playlists/${playlist.id}`);
    expect(getRes.status()).toBe(404);
  });
});
