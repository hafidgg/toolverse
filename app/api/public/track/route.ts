import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { isLikelyBot, sanitizeReferrer } from "@/lib/outbound";

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

const MAX_METADATA_BYTES = 1024;

// Only "tool" is a trackable entity for now; more types arrive with the
// schema that gives them a counter. Outbound clicks are counted server-side
// by /go/[slug] and are not accepted from the client (they'd double count).
const eventSchema = z
  .object({
    eventType: z.enum(["page_view", "tool_click", "search"]),
    entityType: z.literal("tool").optional(),
    entityId: z.string().min(1).max(100).optional(),
    path: z
      .string()
      .max(300)
      .regex(/^\/(?!\/)[^\s\\]*$/, "path must be a site path")
      .optional(),
    metadata: z
      .record(z.string(), jsonValueSchema)
      .refine((m) => JSON.stringify(m).length <= MAX_METADATA_BYTES, "metadata too large")
      .optional(),
  })
  .refine((e) => (e.entityType === undefined) === (e.entityId === undefined), {
    message: "entityType and entityId go together",
  });

function sameOrigin(req: NextRequest) {
  // Browsers send Origin on POST (fetch and sendBeacon). Missing Origin is
  // allowed for non-browser clients, which the bot filter mostly drops anyway.
  const origin = req.headers.get("origin");
  return !origin || origin === req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Best-effort filter, not a security control: crawlers that run JS would
  // otherwise inflate view counts. Accepted silently so they don't retry.
  if (isLikelyBot(req.headers.get("user-agent"))) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { eventType, entityType, entityId, path, metadata } = parsed.data;

  // Never count against ids that aren't real, published tools.
  if (entityType === "tool" && entityId) {
    const tool = await prisma.tool.findUnique({ where: { id: entityId }, select: { status: true } });
    if (!tool || tool.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
    }
  }

  await prisma.analyticsEvent.create({
    data: {
      eventType,
      entityType,
      entityId,
      path,
      referrer: sanitizeReferrer(req.headers.get("referer"), req.nextUrl.origin),
      metadata,
    },
  });

  if (eventType === "page_view" && entityType === "tool" && entityId) {
    await prisma.tool.update({ where: { id: entityId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
