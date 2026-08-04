"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBlogPost, updateBlogPost, type BlogPostInput } from "@/actions/admin/content-actions";
import { useToast } from "@/hooks/use-toast";

interface Option {
  id: string;
  name: string;
}

export function BlogPostForm({
  postId,
  defaultValues,
  categories,
}: {
  postId?: string;
  defaultValues?: Partial<BlogPostInput>;
  categories: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<BlogPostInput>({
    title: defaultValues?.title ?? "",
    slug: defaultValues?.slug ?? "",
    excerpt: defaultValues?.excerpt ?? "",
    content: defaultValues?.content ?? "",
    featuredImage: defaultValues?.featuredImage ?? "",
    categoryId: defaultValues?.categoryId,
    status: defaultValues?.status ?? "DRAFT",
    metaTitle: defaultValues?.metaTitle ?? "",
    metaDescription: defaultValues?.metaDescription ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (postId) {
          await updateBlogPost(postId, form);
          toast({ title: "Post updated" });
        } else {
          const result = await createBlogPost(form);
          toast({ title: "Post created" });
          router.push(`/admin/blog/${result.postId}`);
          return;
        }
        router.refresh();
      } catch (err) {
        toast({ title: "Error saving post", description: String(err), variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
      </div>

      <div>
        <Label htmlFor="featuredImage">Featured Image URL</Label>
        <Input id="featuredImage" value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} />
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          value={form.categoryId ?? ""}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value || undefined })}
          className="h-10 w-full rounded-md border px-3 text-sm"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="content">Content (Markdown)</Label>
        <Textarea
          id="content"
          rows={16}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as BlogPostInput["status"] })}
          className="h-10 w-full rounded-md border px-3 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input id="metaTitle" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={70} />
        </div>
        <div>
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Input id="metaDescription" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={160} />
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : postId ? "Save changes" : "Create post"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
