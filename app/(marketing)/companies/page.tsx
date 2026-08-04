import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  path: "/companies",
  title: "Companies",
  description: "Explore the companies behind the tools listed on ToolVerse.",
});

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
      <p className="mt-2 text-muted-foreground">Discover the makers behind ToolVerse&apos;s tools.</p>

      {companies.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No companies yet" />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/company/${company.slug}`}
              className="flex items-center gap-3 rounded-xl border p-5 transition-colors hover:border-primary hover:bg-accent/40"
            >
              {company.logoUrl ? (
                <Image src={company.logoUrl} alt={company.name} width={40} height={40} className="rounded-md" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-semibold">{company.name}</h2>
                <p className="text-xs text-muted-foreground">{company._count.tools} tools</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
