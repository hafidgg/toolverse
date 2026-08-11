import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { seedTaxonomyAndCompanies, seedToolsBatch, seedCollections } from "@/prisma/seed/content";

export const maxDuration = 60; // Has no effect on Hobby plans (hard-capped
// around 10s there regardless of this value) — kept for accounts on a plan
// where it does apply. The batching below is what actually makes this
// reliable on every plan, including Hobby.

const DEFAULT_BATCH_SIZE = 10;

function invalidatePublicCaches() {
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/categories");
  revalidatePath("/companies");
  revalidatePath("/collections");
  revalidateTag("tools");
}

// TEMPORARY route — delete once the full dataset has been seeded. Usage
// (call these in order, each is safe to retry — everything's idempotent):
//
//   1. ?phase=taxonomy   → seeds categories/subcategories/tags/platforms/
//                          integrations/companies. Fast, one call.
//   2. ?phase=tools&offset=0             → seeds a batch of tools, returns
//                                          "nextUrl" if more remain — keep
//                                          following it until nextUrl is null.
//   3. ?phase=collections → run once all tool batches are done (collections
//                          reference tools by slug).
//
// Every response includes exact counts — no need to read Vercel logs.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.ADMIN_SESSION_SECRET;
  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phase = req.nextUrl.searchParams.get("phase") ?? "taxonomy";

  try {
    if (phase === "taxonomy") {
      const result = await seedTaxonomyAndCompanies();
      invalidatePublicCaches();
      return NextResponse.json({
        success: true,
        phase: "taxonomy",
        result,
        next: `?secret=${secret}&phase=tools&offset=0`,
      });
    }

    if (phase === "tools") {
      const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
      const limit = Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_BATCH_SIZE);
      const result = await seedToolsBatch(offset, limit);
      invalidatePublicCaches();

      return NextResponse.json({
        success: true,
        phase: "tools",
        batch: { offset, limit },
        result,
        done: result.nextOffset === null,
        next:
          result.nextOffset !== null
            ? `?secret=${secret}&phase=tools&offset=${result.nextOffset}`
            : `?secret=${secret}&phase=collections`,
      });
    }

    if (phase === "collections") {
      const result = await seedCollections();
      invalidatePublicCaches();
      return NextResponse.json({ success: true, phase: "collections", result, done: true });
    }

    return NextResponse.json({ error: `Unknown phase "${phase}"` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, phase, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}