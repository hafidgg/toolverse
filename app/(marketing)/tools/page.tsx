import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { ToolCard } from "@/components/shared/tool-card";
import { ToolGridSkeleton } from "@/components/shared/tool-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { AdSlot } from "@/components/shared/ad-slot";
import type { Prisma, PricingModel } from "@prisma/client";

export const metadata: Metadata = buildMetadata({
  path: "/tools",
  title: "All Tools",
  description: "Browse the full ToolVerse directory of digital tools and online resources.",
});

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    platform?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  }>;
}

async function ToolsResults({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.ToolWhereInput = { status: "PUBLISHED" };
  if (params.category) where.category = { slug: params.category };
  if (params.tag) where.tags = { some: { tag: { slug: params.tag } } };
  if (params.platform) where.platforms = { some: { platform: { slug: params.platform } } };
  if (params.pricing) where.pricingModel = params.pricing as PricingModel;

  const orderBy: Prisma.ToolOrderByWithRelationInput =
    params.sort === "newest"
      ? { publishedAt: "desc" }
      : params.sort === "az"
      ? { name: "asc" }
      : params.sort === "za"
      ? { name: "desc" }
      : { upvoteCount: "desc" };

  const [tools, total, categories] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tool.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/tools"
          className="rounded-full border px-3 py-1.5 text-sm data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          data-active={!params.category}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/tools?category=${cat.slug}`}
            className="rounded-full border px-3 py-1.5 text-sm hover:bg-accent"
            data-active={params.category === cat.slug}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {tools.length === 0 ? (
        <EmptyState
          title="No tools match these filters"
          description="Try removing a filter or search for something else."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{total} tools found</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/tools"
            searchParams={params}
          />
        </>
      )}
    </>
  );
}

export default function ToolsPage(props: PageProps) {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">All Tools</h1>
      <p className="mt-2 text-muted-foreground">
        Browse the full directory of curated digital tools and online resources.
      </p>

      <div className="my-8">
        <AdSlot label="Ad — Top Banner" format="horizontal" />
      </div>

      <Suspense fallback={<ToolGridSkeleton />}>
        <ToolsResults {...props} />
      </Suspense>
    </main>
  );
}
