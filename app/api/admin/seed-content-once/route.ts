import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { seedContent } from "@/prisma/seed/content";

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
    await seedContent();

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

    return NextResponse.json({ success: true, message: "Content seed complete." });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}