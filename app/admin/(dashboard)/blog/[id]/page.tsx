import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id }, include: { seo: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Edit {post.title}</h1>
      <div className="mt-6">
        <BlogPostForm
          postId={post.id}
          categories={categories}
          defaultValues={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? undefined,
            content: post.content,
            featuredImage: post.featuredImage ?? undefined,
            categoryId: post.categoryId ?? undefined,
            status: post.status,
            metaTitle: post.seo?.metaTitle ?? undefined,
            metaDescription: post.seo?.metaDescription ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
