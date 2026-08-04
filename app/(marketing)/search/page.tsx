import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { ToolCard } from "@/components/shared/tool-card";
import { ToolGridSkeleton } from "@/components/shared/tool-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Search as SearchIcon } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  path: "/search",
  title: "Search Tools",
  noindex: true,
});

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

async function SearchResults({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  if (!query) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="Start typing to search"
        description="Search by tool name, description, or category."
      />
    );
  }

  const where = {
    status: "PUBLISHED" as const,
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { tagline: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
      { tags: { some: { tag: { name: { contains: query, mode: "insensitive" as const } } } } },
    ],
  };

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: { category: true },
      orderBy: { upvoteCount: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tool.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (tools.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title={`No results for "${query}"`}
        description="Try a different keyword or browse categories instead."
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {total} results for &quot;{query}&quot;
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} basePath="/search" searchParams={{ q: query }} />
    </>
  );
}

export default function SearchPage(props: PageProps) {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <form action="/search" className="mt-6 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue=""
          placeholder="Search tools…"
          className="h-11 flex-1 rounded-lg border bg-background px-4 text-sm"
        />
        <button className="rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>

      <div className="mt-8">
        <Suspense fallback={<ToolGridSkeleton />}>
          <SearchResults {...props} />
        </Suspense>
      </div>
    </main>
  );
}
