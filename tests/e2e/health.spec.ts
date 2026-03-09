import { test, expect } from "@playwright/test"

test("homepage loads without error", async ({ page }) => {
  await page.goto("/")
  // Redirects to /songs — sidebar should be visible
  await expect(page).toHaveURL(/\/songs/)
  await expect(page.getByText("Song Tool")).toBeVisible()
  await expect(page.getByRole("link", { name: "Songs" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Discovery" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Playlists" })).toBeVisible()
})

test("health endpoint returns ok status", async ({ request }) => {
  const response = await request.get("/api/health")
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe("ok")
})

test("sidebar nav links navigate to placeholder pages", async ({ page }) => {
  await page.goto("/songs")
  await expect(page.getByRole("heading", { name: "Songs" })).toBeVisible()

  await page.getByRole("link", { name: "Discovery" }).click()
  await expect(page.getByRole("heading", { name: "Discovery" })).toBeVisible()

  await page.getByRole("link", { name: "Playlists" }).click()
  await expect(page.getByRole("heading", { name: "Playlists" })).toBeVisible()
})
