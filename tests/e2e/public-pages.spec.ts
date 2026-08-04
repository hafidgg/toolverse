import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads and shows the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /find the right tool/i })).toBeVisible();
  });

  test("tools listing page renders", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByRole("heading", { name: "All Tools" })).toBeVisible();
  });

  test("search page handles empty query gracefully", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/start typing to search/i)).toBeVisible();
  });

  test("sitemap.xml responds with XML", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
  });

  test("robots.txt responds", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
  });

  test("unknown tool returns 404", async ({ page }) => {
    const res = await page.goto("/tools/this-tool-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Admin auth", () => {
  test("unauthenticated admin access redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
