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

// Slug from data/tools/tools.json (status PUBLISHED), loaded into the CI test
// database by `npm run seed:content`. Never run these against production.
const SEEDED_TOOL_SLUG = "chatgpt";

test.describe("Milestone 1: safe, honest, measurable", () => {
  test("mobile menu opens at 375px and its links are reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    for (const name of ["Search", "Tools", "Categories", "Collections", "Companies", "Blog"]) {
      await expect(dialog.getByRole("link", { name })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await trigger.click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Tools" }).click();
    await expect(page).toHaveURL(/\/tools$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });

  test("/tools ignores invalid query params", async ({ request }) => {
    const res = await request.get("/tools?pricing=INVALID&page=abc&sort=bogus");
    expect(res.status()).toBe(200);
  });

  test("/go/<existing-slug> redirects 302 with noindex header", async ({ request }) => {
    const res = await request.get(`/go/${SEEDED_TOOL_SLUG}`, { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(res.headers()["location"]).toMatch(/^https:\/\//);
  });

  test("/go/unknown returns 404", async ({ request }) => {
    const res = await request.get("/go/unknown-xyz", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("robots.txt disallows /go/", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Disallow: /go/");
  });

  test("homepage has no fake tool count or ad placeholders", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("1,000+");
    expect(html).not.toMatch(/Ad Slot|Ad — Leaderboard|Ad — Top Banner|Ad — Sidebar/);
  });

  test("tool page has no ad placeholder and links out via /go/", async ({ request }) => {
    const html = await (await request.get(`/tools/${SEEDED_TOOL_SLUG}`)).text();
    expect(html).not.toContain("Ad Slot");
    expect(html).toContain(`href="/go/${SEEDED_TOOL_SLUG}"`);
    expect(html).not.toContain("sponsored");
  });

  for (const asset of ["/og-default.png", "/logo.png"]) {
    test(`${asset} is served`, async ({ request }) => {
      const res = await request.get(asset);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    });
  }
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
