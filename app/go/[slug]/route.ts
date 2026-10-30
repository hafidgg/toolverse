import { after, type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isLikelyBot, isValidToolSlug, sanitizeReferrer, selectOutboundDestination } from "@/lib/outbound";

export const dynamic = "force-dynamic";

const NO_INDEX_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "no-store, max-age=0",
};

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: NO_INDEX_HEADERS });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidToolSlug(slug)) return notFound();

  let tool: { id: string; status: string; websiteUrl: string } | null;
  try {
    tool = await prisma.tool.findUnique({
      where: { slug },
      select: { id: true, status: true, websiteUrl: true },
    });
  } catch {
    return new NextResponse("Service unavailable", { status: 503, headers: NO_INDEX_HEADERS });
  }

  const destination = selectOutboundDestination(tool);
  if (!tool || !destination) return notFound();

  if (!isLikelyBot(req.headers.get("user-agent"))) {
    const toolId = tool.id;
    const referrer = sanitizeReferrer(req.headers.get("referer"), req.nextUrl.origin);
    // Runs after the response is sent; failures never affect the redirect.
    after(async () => {
      await Promise.allSettled([
        prisma.analyticsEvent.create({
          data: {
            eventType: "outbound_click",
            entityType: "tool",
            entityId: toolId,
            path: `/go/${slug}`,
            referrer,
          },
        }),
        prisma.tool.update({ where: { id: toolId }, data: { clickCount: { increment: 1 } } }),
      ]);
    });
  }

  const res = NextResponse.redirect(destination, 302);
  for (const [k, v] of Object.entries(NO_INDEX_HEADERS)) res.headers.set(k, v);
  return res;
}
