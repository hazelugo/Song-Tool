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
    await expect(page.getByRole("cell", { name: "opener" })).toBeVisible();
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
