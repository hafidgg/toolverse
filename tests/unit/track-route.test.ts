import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  tool: { findUnique: vi.fn(), update: vi.fn() },
  analyticsEvent: { create: vi.fn() },
}));
vi.mock("@/lib/db/client", () => ({ prisma: prismaMock }));

import { POST } from "@/app/api/public/track/route";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://toolverse.test/api/public/track", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": BROWSER_UA, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const view = { eventType: "page_view", entityType: "tool", entityId: "tool_1", path: "/tools/notion" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.tool.findUnique.mockResolvedValue({ status: "PUBLISHED" });
  prismaMock.tool.update.mockResolvedValue({});
  prismaMock.analyticsEvent.create.mockResolvedValue({});
});

describe("POST /api/public/track", () => {
  it("records a tool page view and increments viewCount", async () => {
    const res = await POST(req(view, { origin: "https://toolverse.test" }));
    expect(res.status).toBe(200);
    expect(prismaMock.analyticsEvent.create).toHaveBeenCalledOnce();
    expect(prismaMock.tool.update).toHaveBeenCalledWith({
      where: { id: "tool_1" },
      data: { viewCount: { increment: 1 } },
    });
  });

  it("stores only the path of a same-site referrer", async () => {
    await POST(req(view, { referer: "https://toolverse.test/tools?q=secret" }));
    expect(prismaMock.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ referrer: "/tools" }),
    });
  });

  it("ignores bots without writing", async () => {
    const res = await POST(req(view, { "user-agent": "Googlebot/2.1" }));
    expect(res.status).toBe(204);
    expect(prismaMock.analyticsEvent.create).not.toHaveBeenCalled();
    expect(prismaMock.tool.update).not.toHaveBeenCalled();
  });

  it("treats a missing user agent as a bot", async () => {
    const res = await POST(req(view, { "user-agent": "" }));
    expect(res.status).toBe(204);
  });

  it("rejects cross-origin requests", async () => {
    const res = await POST(req(view, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(prismaMock.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it.each([
    ["unknown id", null],
    ["draft tool", { status: "DRAFT" }],
  ])("does not count a %s", async (_label, tool) => {
    prismaMock.tool.findUnique.mockResolvedValue(tool);
    const res = await POST(req(view));
    expect(res.status).toBe(404);
    expect(prismaMock.analyticsEvent.create).not.toHaveBeenCalled();
    expect(prismaMock.tool.update).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", "{"],
    ["unknown event type", { ...view, eventType: "purchase" }],
    ["client outbound_click (counted by /go)", { ...view, eventType: "outbound_click" }],
    ["unsupported entity type", { ...view, entityType: "category" }],
    ["entityId without entityType", { eventType: "page_view", entityId: "tool_1" }],
    ["external path", { ...view, path: "https://evil.example" }],
    ["protocol-relative path", { ...view, path: "//evil.example" }],
    ["oversized metadata", { ...view, metadata: { x: "a".repeat(2000) } }],
  ])("rejects %s", async (_label, body) => {
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(prismaMock.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("does not increment clickCount from client tool_click events", async () => {
    await POST(req({ ...view, eventType: "tool_click" }));
    expect(prismaMock.analyticsEvent.create).toHaveBeenCalledOnce();
    expect(prismaMock.tool.update).not.toHaveBeenCalled();
  });

  it("accepts an entity-less search event", async () => {
    const res = await POST(req({ eventType: "search", path: "/search", metadata: { q: "notes" } }));
    expect(res.status).toBe(200);
    expect(prismaMock.tool.findUnique).not.toHaveBeenCalled();
  });
});
