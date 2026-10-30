import { describe, it, expect } from "vitest";
import {
  isLikelyBot,
  isValidToolSlug,
  sanitizeReferrer,
  selectOutboundDestination,
} from "@/lib/outbound";

const published = (websiteUrl: string) => ({ status: "PUBLISHED", websiteUrl });

describe("selectOutboundDestination", () => {
  it("accepts a published tool's https website", () => {
    expect(selectOutboundDestination(published("https://chatgpt.com"))?.href).toBe("https://chatgpt.com/");
  });

  it("rejects missing, draft and archived tools", () => {
    expect(selectOutboundDestination(null)).toBeNull();
    expect(selectOutboundDestination({ status: "DRAFT", websiteUrl: "https://a.com" })).toBeNull();
    expect(selectOutboundDestination({ status: "ARCHIVED", websiteUrl: "https://a.com" })).toBeNull();
  });

  it.each([
    "http://example.com",
    "javascript:alert(1)",
    "data:text/html,hi",
    "//evil.com",
    "/relative/path",
    "https://user:pass@example.com",
    "https://localhost/",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://intranet/",
    "not a url",
    "",
  ])("rejects unsafe destination %j", (url) => {
    expect(selectOutboundDestination(published(url))).toBeNull();
  });

  it("ignores any affiliateUrl on the tool", () => {
    const tool = { ...published("https://notion.so"), affiliateUrl: "https://evil.example/aff" };
    expect(selectOutboundDestination(tool)?.hostname).toBe("notion.so");
  });
});

describe("isValidToolSlug", () => {
  it("accepts normal slugs and rejects traversal / odd input", () => {
    expect(isValidToolSlug("github-copilot")).toBe(true);
    for (const s of ["", "../admin", "a b", "A", "x".repeat(101), "a--b", "-a"]) {
      expect(isValidToolSlug(s)).toBe(false);
    }
  });
});

describe("isLikelyBot", () => {
  it("flags common crawlers and empty UAs, not browsers", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isLikelyBot("curl/8.0")).toBe(true);
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36")).toBe(false);
  });
});

describe("sanitizeReferrer", () => {
  const site = "https://toolverse.example";
  it("keeps only the path for same-site referrers", () => {
    expect(sanitizeReferrer("https://toolverse.example/tools/x?utm=1#y", site)).toBe("/tools/x");
  });
  it("keeps only the origin for external referrers", () => {
    expect(sanitizeReferrer("https://news.example/a/b?id=42", site)).toBe("https://news.example");
  });
  it("drops missing or invalid referrers", () => {
    expect(sanitizeReferrer(null, site)).toBeUndefined();
    expect(sanitizeReferrer("garbage", site)).toBeUndefined();
  });
});
