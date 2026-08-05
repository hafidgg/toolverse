import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

// A recursive JSON schema whose inferred type structurally matches Prisma's
// `InputJsonValue`. Using `z.unknown()` for metadata would type-check at the
// Zod boundary but fail at the Prisma call site, since `unknown` isn't
// assignable to Prisma's JSON input type without narrowing — this schema
// does that narrowing for real, so no cast is needed downstream.
//
// Note: `InputJsonValue` deliberately excludes `null` (even nested) — Prisma
// requires the `Prisma.JsonNull` sentinel to represent JSON null explicitly,
// a plain `null` literal isn't part of the type. Analytics metadata is
// small, application-defined event context (not arbitrary user JSON), so we
// simply don't accept `null` values here rather than reaching for a sentinel.
const jsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);

const eventSchema = z.object({
  eventType: z.enum(["page_view", "tool_click", "search", "outbound_click"]),
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(100).optional(),
  path: z.string().max(300).optional(),
  metadata: z.record(z.string(), jsonValueSchema).optional(),
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