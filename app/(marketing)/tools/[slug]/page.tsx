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

const PRICING_LABELS: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  SUBSCRIPTION: "Subscription",
  ONE_TIME: "One-time purchase",
  OPEN_SOURCE: "Open Source",
  CONTACT_SALES: "Contact Sales",
};

// The tool-level starting price carries no billing cycle of its own, so only
// show "/mo" when a pricing plan at that exact price is explicitly monthly.
function startingPriceIsMonthly(
  startingPrice: number,
  plans: { price: unknown; billingCycle: string | null }[]
) {
  return plans.some(
    (plan) =>
      plan.price != null &&
      Number(plan.price) === startingPrice &&
      plan.billingCycle?.trim().toLowerCase() === "monthly"
  );
}

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

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium">
          {PRICING_LABELS[tool.pricingModel] ?? tool.pricingModel}
          {tool.startingPrice != null && (
            <span className="text-muted-foreground">
              {" "}
              — from {tool.currency ?? "USD"} {Number(tool.startingPrice).toFixed(0)}
              {startingPriceIsMonthly(Number(tool.startingPrice), tool.pricingPlans) ? "/mo" : ""}
            </span>
          )}
        </span>

        {tool.company && (
          <Link
            href={`/company/${tool.company.slug}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            By <span className="font-medium text-foreground">{tool.company.name}</span>
          </Link>
        )}

        <a
          href={tool.websiteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-muted-foreground hover:text-foreground"
        >
          {new URL(tool.websiteUrl).hostname.replace(/^www\./, "")} ↗
        </a>
      </div>

      {(tool.platforms.length > 0 || tool.integrations.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {tool.platforms.length > 0 && (
            <div>
              <span className="font-medium text-muted-foreground">Platforms: </span>
              {tool.platforms.map((p) => p.platform.name).join(", ")}
            </div>
          )}
          {tool.integrations.length > 0 && (
            <div>
              <span className="font-medium text-muted-foreground">Integrations: </span>
              {tool.integrations.map((i) => i.integration.name).join(", ")}
            </div>
          )}
        </div>
      )}

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

      {tool.pricingPlans.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Pricing Plans</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tool.pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg border p-4 ${plan.isPopular ? "border-primary" : ""}`}
              >
                <p className="font-semibold">{plan.name}</p>
                {plan.price != null && (
                  <p className="mt-1 text-2xl font-bold">
                    {plan.currency} {Number(plan.price).toFixed(0)}
                    {plan.billingCycle && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billingCycle}
                      </span>
                    )}
                  </p>
                )}
                {plan.features.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {plan.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
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
          rel="noopener noreferrer nofollow"
          className="inline-flex rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Visit {tool.name} →
        </a>
      </div>
    </main>
  );
}
