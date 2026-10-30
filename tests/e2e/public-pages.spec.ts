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
    // Ads aren't configured in test environments: no labelled ad container may remain.
    expect(html).not.toContain('aria-label="Advertisement"');
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

test.describe("Homepage honesty and polish", () => {
  test("browse-by-category hides empty categories and pluralizes counts", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "Browse by category" }),
    });
    const counts = await section.locator("a p.text-xs").allTextContents();
    expect(counts.length).toBeGreaterThan(0);
    for (const text of counts) {
      expect(text).toMatch(/^(1 tool|([2-9]|\d{2,}) tools)$/);
    }
  });

  test("no tool appears in both Featured and Trending", async ({ page }) => {
    await page.goto("/");
    const hrefs = async (heading: RegExp) =>
      page
        .locator("section", { has: page.getByRole("heading", { name: heading }) })
        .locator('a[href^="/tools/"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    const featured = new Set(await hrefs(/Featured Tools/));
    const trending = await hrefs(/Trending/);
    expect(trending.filter((h) => featured.has(h))).toEqual([]);
  });

  test("hero makes no comparison/alternatives promise and no '1 tools'", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain("compare features, pricing, and alternatives");
    expect(html).not.toMatch(/\b1 tools\b/);
  });
});

test.describe("Unknown dynamic routes return a real 404", () => {
  for (const path of [
    "/categories/does-not-exist-xyz",
    "/company/does-not-exist-xyz",
    "/collections/does-not-exist-xyz",
    "/blog/does-not-exist-xyz",
    "/does-not-exist-xyz",
  ]) {
    test(`${path} -> 404`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
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
