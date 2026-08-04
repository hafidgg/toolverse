import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo/metadata";
import { ToolCard } from "@/components/shared/tool-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const revalidate = 1800;
const PAGE_SIZE = 24;

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug, isActive: true }, include: { seo: true } });
}

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return buildMetadata({ path: `/categories/${slug}`, noindex: true });
  return buildMetadata({
    path: `/categories/${slug}`,
    title: category.seo?.metaTitle ?? `Best ${category.name} Tools`,
    description: category.seo?.metaDescription ?? category.description,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where: { status: "PUBLISHED", categoryId: category.id },
      include: { category: true },
      orderBy: { upvoteCount: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tool.count({ where: { status: "PUBLISHED", categoryId: category.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: category.name, path: `/categories/${category.slug}` },
  ]);

  return (
    <main className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Categories", href: "/categories" },
          { name: category.name },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Best {category.name} Tools</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
      )}

      <div className="mt-8">
        {tools.length === 0 ? (
          <EmptyState title="No tools in this category yet" />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{total} tools</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} basePath={`/categories/${slug}`} />
          </>
        )}
      </div>
    </main>
  );
}
