import { test, expect } from "@playwright/test";

const MOCK_SEED = {
  id: "s1",
  name: "Dark Night",
  bpm: 78,
  musicalKey: "Am",
  keySignature: "minor",
  timeSignature: "4/4",
  chordProgressions: [],
  tags: [],
  youtubeUrl: null,
  spotifyUrl: null,
  lyrics: null,
  lyricsSearch: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  userId: "u1",
  deletedAt: null,
};

test.describe("Discovery Page", () => {
  test("SC-2a — seedId param pre-seeds chain", async ({ page }) => {
    await page.route("**/api/similar*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ seed: MOCK_SEED, results: [] }),
      });
    });

    await page.goto("/discovery?seedId=s1");
    await expect(page.locator("text=Dark Night")).toBeVisible();
  });

  test("SC-2b — no seedId, chain opens empty without fetching /api/similar", async ({
    page,
  }) => {
    let similarRequested = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/similar")) similarRequested = true;
    });

    await page.goto("/discovery");
    // Wait briefly to confirm no background similar request fires
    await page.waitForTimeout(500);

    expect(similarRequested).toBe(false);
  });

  test("SC-4 — POST /api/discovery is removed (405 or 404)", async ({
    request,
  }) => {
    const response = await request.post("/api/discovery", { data: {} });
    expect([404, 405]).toContain(response.status());
  });
});
