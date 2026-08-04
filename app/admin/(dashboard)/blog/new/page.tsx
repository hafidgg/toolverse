import { prisma } from "@/lib/db/client";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function NewBlogPostPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">New Blog Post</h1>
      <div className="mt-6">
        <BlogPostForm categories={categories} />
      </div>
    </div>
  );
}
