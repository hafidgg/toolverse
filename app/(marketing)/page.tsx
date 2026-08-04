import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/shared/tool-card";
import { AdSlot } from "@/components/shared/ad-slot";
import { EmptyState } from "@/components/shared/empty-state";
import { prisma } from "@/lib/db/client";

export const revalidate = 1800;

async function getHomeData() {
  const [featured, trending, latest, categories] = await Promise.all([
    prisma.tool.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: { category: true },
      orderBy: { upvoteCount: "desc" },
      take: 8,
    }),
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { clickCount: "desc" },
      take: 8,
    }),
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      take: 10,
      include: { _count: { select: { tools: true } } },
    }),
  ]);
  return { featured, trending, latest, categories };
}

export default async function HomePage() {
  const { featured, trending, latest, categories } = await getHomeData();

  return (
    <main>
      <section className="border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="container flex flex-col items-center py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Curated & verified digital tools
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Find the right tool, faster.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            ToolVerse is a curated directory of the best digital tools — compare features,
            pricing, and alternatives in one place.
          </p>
          <form action="/search" className="mt-8 flex w-full max-w-lg gap-2">
            <input
              name="q"
              placeholder="Search 1,000+ tools…"
              className="h-12 flex-1 rounded-lg border bg-background px-4 text-sm shadow-sm"
            />
            <Button type="submit" size="lg" className="h-12">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="container py-8">
        <AdSlot label="Ad — Leaderboard" format="horizontal" />
      </section>

      {categories.length > 0 && (
        <section className="container py-10">
          <h2 className="text-2xl font-semibold">Browse by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-accent/50"
              >
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat._count.tools} tools</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container py-10">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="h-5 w-5 text-primary" /> Featured Tools
          </h2>
          <Link href="/tools?sort=popular" className="flex items-center gap-1 text-sm font-medium text-primary">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState title="No featured tools yet" description="Mark tools as featured from the admin panel." />
        )}
      </section>

      <section className="container py-10">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <TrendingUp className="h-5 w-5 text-primary" /> Trending
        </h2>
        {trending.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState title="No trending data yet" />
        )}
      </section>

      <section className="container py-10">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Clock className="h-5 w-5 text-primary" /> Latest Additions
        </h2>
        {latest.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState title="No tools published yet" description="Add your first tool from the admin panel." />
        )}
      </section>
    </main>
  );
}
