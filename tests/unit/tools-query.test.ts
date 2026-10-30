import { describe, it, expect } from "vitest";
import { parseToolsQuery } from "@/lib/validators/tools-query";

describe("parseToolsQuery", () => {
  it("drops invalid pricing, page and sort values without throwing", () => {
    expect(parseToolsQuery({ pricing: "INVALID", page: "abc", sort: "hacked" })).toEqual({
      category: undefined,
      tag: undefined,
      platform: undefined,
      pricing: undefined,
      sort: undefined,
      page: 1,
    });
  });

  it.each(["0", "-3", "1.5", "1e3", " 2", "99999999"])("defaults page %j to 1", (page) => {
    expect(parseToolsQuery({ page }).page).toBe(1);
  });

  it("keeps valid values", () => {
    expect(
      parseToolsQuery({ pricing: "FREEMIUM", page: "3", sort: "newest", category: "ai-tools" })
    ).toMatchObject({ pricing: "FREEMIUM", page: 3, sort: "newest", category: "ai-tools" });
  });

  it("keeps valid fields when others are invalid", () => {
    const q = parseToolsQuery({ pricing: "free", sort: "az", page: "2" });
    expect(q.pricing).toBeUndefined();
    expect(q.sort).toBe("az");
    expect(q.page).toBe(2);
  });

  it("ignores repeated (array) params and oversized filters", () => {
    const q = parseToolsQuery({ page: ["2", "3"], category: "x".repeat(500) });
    expect(q.page).toBe(1);
    expect(q.category).toBeUndefined();
  });
});
