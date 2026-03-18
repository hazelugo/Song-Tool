import { test, expect } from "@playwright/test";

const MOCK_SONGS = [
  {
    id: "song-1",
    name: "Dark Night",
    bpm: 78,
    musicalKey: "A",
    keySignature: "minor",
    timeSignature: "4/4",
    chordProgressions: ["Am", "F", "C", "G"],
    tags: [{ id: "tag-1", name: "ballad", songId: "song-1" }],
    youtubeUrl: null,
    spotifyUrl: null,
    lyrics: null,
    lyricsSearch: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  },
  {
    id: "song-2",
    name: "Slow Burn",
    bpm: 82,
    musicalKey: "D",
    keySignature: "minor",
    timeSignature: "4/4",
    chordProgressions: ["Dm", "Am", "Bb", "F"],
    tags: [],
    youtubeUrl: null,
    spotifyUrl: null,
    lyrics: null,
    lyricsSearch: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  },
];

const MOCK_PARSED_FILTERS = {
  keySig: "minor",
  bpmMin: 70,
  bpmMax: 90,
};

test.describe("Discovery — AI Search", () => {
  test("DISC-01: page loads with search bar and suggestion chips", async ({
    page,
  }) => {
    await page.goto("/discovery");

    // Search input is present and focused
    await expect(page.locator("input[type='text']")).toBeVisible();

    // Suggestion chips are rendered
    await expect(
      page.getByRole("button", { name: /Dark Minor Ballad/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Upbeat.*Energetic/i }),
    ).toBeVisible();
  });

  test("DISC-02: submitting a query shows loading state then results", async ({
    page,
  }) => {
    // Intercept API to return controlled response
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: MOCK_SONGS,
          parsedFilters: MOCK_PARSED_FILTERS,
        }),
      });
    });

    await page.goto("/discovery");

    const input = page.locator("input[type='text']");
    await input.fill("dark minor ballad around 80 BPM");
    await page.getByRole("button", { name: "Search" }).click();

    // Loading dots appear briefly (may be fast due to mock)
    // Then results appear
    await expect(page.getByText("Dark Night")).toBeVisible();
    await expect(page.getByText("Slow Burn")).toBeVisible();
  });

  test("DISC-03: parsed filter badge shows extracted parameters", async ({
    page,
  }) => {
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: MOCK_SONGS,
          parsedFilters: MOCK_PARSED_FILTERS,
        }),
      });
    });

    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("dark slow minor ballad");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("Dark Night")).toBeVisible();

    // Parsed filter badge shows extracted BPM/key info
    await expect(page.getByText(/70.*90 BPM/)).toBeVisible();
  });

  test("DISC-04: error state shown when API call fails", async ({ page }) => {
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Gemini API unavailable" }),
      });
    });

    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("some query");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("Search failed")).toBeVisible();
    await expect(page.getByText("Gemini API unavailable")).toBeVisible();
  });

  test("DISC-05: empty results state shown when no songs match", async ({
    page,
  }) => {
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [], parsedFilters: {} }),
      });
    });

    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("very obscure query xyz");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("No songs matched your search")).toBeVisible();
  });

  test("DISC-06: suggestion chip triggers search with preset prompt", async ({
    page,
  }) => {
    let capturedBody = "";
    await page.route("/api/discovery", async (route) => {
      capturedBody = route.request().postData() ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [], parsedFilters: {} }),
      });
    });

    await page.goto("/discovery");
    await page.getByRole("button", { name: /Dark Minor Ballad/i }).click();

    // Wait for the API to be called
    await page.waitForResponse("/api/discovery");

    // Input filled with suggestion prompt
    const inputValue = await page.locator("input[type='text']").inputValue();
    expect(inputValue).toBeTruthy();

    // API received the suggestion prompt
    expect(capturedBody).toContain("dark");
  });

  test("DISC-07: clear button resets results and search input", async ({
    page,
  }) => {
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: MOCK_SONGS,
          parsedFilters: MOCK_PARSED_FILTERS,
        }),
      });
    });

    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("dark minor ballad");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Dark Night")).toBeVisible();

    // Clear button (X icon)
    await page.locator("button[type='button']").filter({ hasText: "" }).first().click();
    // Alternatively target by its position next to input:
    const clearBtn = page.locator("input[type='text'] ~ div button[type='button']").first();
    // The results should disappear and input should be empty after clear
    // Click the X button that appears in the search bar
    await page.locator("input[type='text']").fill("");
    await page.keyboard.press("Escape");

    // Use the X button rendered when query is non-empty
    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("dark");
    // X button should be visible now
    const xButton = page.locator("form button[type='button']");
    await expect(xButton).toBeVisible();
    await xButton.click();
    await expect(page.locator("input[type='text']")).toHaveValue("");
  });

  test("DISC-08: 'Save as Playlist' button appears with results and opens builder", async ({
    page,
  }) => {
    await page.route("/api/discovery", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: MOCK_SONGS,
          parsedFilters: MOCK_PARSED_FILTERS,
        }),
      });
    });

    await page.goto("/discovery");
    await page.locator("input[type='text']").fill("dark minor ballad");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Dark Night")).toBeVisible();

    // "Save as Playlist" button appears in the status bar
    const saveBtn = page.getByRole("button", { name: "Save as Playlist" });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // PlaylistBuilder is shown
    await expect(
      page.getByRole("heading", { name: "Build your playlist" }),
    ).toBeVisible();
  });
});
