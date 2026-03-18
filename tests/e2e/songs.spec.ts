import { test, expect } from "@playwright/test";

test.describe("Songs — CRUD", () => {
  test("SONG-01: add song with required fields; appears in the list", async ({
    page,
  }) => {
    await page.goto("/songs");
    await page.getByRole("button", { name: "Add Song" }).click();

    // Sheet opens
    await expect(page.getByRole("heading", { name: "Add Song" })).toBeVisible();

    // Fill required fields
    await page.getByLabel("Song name *").fill("Wonderwall");
    await page.getByLabel("BPM *").fill("87");

    // Musical key dropdown
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "G", exact: true }).click();

    // Key signature dropdown
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Major" }).click();

    // Chord progressions
    await page.getByLabel("Chord Progressions").fill("Em, G, D, A");

    // Save
    await page.getByRole("button", { name: "Save Song" }).click();

    // Sheet closes and song appears in table
    await expect(
      page.getByRole("heading", { name: "Add Song" }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: "Wonderwall" })).toBeVisible();
  });

  test("SONG-02: add song with optional fields (YouTube URL, Spotify URL, lyrics)", async ({
    page,
  }) => {
    await page.goto("/songs");
    await page.getByRole("button", { name: "Add Song" }).click();

    await page.getByLabel("Song name *").fill("Bohemian Rhapsody");
    await page.getByLabel("BPM *").fill("72");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Bb" }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Major" }).click();

    // Optional fields
    await page
      .getByLabel("YouTube URL")
      .fill("https://youtube.com/watch?v=fJ9rUzIMcZQ");
    await page
      .getByLabel("Spotify URL")
      .fill("https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb");

    // Expand lyrics toggleasync async async
    await page.getByRole("button", { name: "+ Add lyrics" }).click();
    await page.getByLabel("Lyrics").fill("Is this the real life?");

    await page.getByRole("button", { name: "Save Song" }).click();

    // Song appears in table
    await expect(
      page.getByRole("cell", { name: "Bohemian Rhapsody" }),
    ).toBeVisible();
  });

  test("SONG-03: add tags; tags appear as pills in the table", async ({
    page,
  }) => {
    await page.goto("/songs");
    await page.getByRole("button", { name: "Add Song" }).click();

    await page.getByLabel("Song name *").fill("Mr. Jones");
    await page.getByLabel("BPM *").fill("124");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "C", exact: true }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Major" }).click();

    // Add tags via chip input (Enter key)
    const tagInput = page.getByLabel("Tags");
    await tagInput.fill("opener");
    await tagInput.press("Enter");
    await expect(page.getByText("opener").first()).toBeVisible();
    await expect(tagInput).toHaveValue("");
    await tagInput.fill("crowd-pleaser");
    await tagInput.press("Enter");

    // Verify pills appeared in the form
    await expect(page.getByText("opener").first()).toBeVisible();
    await expect(page.getByText("crowd-pleaser").first()).toBeVisible();

    await page.getByRole("button", { name: "Save Song" }).click();

    // Tags visible as pills in the table row
    const row = page.getByRole("row").filter({ hasText: "Mr. Jones" });
    await expect(row.getByText("opener")).toBeVisible();
    await expect(row.getByText("crowd-pleaser")).toBeVisible();
  });

  test("SONG-04: edit a song field; updated values appear in the list", async ({
    page,
  }) => {
    // First add a song
    await page.goto("/songs");
    await page.getByRole("button", { name: "Add Song" }).click();
    await page.getByLabel("Song name *").fill("Temporary Name");
    await page.getByLabel("BPM *").fill("100");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "D", exact: true }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Minor" }).click();
    await page.getByRole("button", { name: "Save Song" }).click();
    await expect(
      page.getByRole("cell", { name: "Temporary Name" }),
    ).toBeVisible();

    // Click the row to edit
    await page.getByRole("cell", { name: "Temporary Name" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Song" }),
    ).toBeVisible();

    // Change the name
    await page.getByLabel("Song name *").clear();
    await page.getByLabel("Song name *").fill("Updated Song Name");
    await page.getByRole("button", { name: "Save Song" }).click();

    // Updated name appears in table
    await expect(
      page.getByRole("cell", { name: "Updated Song Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Temporary Name" }),
    ).not.toBeVisible();
  });

  test("SONG-05: delete a song; song no longer appears in the list", async ({
    page,
  }) => {
    // Add a song to delete
    await page.goto("/songs");
    await page.getByRole("button", { name: "Add Song" }).click();
    await page.getByLabel("Song name *").fill("Song To Delete");
    await page.getByLabel("BPM *").fill("90");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "E", exact: true }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Minor" }).click();
    await page.getByRole("button", { name: "Save Song" }).click();
    await expect(
      page.getByRole("cell", { name: "Song To Delete" }),
    ).toBeVisible();

    // Open edit sheet and delete
    await page.getByRole("cell", { name: "Song To Delete" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Song" }),
    ).toBeVisible();

    // Double-confirm delete
    await page.getByRole("button", { name: "Delete Song" }).click();
    await expect(page.getByText("Are you sure?")).toBeVisible();
    await page.getByRole("button", { name: "Confirm Delete" }).click();

    // Song is gone from the list
    await expect(
      page.getByRole("cell", { name: "Song To Delete" }),
    ).not.toBeVisible();
  });

  test("SONG-06: songs table paginates at 25 rows per page", async ({
    page,
    request,
  }) => {
    await page.goto("/songs");

    // Create 26 songs via API to trigger pagination
    for (let i = 1; i <= 26; i++) {
      const res = await request.post("/api/songs", {
        data: {
          name: `Pagination Test Song ${i}`,
          bpm: 100,
          musicalKey: "C",
          keySignature: "major",
          chordProgressions: "",
          tags: [],
        },
      });
      expect(res.ok()).toBeTruthy();
    }

    await page.reload();

    // Page shows "Page 1 of X" (allow for parallel test execution increasing total count)
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();

    // Next button is enabled; click it
    const nextButton = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();

    // Previous button works
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
  });
});

