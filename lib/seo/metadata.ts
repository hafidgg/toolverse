import type { Metadata } from "next";

const SITE_NAME = "ToolVerse";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolverse.example.com";

export interface SeoInput {
  title?: string | null;
  description?: string | null;
  path: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}

export function buildMetadata(input: SeoInput): Metadata {
  const title = input.title ? `${input.title} | ${SITE_NAME}` : SITE_NAME;
  const description =
    input.description ??
    "Discover, compare, and choose the best digital tools and online resources.";
  const url = `${SITE_URL}${input.path}`;
  const image = input.image ?? `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    robots: {
      index: !input.noindex,
      follow: !input.noindex,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      type: input.type ?? "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function softwareApplicationSchema(tool: {
  name: string;
  description: string;
  slug: string;
  logoUrl?: string | null;
  pricingModel: string;
  startingPrice?: number | null;
  currency?: string | null;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/tools/${tool.slug}`,
    applicationCategory: tool.category,
    image: tool.logoUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: tool.startingPrice ?? 0,
      priceCurrency: tool.currency ?? "USD",
      category: tool.pricingModel,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Loose JSON-LD object shape used when combining multiple schema builders in one array. */
export type JsonLdSchema = Record<string, unknown>;

export { SITE_NAME, SITE_URL };
