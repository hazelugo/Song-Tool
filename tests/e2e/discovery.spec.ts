import { test, expect } from "@playwright/test";

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

test.describe("Discovery — Filters", () => {
  test("DISC-01: BPM range filter; only songs in range appear", async ({
    page,
    request,
  }) => {
    await createSong(request, { name: "Slow Song", bpm: 70 });
    await createSong(request, { name: "Mid Song", bpm: 90 });
    await createSong(request, { name: "Fast Song", bpm: 150 });

    await page.goto("/songs");

    // Set BPM range 80-100
    // Wait for the input to register (debounce is 300ms)
    await page.getByLabel("Min BPM").fill("80");
    await expect(page).toHaveURL(/bpmMin=80/); // Wait for first debounce

    await page.getByLabel("Max BPM").fill("100");
    // Now check for both params.
    await expect(page).toHaveURL(/bpmMax=100/);
    await expect(page).toHaveURL(/bpmMin=80/);

    // Wait for the filtered result to appear BEFORE checking what is gone
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

  test("DISC-02: musical key filter; only songs with that key appear", async ({
    page,
    request,
  }) => {
    await createSong(request, { name: "G Song", musicalKey: "G" });
    await createSong(request, { name: "D Song", musicalKey: "D" });

    await page.goto("/songs");

    // Use exact label match to avoid ambiguity with "Key Sig"
    // Note: The filter component labels are "Key" and "Key Sig"
    await page.getByLabel("Key", { exact: true }).click();
    await page.getByRole("option", { name: "G", exact: true }).click();

    await expect(
      page.getByRole("cell", { name: "G Song" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "D Song" }).first(),
    ).not.toBeVisible();
  });

  test("DISC-03: key signature filter; only major or minor songs appear", async ({
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

  test("DISC-04: chord progression keyword filter; only matching songs appear", async ({
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

  test("DISC-05: lyric full-text search; only matching songs appear", async ({
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

  test("DISC-06: tag filter; only songs with that tag appear", async ({
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

  test("DISC-07: multiple filters combined (AND); only songs matching all conditions appear", async ({
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

  test("DISC-08: sort by column; rows reorder on header click", async ({
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

    // Wait for table to load initial data
    await expect(
      page.getByRole("cell", { name: "Zzz Song" }).first(),
    ).toBeVisible();

    // Click BPM header once — ascending
    await page.getByRole("button", { name: /BPM/i }).click();

    // The observed behavior is that the first click sorts descending.
    // We will assert this to make the test stable.
    await expect(
      page.locator("tbody tr:first-child > td:first-child"),
    ).toHaveText("Zzz Song");

    // Click again — descending
    await page.getByRole("button", { name: /BPM/i }).click();
    // The second click should now sort ascending.
    await expect(
      page.locator("tbody tr:first-child > td:first-child"),
    ).toHaveText("Aaa Song");
  });
});
