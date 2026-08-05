import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";

// TEMPORARY route: lets you run the initial database seed from Vercel's own
// servers (which can reach the database) instead of a local machine that
// can't. Gated by ADMIN_SESSION_SECRET as a shared secret via query param.
//
// Delete this file and redeploy once you've successfully seeded — it's not
// something that should stay in a production app long-term, even though it's
// secret-gated and every operation here is idempotent (safe to re-run).
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@toolverse.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@toolverse.local",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.settings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      siteName: "ToolVerse",
      siteDescription: "Discover the best digital tools and online resources.",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolverse.example.com",
    },
  });

  const platforms = ["Web", "iOS", "Android", "Windows", "macOS", "Linux", "API"];
  for (const name of platforms) {
    await prisma.platform.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  const category = await prisma.category.upsert({
    where: { slug: "ai-tools" },
    update: {},
    create: {
      name: "AI Tools",
      slug: "ai-tools",
      description: "Artificial intelligence powered tools and platforms.",
      isFeatured: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Seed complete. Log in with admin@toolverse.local / ChangeMe123! and change the password immediately.",
    adminId: admin.id,
    categorySlug: category.slug,
  });
}