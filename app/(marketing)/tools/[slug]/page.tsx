import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildMetadata,
  breadcrumbSchema,
  softwareApplicationSchema,
  faqSchema,
  toSafeJsonLd,
  type JsonLdSchema,
} from "@/lib/seo/metadata";
import { getToolBySlug, getAllPublishedToolSlugs } from "@/services/tool-service";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const tools = await getAllPublishedToolSlugs();
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return buildMetadata({ path: `/tools/${slug}`, noindex: true });

  return buildMetadata({
    path: `/tools/${slug}`,
    title: tool.seo?.metaTitle ?? tool.name,
    description: tool.seo?.metaDescription ?? tool.description,
    image: tool.seo?.ogImage ?? tool.logoUrl,
    type: "article",
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const jsonLd: JsonLdSchema[] = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: tool.category.name, path: `/categories/${tool.category.slug}` },
      { name: tool.name, path: `/tools/${tool.slug}` },
    ]),
    softwareApplicationSchema({
      name: tool.name,
      description: tool.description,
      slug: tool.slug,
      logoUrl: tool.logoUrl,
      pricingModel: tool.pricingModel,
      startingPrice: tool.startingPrice ? Number(tool.startingPrice) : null,
      currency: tool.currency,
      category: tool.category.name,
    }),
  ];

  if (tool.faqs.length > 0) {
    jsonLd.push(
      faqSchema(tool.faqs.map((f) => ({ question: f.question, answer: f.answer })))
    );
  }

  return (
    <main className="container py-10">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toSafeJsonLd(schema) }}
        />
      ))}

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/">Home</Link> /{" "}
        <Link href={`/categories/${tool.category.slug}`}>{tool.category.name}</Link> /{" "}
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <header className="flex items-start gap-4">
        {tool.logoUrl && (
          <Image
            src={tool.logoUrl}
            alt={`${tool.name} logo`}
            width={72}
            height={72}
            className="rounded-xl border"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
          {tool.tagline && <p className="mt-1 text-muted-foreground">{tool.tagline}</p>}
        </div>
      </header>

      <section className="mt-6 max-w-3xl">
        <p className="text-base leading-7">{tool.description}</p>
      </section>

      {tool.features.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Features</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {tool.features.map((f) => (
              <li key={f.id} className="rounded-lg border p-4">
                <p className="font-medium">{f.title}</p>
                {f.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(tool.pros.length > 0 || tool.cons.length > 0) && (
        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-green-600">Pros</h2>
            <ul className="mt-3 space-y-2">
              {tool.pros.map((p) => (
                <li key={p.id}>+ {p.text}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-600">Cons</h2>
            <ul className="mt-3 space-y-2">
              {tool.cons.map((c) => (
                <li key={c.id}>- {c.text}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tool.alternativesFrom.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Alternatives to {tool.name}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {tool.alternativesFrom.map((alt) => (
              <Link
                key={alt.alternative.id}
                href={`/tools/${alt.alternative.slug}`}
                className="rounded-lg border p-4 hover:border-primary"
              >
                <p className="font-medium">{alt.alternative.name}</p>
                {alt.alternative.tagline && (
                  <p className="text-sm text-muted-foreground">{alt.alternative.tagline}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {tool.faqs.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <div className="mt-4 divide-y">
            {tool.faqs.map((faq) => (
              <details key={faq.id} className="py-4">
                <summary className="cursor-pointer font-medium">{faq.question}</summary>
                <p className="mt-2 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="ad-slot mt-12">Ad Slot — In-Content</div>

      <div className="mt-10">
        <a
          href={tool.websiteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="inline-flex rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Visit {tool.name} →
        </a>
      </div>
    </main>
  );
}