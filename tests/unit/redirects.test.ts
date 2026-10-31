import { describe, it, expect } from "vitest";
import {
  findRedirectConflict,
  normalizePathname,
  safeStoredRedirect,
  validateFromPath,
  validateToPath,
} from "@/lib/redirects";

describe("validateFromPath", () => {
  it.each([
    ["/old-url", "/old-url"],
    ["/blog/old-post", "/blog/old-post"],
    ["/old-url/", "/old-url"],
    ["  /padded  ", "/padded"],
  ])("accepts %j", (input, expected) => {
    expect(validateFromPath(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    "",
    "old-url",
    "/",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/x",
    "/old?x=1",
    "/old#frag",
    "/a/../admin",
    "/admin",
    "/admin/tools",
    "/api/public/track",
    "/go/notion",
    "/_next/static/x",
    "/with space",
    "/" + "a".repeat(300),
  ])("rejects %j", (input) => {
    expect(validateFromPath(input).ok).toBe(false);
  });

  it("does not treat /administration as reserved", () => {
    expect(validateFromPath("/administration").ok).toBe(true);
  });
});

describe("validateToPath", () => {
  it.each([
    ["/new-url", "/new-url"],
    ["/tools/notion?ref=old#pricing", "/tools/notion?ref=old#pricing"],
    ["/", "/"],
  ])("accepts %j", (input, expected) => {
    expect(validateToPath(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    "https://evil.example",
    "http://evil.example/x",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/%2F%2Fevil.example",
    "/%252F%252Fevil.example",
    "/%5Cevil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    "new-url",
    "/admin",
    "/api/admin/auth/login",
    "/go/notion",
    "/x\u0000y",
  ])("rejects %j", (input) => {
    expect(validateToPath(input).ok).toBe(false);
  });
});

describe("findRedirectConflict", () => {
  const existing = [{ fromPath: "/a", toPath: "/b" }];

  it("allows an unrelated rule", () => {
    expect(findRedirectConflict({ fromPath: "/c", toPath: "/d" }, existing)).toBeNull();
  });

  it("rejects self-redirects, including trailing-slash variants", () => {
    expect(findRedirectConflict({ fromPath: "/x", toPath: "/x" }, [])).not.toBeNull();
    expect(findRedirectConflict({ fromPath: "/x", toPath: "/x/?q=1" }, [])).not.toBeNull();
  });

  it("rejects a duplicate source", () => {
    expect(findRedirectConflict({ fromPath: "/a/", toPath: "/z" }, existing)).toMatch(/already exists/);
  });

  it("rejects pointing at a redirected path (chain forward)", () => {
    expect(findRedirectConflict({ fromPath: "/c", toPath: "/a" }, existing)).toMatch(/itself redirected/);
  });

  it("rejects a source that is another rule's destination (chain backward / loop)", () => {
    expect(findRedirectConflict({ fromPath: "/b", toPath: "/a" }, existing)).not.toBeNull();
    expect(findRedirectConflict({ fromPath: "/b", toPath: "/c" }, existing)).toMatch(/already redirects/);
  });
});

describe("safeStoredRedirect", () => {
  it("returns the destination for a valid stored rule", () => {
    expect(safeStoredRedirect({ fromPath: "/old", toPath: "/new?x=1" })).toBe("/new?x=1");
  });

  it.each([
    { fromPath: "/old", toPath: "https://evil.example" },
    { fromPath: "/old", toPath: "//evil.example" },
    { fromPath: "/old", toPath: "/old" },
    { fromPath: "/admin/x", toPath: "/new" },
  ])("refuses unsafe stored rule %j", (rule) => {
    expect(safeStoredRedirect(rule)).toBeNull();
  });
});

describe("normalizePathname", () => {
  it.each([
    ["/", "/"],
    ["/a/", "/a"],
    ["/a//", "/a"],
    ["/a", "/a"],
  ])("%j → %j", (input, expected) => {
    expect(normalizePathname(input)).toBe(expected);
  });
});