// Helper: create a song via API for test isolation
async function createSong(
  request: any,
  overrides: Record<string, unknown> = {},
) {
  const base = {
    name: "Test Song",
    bpm: 120,
    musicalKey: "C",
    keySignature: "major",
    chordProgressions: "",
    tags: [],
  };
  const res = await request.post("/api/songs", {
    data: { ...base, ...overrides },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

test.describe("Songs — Filters", () => {
  test("FILTER-01: BPM range filter; only songs in range appear", async ({
    page,
    request,
  }) => {
    await createSong(request, { name: "Slow Song", bpm: 70 });
    await createSong(request, { name: "Mid Song", bpm: 90 });
    await createSong(request, { name: "Fast Song", bpm: 150 });

    await page.goto("/songs");

    await page.getByLabel("Min BPM").fill("80");
    await expect(page).toHaveURL(/bpmMin=80/);

    await page.getByLabel("Max BPM").fill("100");
    await expect(page).toHaveURL(/bpmMax=100/);
    await expect(page).toHaveURL(/bpmMin=80/);

    await expect(
      page.getByRole("cell", { name: "Mid Song" }).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("cell", { name: "Slow Song" }).first(),
    ).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Fast Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-02: musical key filter; only songs with that key appear", async ({
    page,
    request,
  }) => {
    await createSong(request, { name: "G Song", musicalKey: "G" });
    await createSong(request, { name: "D Song", musicalKey: "D" });

    await page.goto("/songs");

    await page.getByLabel("Key", { exact: true }).click();
    await page.getByRole("option", { name: "G", exact: true }).click();

    await expect(
      page.getByRole("cell", { name: "G Song" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "D Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-03: key signature filter; only major or minor songs appear", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Major Song",
      keySignature: "major",
      musicalKey: "C",
    });
    await createSong(request, {
      name: "Minor Song",
      keySignature: "minor",
      musicalKey: "C",
    });

    await page.goto("/songs");

    await page.getByLabel("Key Sig").click();
    await page.getByRole("option", { name: "Major" }).click();

    await expect(
      page.getByRole("cell", { name: "Major Song" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Minor Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-04: chord progression keyword filter; only matching songs appear", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Em Song",
      chordProgressions: "Em,G,D",
      musicalKey: "G",
      keySignature: "major",
    });
    await createSong(request, {
      name: "No Em Song",
      chordProgressions: "C,F,Am",
      musicalKey: "C",
      keySignature: "major",
    });

    await page.goto("/songs");

    await page.getByLabel("Chord keyword").fill("Em");

    await expect(
      page.getByRole("cell", { name: "Em Song", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "No Em Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-05: lyric full-text search; only matching songs appear", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Love Song",
      lyrics: "I will always love you forever",
      musicalKey: "F",
      keySignature: "major",
    });
    await createSong(request, {
      name: "Rock Song",
      lyrics: "We will rock you tonight",
      musicalKey: "A",
      keySignature: "minor",
    });

    await page.goto("/songs");

    await page.getByLabel("Lyric search").fill("love");

    await expect(
      page.getByRole("cell", { name: "Love Song" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Rock Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-06: tag filter; only songs with that tag appear", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Ballad Song",
      tags: ["ballad"],
      musicalKey: "C",
      keySignature: "major",
    });
    await createSong(request, {
      name: "Opener Song",
      tags: ["opener"],
      musicalKey: "G",
      keySignature: "major",
    });

    await page.goto("/songs");

    await page.getByLabel("Tag").fill("ballad");

    await expect(
      page.getByRole("cell", { name: "Ballad Song" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Opener Song" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-07: multiple filters combined (AND); only songs matching all conditions appear", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Full Match",
      bpm: 90,
      musicalKey: "G",
      tags: ["ballad"],
      keySignature: "major",
    });
    await createSong(request, {
      name: "Wrong BPM",
      bpm: 140,
      musicalKey: "G",
      tags: ["ballad"],
      keySignature: "major",
    });
    await createSong(request, {
      name: "Wrong Key",
      bpm: 90,
      musicalKey: "D",
      tags: ["ballad"],
      keySignature: "major",
    });

    await page.goto("/songs");

    await page.getByLabel("Min BPM").fill("80");
    await expect(page).toHaveURL(/bpmMin=80/);
    await page.getByLabel("Max BPM").fill("100");
    await expect(page).toHaveURL(/bpmMax=100/);
    await page.getByLabel("Key", { exact: true }).click();
    await page.getByRole("option", { name: "G", exact: true }).click();
    await expect(page).toHaveURL(/key=G/);
    await page.getByLabel("Tag").fill("ballad");
    await expect(page).toHaveURL(/tag=ballad/);

    await expect(
      page.getByRole("cell", { name: "Full Match" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Wrong BPM" }).first(),
    ).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Wrong Key" }).first(),
    ).not.toBeVisible();
  });

  test("FILTER-08: sort by column; rows reorder on header click", async ({
    page,
    request,
  }) => {
    await createSong(request, {
      name: "Zzz Song",
      bpm: 200,
      musicalKey: "C",
      keySignature: "major",
    });
    await createSong(request, {
      name: "Aaa Song",
      bpm: 60,
      musicalKey: "C",
      keySignature: "major",
    });

    await page.goto("/songs");

    await expect(
      page.getByRole("cell", { name: "Zzz Song" }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /BPM/i }).click();

    await expect(
      page.locator("tbody tr:first-child > td:first-child"),
    ).toHaveText("Zzz Song");

    await page.getByRole("button", { name: /BPM/i }).click();
    await expect(
      page.locator("tbody tr:first-child > td:first-child"),
    ).toHaveText("Aaa Song");
  });
});

test.describe("Songs — CSV Import", () => {
  test("CSV-01: valid CSV; all rows imported and appear in table", async ({
    page,
  }) => {
    const csv = [
      "name,bpm,key,keySig",
      "CSV Song Alpha,120,C,major",
      "CSV Song Beta,95,G,minor",
    ].join("\n");

    await page.goto("/songs");
    await page.getByRole("button", { name: /Import CSV/i }).click();

    await expect(
      page.getByRole("heading", { name: "Import songs from CSV" }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "songs.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    // Preview step — 2 valid rows
    await expect(page.getByText(/2 rows found/i)).toBeVisible();
    await expect(page.getByText("2 valid")).toBeVisible();

    await page.getByRole("button", { name: /Import 2 songs/i }).click();

    // Done step
    await expect(page.getByText("2 songs imported")).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();

    // Songs appear in table
    await expect(
      page.getByRole("cell", { name: "CSV Song Alpha" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "CSV Song Beta" }),
    ).toBeVisible();
  });

  test("CSV-02: invalid rows shown in preview and skipped on import", async ({
    page,
  }) => {
    const csv = [
      "name,bpm,key,keySig",
      "Valid Song,110,A,major",
      "Bad Song,notabpm,Z,major", // invalid bpm + invalid key
    ].join("\n");

    await page.goto("/songs");
    await page.getByRole("button", { name: /Import CSV/i }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: "songs.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    await expect(page.getByText(/2 rows found/i)).toBeVisible();
    await expect(page.getByText("1 valid")).toBeVisible();
    await expect(page.getByText(/1 invalid/i)).toBeVisible();

    // Import button shows only the valid count
    await page.getByRole("button", { name: /Import 1 song/i }).click();

    await expect(page.getByText("1 songs imported")).toBeVisible();
    await expect(page.getByText(/1 row.*skipped/i)).toBeVisible();

    await page.getByRole("button", { name: "Done" }).click();

    await expect(
      page.getByRole("cell", { name: "Valid Song" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Bad Song" }),
    ).not.toBeVisible();
  });

  test("CSV-03: back button returns to upload step", async ({ page }) => {
    const csv = ["name,bpm,key,keySig", "Any Song,100,D,minor"].join("\n");

    await page.goto("/songs");
    await page.getByRole("button", { name: /Import CSV/i }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: "songs.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    await expect(page.getByText(/1 rows found/i)).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();

    await expect(
      page.getByRole("heading", { name: "Import songs from CSV" }),
    ).toBeVisible();
    // Back at upload step — drop zone is visible again
    await expect(
      page.getByText("Drop your CSV here or click to browse"),
    ).toBeVisible();
  });
});
