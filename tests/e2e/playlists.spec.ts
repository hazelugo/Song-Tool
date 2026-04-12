import { test, expect } from "@playwright/test";

// Helper to create a song and return its ID
async function createSong(request: any, name: string) {
  const res = await request.post("/api/songs", {
    data: {
      name,
      bpm: 120,
      musicalKey: "C",
      keySignature: "major",
      timeSignature: "4/4",
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

// Simulate a dnd-kit drag with activationConstraint.distance=8
async function dragToReorder(
  page: any,
  sourceLocator: any,
  targetLocator: any,
) {
  const sourceBox = await sourceLocator.boundingBox();
  const targetBox = await targetLocator.boundingBox();

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Move past activationConstraint.distance=8 to start the drag
  await page.mouse.move(startX, startY + 12, { steps: 5 });
  // Drag to target
  await page.mouse.move(endX, endY, { steps: 20 });
  await page.mouse.up();
}

test.describe("Playlists — songCount field", () => {
  test("GET /api/playlists returns songCount=0 for a newly created empty playlist", async ({
    request,
  }) => {
    const res = await request.post("/api/playlists", {
      data: { name: "Empty Playlist For SongCount Test", items: [] },
    });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();

    const listRes = await request.get("/api/playlists");
    expect(listRes.ok()).toBeTruthy();
    const body = await listRes.json();
    // Response shape: { data: [...], total, page, limit }
    const list: any[] = body.data;
    const found = list.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(typeof found.songCount).toBe("number");
    expect(found.songCount).toBe(0);
  });

  test("GET /api/playlists returns songCount equal to number of songs in playlist", async ({
    request,
  }) => {
    const songId1 = await createSong(request, "SongCount Track 1");
    const songId2 = await createSong(request, "SongCount Track 2");

    const res = await request.post("/api/playlists", {
      data: {
        name: "SongCount Playlist",
        items: [
          { song: { id: songId1 }, rank: 10000 },
          { song: { id: songId2 }, rank: 20000 },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();

    const listRes = await request.get("/api/playlists");
    expect(listRes.ok()).toBeTruthy();
    const body = await listRes.json();
    const list: any[] = body.data;
    const found = list.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(found.songCount).toBe(2);
  });
});

test.describe("Playlists — song fields in detail endpoint", () => {
  test("GET /api/playlists/{id} returns artist, timeSignature, youtubeUrl, spotifyUrl on each song object", async ({
    request,
  }) => {
    // Create a song with all the extra fields
    const songRes = await request.post("/api/songs", {
      data: {
        name: "Song With All Fields",
        artist: "Test Artist",
        bpm: 120,
        musicalKey: "C",
        keySignature: "major",
        timeSignature: "3/4",
        chordProgressions: "",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        spotifyUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
        tags: [],
      },
    });
    expect(songRes.ok()).toBeTruthy();
    const song = await songRes.json();

    const playlistRes = await request.post("/api/playlists", {
      data: {
        name: "Song Fields Test Playlist",
        items: [{ song: { id: song.id }, rank: 10000 }],
      },
    });
    expect(playlistRes.ok()).toBeTruthy();
    const playlist = await playlistRes.json();

    const detailRes = await request.get(`/api/playlists/${playlist.id}`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();

    expect(detail.songs).toHaveLength(1);
    const songEntry = detail.songs[0].song;
    expect(songEntry.artist).toBe("Test Artist");
    expect(songEntry.timeSignature).toBe("3/4");
    expect(songEntry.youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(songEntry.spotifyUrl).toBe(
      "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    );
  });
});

test.describe("Playlists — Reorder", () => {
  test("PLAY-05: drag first song to last position; order updates in UI and persists", async ({
    page,
    request,
  }) => {
    const songId1 = await createSong(request, "First Track");
    const songId2 = await createSong(request, "Middle Track");
    const songId3 = await createSong(request, "Last Track");

    const res = await request.post("/api/playlists", {
      data: {
        name: "Reorder Test Playlist",
        items: [
          { song: { id: songId1 }, rank: 10000 },
          { song: { id: songId2 }, rank: 20000 },
          { song: { id: songId3 }, rank: 30000 },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const playlist = await res.json();

    await page.goto(`/playlists/${playlist.id}`);

    // Verify initial order
    const rows = page.locator(".font-medium.truncate");
    await expect(rows.nth(0)).toHaveText("First Track");
    await expect(rows.nth(1)).toHaveText("Middle Track");
    await expect(rows.nth(2)).toHaveText("Last Track");

    // Drag first grip handle to below the third row
    const gripHandles = page.locator(".cursor-grab");
    await dragToReorder(page, gripHandles.nth(0), gripHandles.nth(2));

    // First Track should now be after the others
    await expect(rows.nth(2)).toHaveText("First Track");

    // Reload — verify order persisted via API
    await page.reload();
    await expect(rows.nth(2)).toHaveText("First Track");
  });

  test("PLAY-06: remove a song from playlist; song disappears from list", async ({
    page,
    request,
  }) => {
    const songId1 = await createSong(request, "Keep This Track");
    const songId2 = await createSong(request, "Remove This Track");

    const res = await request.post("/api/playlists", {
      data: {
        name: "Remove Test Playlist",
        items: [
          { song: { id: songId1 }, rank: 10000 },
          { song: { id: songId2 }, rank: 20000 },
        ],
      },
    });
    const playlist = await res.json();

    await page.goto(`/playlists/${playlist.id}`);

    await expect(page.getByText("Remove This Track")).toBeVisible();

    // Hover the second row to reveal the remove button, then click it
    const secondRow = page.locator(".group").filter({ hasText: "Remove This Track" }).first();
    await secondRow.hover();
    await secondRow.locator("button").last().click();

    await expect(page.getByText("Remove This Track")).not.toBeVisible();
    await expect(page.getByText("Keep This Track")).toBeVisible();
  });
});
