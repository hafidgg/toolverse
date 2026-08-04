import { describe, it, expect } from "vitest";
import { breadcrumbSchema, faqSchema, buildMetadata } from "@/lib/seo/metadata";

describe("breadcrumbSchema", () => {
  it("builds a valid BreadcrumbList JSON-LD structure", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0]?.position).toBe(1);
  });
});

describe("faqSchema", () => {
  it("maps question/answer pairs to FAQPage entities", () => {
    const schema = faqSchema([{ question: "Is it free?", answer: "Yes, there is a free tier." }]);
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0]?.name).toBe("Is it free?");
  });
});

describe("buildMetadata", () => {
  it("suffixes the site name onto the title", () => {
    const metadata = buildMetadata({ path: "/tools/notion", title: "Notion" });
    expect(metadata.title).toContain("Notion");
    expect(metadata.title).toContain("ToolVerse");
  });

  it("sets noindex robots when requested", () => {
    const metadata = buildMetadata({ path: "/search", noindex: true });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
