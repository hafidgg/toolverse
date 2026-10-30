import { describe, it, expect } from "vitest";
import { formatToolCount, pluralize } from "@/lib/utils/format";
import { excludeTools } from "@/lib/utils/collections";

describe("formatToolCount", () => {
  it("uses the singular only for exactly one", () => {
    expect(formatToolCount(0)).toBe("0 tools");
    expect(formatToolCount(1)).toBe("1 tool");
    expect(formatToolCount(2)).toBe("2 tools");
    expect(formatToolCount(57)).toBe("57 tools");
  });

  it("supports other nouns", () => {
    expect(pluralize(1, "click")).toBe("1 click");
    expect(pluralize(3, "click")).toBe("3 clicks");
  });
});

describe("excludeTools", () => {
  it("removes featured tools from trending, preserving order", () => {
    const trending = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expect(excludeTools(trending, [{ id: "b" }, { id: "d" }])).toEqual([{ id: "a" }, { id: "c" }]);
  });
});
