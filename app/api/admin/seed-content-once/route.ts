import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { seedContent } from "@/prisma/seed/content";

// Extends this route's serverless execution time budget. Default Vercel
// function timeouts (10s on Hobby unless raised) were the likely cause of
// tools being silently cut off mid-seed in production — the batched query
// pattern in content.ts's upsertTools() also directly reduces the total
// time needed, but this is cheap insurance on top of that fix. Hobby plans
// may cap this lower than 60 regardless; check your plan's actual limit if
// this still times out.
export const maxDuration = 60;

// TEMPORARY route: runs the full content seed (taxonomy, companies, tools,
// collections) from Vercel's servers, since local machines have sometimes
// been unable to reach the database directly (see docs/content-seeding.md /
// project history — this mirrors the earlier one-off admin seed route).
//
// Delete this file and redeploy once the seed has run successfully. The
// underlying seedContent() is fully idempotent (safe to re-run), but this
// route should not stay reachable in production long-term regardless.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await seedContent();

    // These public listing pages use ISR (revalidate = 1800/3600s) and were
    // first statically rendered before this seed ran, against an empty
    // database — without this, they'd keep serving that empty snapshot
    // until their revalidate window naturally elapses.
    revalidatePath("/");
    revalidatePath("/tools");
    revalidatePath("/categories");
    revalidatePath("/companies");
    revalidatePath("/collections");
    revalidateTag("tools");

    // Full exact counts returned directly in the response — no need to dig
    // through (possibly truncated) Vercel logs to see what happened.
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}