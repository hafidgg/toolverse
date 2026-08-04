import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const eventSchema = z.object({
  eventType: z.enum(["page_view", "tool_click", "search", "outbound_click"]),
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(100).optional(),
  path: z.string().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { eventType, entityType, entityId, path, metadata } = parsed.data;

  await prisma.analyticsEvent.create({
    data: {
      eventType,
      entityType,
      entityId,
      path,
      referrer: req.headers.get("referer") ?? undefined,
      metadata,
    },
  });

  if (eventType === "tool_click" && entityId) {
    await prisma.tool.update({ where: { id: entityId }, data: { clickCount: { increment: 1 } } }).catch(() => {});
  }
  if (eventType === "page_view" && entityType === "tool" && entityId) {
    await prisma.tool.update({ where: { id: entityId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
