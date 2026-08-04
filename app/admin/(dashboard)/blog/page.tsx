import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { deleteBlogPost } from "@/actions/admin/content-actions";

export const dynamic = "force-dynamic";

interface PostRow {
  id: string;
  title: string;
  status: string;
  author: { name: string };
  updatedAt: Date;
}

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  const columns: Column<PostRow>[] = [
    { header: "Title", cell: (p) => <span className="font-medium">{p.title}</span> },
    { header: "Author", cell: (p) => p.author.name },
    {
      header: "Status",
      cell: (p) => (
        <Badge variant={p.status === "PUBLISHED" ? "success" : "secondary"}>{p.status}</Badge>
      ),
    },
    { header: "Updated", cell: (p) => new Date(p.updatedAt).toLocaleDateString() },
    {
      header: "",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/blog/${p.id}`}>Edit</Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await deleteBlogPost(p.id);
            }}
          >
            <Button variant="ghost" size="sm" type="submit" className="text-destructive">
              Delete
            </Button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">{posts.length} posts</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>
      <div className="mt-6">
        <DataTable columns={columns} rows={posts} getRowId={(p) => p.id} emptyTitle="No posts yet" />
      </div>
    </div>
  );
}
