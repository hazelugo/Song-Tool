import { test, expect } from "@playwright/test";

test.describe("Songs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/songs");
  });

  test("SONG-01: add song with required fields and see it in the list", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });

  test("SONG-02: add song with optional fields (lyrics, YouTube URL, Spotify URL)", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });

  test("SONG-03: add tags to a song; tags appear as pills in the table", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });

  test("SONG-04: edit song fields; updated values appear in the list", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });

  test("SONG-05: delete song; song no longer appears in the list", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });

  test("SONG-06: songs table shows 25 rows per page; pagination controls work", async ({
    page,
  }) => {
    test.todo("implement after UI is built");
  });
});
