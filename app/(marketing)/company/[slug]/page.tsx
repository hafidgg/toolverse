import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Globe, Twitter, Linkedin, Github } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { buildMetadata, breadcrumbSchema, toSafeJsonLd } from "@/lib/seo/metadata";
import { ToolCard } from "@/components/shared/tool-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const revalidate = 3600;

async function getCompany(slug: string) {
  return prisma.company.findUnique({
    where: { slug, isActive: true },
    include: {
      seo: true,
      tools: {
        where: { status: "PUBLISHED" },
        include: { category: true },
        orderBy: { upvoteCount: "desc" },
      },
    },
  });
}

export async function generateStaticParams() {
  const companies = await prisma.company.findMany({ where: { isActive: true }, select: { slug: true } });
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return buildMetadata({ path: `/company/${slug}`, noindex: true });
  return buildMetadata({
    path: `/company/${slug}`,
    title: company.seo?.metaTitle ?? company.name,
    description: company.seo?.metaDescription ?? company.description,
    image: company.logoUrl,
  });
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Companies", path: "/companies" },
    { name: company.name, path: `/company/${company.slug}` },
  ]);

  const socials = [
    { url: company.websiteUrl, icon: Globe, label: "Website" },
    { url: company.twitterUrl, icon: Twitter, label: "Twitter" },
    { url: company.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: company.githubUrl, icon: Github, label: "GitHub" },
  ].filter((s) => s.url);

  return (
    <main className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Companies", href: "/companies" },
          { name: company.name },
        ]}
      />

      <header className="mt-4 flex items-start gap-4">
        {company.logoUrl && (
          <Image src={company.logoUrl} alt={company.name} width={64} height={64} className="rounded-xl border" />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {company.country && <span>{company.country}</span>}
            {company.foundedYear && <span>Founded {company.foundedYear}</span>}
          </div>
        </div>
      </header>

      {company.description && (
        <p className="mt-6 max-w-2xl leading-7 text-muted-foreground">{company.description}</p>
      )}

      {socials.length > 0 && (
        <div className="mt-6 flex gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent"
            >
              <s.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Products by {company.name}</h2>
        {company.tools.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No published tools from this company yet" />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}