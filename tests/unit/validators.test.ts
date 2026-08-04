import { describe, it, expect } from "vitest";
import { toolFormSchema, searchQuerySchema } from "@/lib/validators/tool";

describe("toolFormSchema", () => {
  const base = {
    name: "Notion",
    slug: "notion",
    description: "An all-in-one workspace for notes, docs, and project management.",
    websiteUrl: "https://notion.so",
    pricingModel: "FREEMIUM" as const,
    status: "PUBLISHED" as const,
    categoryId: "cku00000000000000000000",
  };

  it("accepts a valid minimal tool", () => {
    const result = toolFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    const result = toolFormSchema.safeParse({ ...base, slug: "Not A Slug!" });
    expect(result.success).toBe(false);
  });

  it("rejects a description that's too short", () => {
    const result = toolFormSchema.safeParse({ ...base, description: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid website URL", () => {
    const result = toolFormSchema.safeParse({ ...base, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("applies default sort and page", () => {
    const result = searchQuerySchema.parse({ q: "design" });
    expect(result.sort).toBe("popular");
    expect(result.page).toBe(1);
  });

  it("coerces page to a number", () => {
    const result = searchQuerySchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});
