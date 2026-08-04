import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import type { ToolStatus } from "@prisma/client";

const TOOL_PUBLIC_INCLUDE = {
  category: true,
  subcategory: true,
  company: true,
  tags: { include: { tag: true } },
  features: { orderBy: { order: "asc" as const } },
  pros: { orderBy: { order: "asc" as const } },
  cons: { orderBy: { order: "asc" as const } },
  screenshots: { orderBy: { order: "asc" as const } },
  pricingPlans: { orderBy: { order: "asc" as const } },
  platforms: { include: { platform: true } },
  faqs: { orderBy: { order: "asc" as const } },
  seo: true,
  alternativesFrom: {
    include: {
      alternative: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } },
    },
    orderBy: { order: "asc" as const },
  },
} as const;

export const getToolBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.tool.findUnique({
      where: { slug, status: "PUBLISHED" as ToolStatus },
      include: TOOL_PUBLIC_INCLUDE,
    });
  },
  ["tool-by-slug"],
  { revalidate: 3600, tags: ["tools"] }
);

export const getFeaturedTools = unstable_cache(
  async (limit = 12) => {
    return prisma.tool.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: { category: true, company: true },
      orderBy: { upvoteCount: "desc" },
      take: limit,
    });
  },
  ["featured-tools"],
  { revalidate: 3600, tags: ["tools"] }
);

export const getToolsByCategorySlug = unstable_cache(
  async (categorySlug: string, page = 1, pageSize = 24) => {
    return prisma.tool.findMany({
      where: { status: "PUBLISHED", category: { slug: categorySlug } },
      include: { category: true, company: true, tags: { include: { tag: true } } },
      orderBy: { upvoteCount: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },
  ["tools-by-category"],
  { revalidate: 1800, tags: ["tools"] }
);

export const getAllPublishedToolSlugs = unstable_cache(
  async () => {
    return prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
  },
  ["all-tool-slugs"],
  { revalidate: 86400, tags: ["tools"] }
);

export async function incrementToolClick(toolId: string) {
  return prisma.tool.update({
    where: { id: toolId },
    data: { clickCount: { increment: 1 } },
  });
}
