import { describe, it, expect } from "vitest";
import { safeAdminRedirect } from "@/lib/auth/safe-redirect";

describe("safeAdminRedirect", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/tools", "/admin/tools"],
    ["/admin/tools/abc?tab=seo", "/admin/tools/abc?tab=seo"],
  ])("allows %j", (input, expected) => {
    expect(safeAdminRedirect(input)).toBe(expected);
  });

  it.each([
    "//evil.example",
    "https://evil.example",
    "http://evil.example/admin",
    "/\\evil.example",
    "\\\\evil.example",
    "/\\/evil.example",
    "%2F%2Fevil.example",
    "/%2F%2Fevil.example",
    "%252F%252Fevil.example",
    "/%5Cevil.example",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,hi",
    "/tools",
    "/adminx",
    "/admin/../tools",
    "/admin/%2E%2E/tools",
    "/admin\t/x",
    " /admin",
    "admin",
    "",
  ])("rejects %j -> /admin", (input) => {
    expect(safeAdminRedirect(input)).toBe("/admin");
  });

  it("falls back for null/undefined", () => {
    expect(safeAdminRedirect(null)).toBe("/admin");
    expect(safeAdminRedirect(undefined)).toBe("/admin");
  });
});
