import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  path: "/categories",
  title: "Categories",
  description: "Browse tools by category on ToolVerse.",
});

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
      <p className="mt-2 text-muted-foreground">Explore tools organized by category.</p>

      {categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No categories yet" description="Add categories from the admin panel." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="rounded-xl border p-5 transition-colors hover:border-primary hover:bg-accent/40"
            >
              <h2 className="font-semibold">{cat.name}</h2>
              {cat.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
              )}
              <p className="mt-3 text-xs font-medium text-primary">{cat._count.tools} tools</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
