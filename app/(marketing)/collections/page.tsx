import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  path: "/collections",
  title: "Collections",
  description: "Curated lists of the best tools for specific use cases.",
});

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tools: true } } },
  });

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
      <p className="mt-2 text-muted-foreground">Hand-picked lists of tools for specific goals.</p>

      {collections.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No collections yet" description="Create one from the admin panel." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="group overflow-hidden rounded-xl border transition-colors hover:border-primary"
            >
              <div className="relative h-32 w-full bg-muted">
                {c.coverImage && (
                  <Image src={c.coverImage} alt={c.title} fill className="object-cover" />
                )}
              </div>
              <div className="p-5">
                <h2 className="font-semibold group-hover:text-primary">{c.title}</h2>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-3 text-xs font-medium text-primary">{c._count.tools} tools</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
