import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

export const revalidate = 1800;
const PAGE_SIZE = 12;

export const metadata: Metadata = buildMetadata({
  path: "/blog",
  title: "Blog",
  description: "Guides, comparisons, and insights on the best digital tools.",
});

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, author: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">Guides, comparisons, and insights on the tools we cover.</p>

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No posts published yet" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-xl border">
                <div className="relative h-40 w-full bg-muted">
                  {post.featuredImage && (
                    <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  {post.category && (
                    <span className="text-xs font-medium text-primary">{post.category.name}</span>
                  )}
                  <h2 className="mt-1 font-semibold group-hover:text-primary">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author.name}</span>
                    {post.readingTimeMins && <span>· {post.readingTimeMins} min read</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
        </>
      )}
    </main>
  );
}
