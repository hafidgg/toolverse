import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo/metadata";
import { ToolCard } from "@/components/shared/tool-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const revalidate = 3600;

async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug, isActive: true },
    include: {
      seo: true,
      tools: {
        orderBy: { order: "asc" },
        include: { tool: { include: { category: true } } },
      },
    },
  });
}

export async function generateStaticParams() {
  const collections = await prisma.collection.findMany({ where: { isActive: true }, select: { slug: true } });
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return buildMetadata({ path: `/collections/${slug}`, noindex: true });
  return buildMetadata({
    path: `/collections/${slug}`,
    title: collection.seo?.metaTitle ?? collection.title,
    description: collection.seo?.metaDescription ?? collection.description,
    image: collection.coverImage,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: collection.title, path: `/collections/${collection.slug}` },
  ]);

  return (
    <main className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Collections", href: "/collections" },
          { name: collection.title },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{collection.title}</h1>
      {collection.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{collection.description}</p>
      )}

      <div className="mt-8">
        {collection.tools.length === 0 ? (
          <EmptyState title="This collection is empty" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collection.tools.map((entry) => (
              <ToolCard key={entry.toolId} tool={entry.tool} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
