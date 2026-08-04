import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata, breadcrumbSchema, faqSchema, type JsonLdSchema } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AdSlot } from "@/components/shared/ad-slot";

export const revalidate = 1800;

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      category: true,
      tags: { include: { tag: true } },
      faqs: { orderBy: { order: "asc" } },
      seo: true,
    },
  });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return buildMetadata({ path: `/blog/${slug}`, noindex: true });
  return buildMetadata({
    path: `/blog/${slug}`,
    title: post.seo?.metaTitle ?? post.title,
    description: post.seo?.metaDescription ?? post.excerpt,
    image: post.seo?.ogImage ?? post.featuredImage,
    type: "article",
  });
}

// Extracts h2/h3 headings from stored markdown-ish content for a simple TOC.
function extractHeadings(content: string) {
  const matches = [...content.matchAll(/^(#{2,3})\s+(.*)$/gm)];
  return matches
    .map((m) => {
      const hashes = m[1];
      const text = m[2];
      if (!hashes || !text) return null;
      return {
        level: hashes.length,
        text,
        id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);

  const jsonLd: JsonLdSchema[] = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];
  if (post.faqs.length > 0) {
    jsonLd.push(faqSchema(post.faqs.map((f) => ({ question: f.question, answer: f.answer }))));
  }

  return (
    <main className="container py-10">
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title },
        ]}
      />

      <article className="mt-4 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <header>
            {post.category && <span className="text-sm font-medium text-primary">{post.category.name}</span>}
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{post.author.name}</span>
              {post.readingTimeMins && <span>· {post.readingTimeMins} min read</span>}
              {post.publishedAt && (
                <span>· {new Date(post.publishedAt).toLocaleDateString()}</span>
              )}
            </div>
          </header>

          {post.featuredImage && (
            <div className="relative mt-6 h-72 w-full overflow-hidden rounded-xl bg-muted">
              <Image src={post.featuredImage} alt={post.title} fill className="object-cover" priority />
            </div>
          )}

          <div className="prose prose-neutral mt-8 max-w-none">
            {post.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t.tagId} className="rounded-full border px-3 py-1 text-xs">
                  #{t.tag.name}
                </span>
              ))}
            </div>
          )}

          {post.faqs.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">FAQ</h2>
              <div className="mt-4 divide-y">
                {post.faqs.map((faq) => (
                  <details key={faq.id} className="py-4">
                    <summary className="cursor-pointer font-medium">{faq.question}</summary>
                    <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {headings.length > 0 && (
            <div className="rounded-xl border p-5">
              <h2 className="text-sm font-semibold">Table of Contents</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                    <a href={`#${h.id}`} className="text-muted-foreground hover:text-foreground">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AdSlot label="Ad — Sidebar" format="square" />
        </aside>
      </article>
    </main>
  );
}
