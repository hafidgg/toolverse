"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const collectionSchema = z.object({
  title: z.string().min(2).max(140),
  slug: z.string().min(2).max(160).regex(slugRegex),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

export async function createCollection(input: CollectionInput) {
  await requireAdmin();
  const data = collectionSchema.parse(input);
  await prisma.collection.create({ data: { ...data, coverImage: data.coverImage || null } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

export async function deleteCollection(id: string) {
  await requireAdmin();
  await prisma.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

export async function addToolToCollection(collectionId: string, toolId: string) {
  await requireAdmin();
  await prisma.collectionTool.create({ data: { collectionId, toolId } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

export async function removeToolFromCollection(collectionId: string, toolId: string) {
  await requireAdmin();
  await prisma.collectionTool.delete({ where: { collectionId_toolId: { collectionId, toolId } } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

const blogPostSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(slugRegex),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(20),
  featuredImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().cuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function createBlogPost(input: BlogPostInput) {
  const session = await requireAdmin();
  const data = blogPostSchema.parse(input);

  // Create the SEO row first (if any metadata was provided), then link it via
  // the scalar `seoId` FK. This keeps the BlogPost `create` call fully in the
  // "Unchecked" input style (consistent with passing `authorId`/`categoryId`
  // as scalars) — mixing scalar FKs with a nested `seo: { create }` on the
  // same call is a type error, since Prisma resolves to a single input
  // variant per call.
  let seoId: string | undefined;
  if (data.metaTitle || data.metaDescription) {
    const seo = await prisma.seo.create({
      data: { metaTitle: data.metaTitle, metaDescription: data.metaDescription },
    });
    seoId = seo.id;
  }

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage || null,
      categoryId: data.categoryId,
      status: data.status,
      readingTimeMins: estimateReadingTime(data.content),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      authorId: session.adminId,
      seoId,
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true, postId: post.id };
}

export async function updateBlogPost(id: string, input: BlogPostInput) {
  await requireAdmin();
  const data = blogPostSchema.parse(input);

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { seoId: true },
  });

  // Upsert the SEO row: create one if the post never had one and metadata was
  // provided now, otherwise update the existing row in place. Kept as a
  // separate step for the same reason as createBlogPost — a scalar `seoId`
  // FK and a nested `seo` write can't be mixed in a single Unchecked call.
  let seoId = existing?.seoId ?? undefined;
  if (data.metaTitle || data.metaDescription) {
    if (seoId) {
      await prisma.seo.update({
        where: { id: seoId },
        data: { metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      });
    } else {
      const seo = await prisma.seo.create({
        data: { metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      });
      seoId = seo.id;
    }
  }

  await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage || null,
      categoryId: data.categoryId,
      status: data.status,
      readingTimeMins: estimateReadingTime(data.content),
      seoId,
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function deleteSubscriber(id: string) {
  await requireAdmin();
  await prisma.newsletterSubscriber.delete({ where: { id } });
  revalidatePath("/admin/newsletter");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

const redirectSchema = z.object({
  fromPath: z.string().min(1).max(300).startsWith("/"),
  toPath: z.string().min(1).max(300),
  type: z.enum(["PERMANENT", "TEMPORARY"]),
});

export type RedirectInput = z.infer<typeof redirectSchema>;

export async function createRedirect(input: RedirectInput) {
  await requireAdmin();
  const data = redirectSchema.parse(input);
  await prisma.redirect.create({ data });
  revalidatePath("/admin/redirects");
  return { success: true };
}

export async function deleteRedirect(id: string) {
  await requireAdmin();
  await prisma.redirect.delete({ where: { id } });
  revalidatePath("/admin/redirects");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Settings (singleton)
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(300).optional(),
  siteUrl: z.string().url().optional(),
  defaultMetaTitle: z.string().max(70).optional(),
  defaultMetaDescription: z.string().max(160).optional(),
  googleAnalyticsId: z.string().max(50).optional(),
  googleSearchConsoleId: z.string().max(100).optional(),
  adsenseClientId: z.string().max(50).optional(),
  adsensePubId: z.string().max(50).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  maintenanceMode: z.boolean().default(false),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettings(input: SettingsInput) {
  await requireAdmin();
  const data = settingsSchema.parse(input);
  await prisma.settings.upsert({
    where: { id: "global" },
    create: { id: "global", ...data },
    update: data,
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

// ---------------------------------------------------------------------------
// FormData wrappers
// ---------------------------------------------------------------------------

export async function createCollectionFromForm(formData: FormData) {
  await createCollection({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    coverImage: String(formData.get("coverImage") ?? "") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
  });
}

export async function deleteCollectionFromForm(formData: FormData) {
  await deleteCollection(String(formData.get("id")));
}

export async function addToolToCollectionFromForm(formData: FormData) {
  await addToolToCollection(String(formData.get("collectionId")), String(formData.get("toolId")));
}

export async function createRedirectFromForm(formData: FormData) {
  await createRedirect({
    fromPath: String(formData.get("fromPath") ?? ""),
    toPath: String(formData.get("toPath") ?? ""),
    type: (formData.get("type") as "PERMANENT" | "TEMPORARY") ?? "PERMANENT",
  });
}

export async function deleteRedirectFromForm(formData: FormData) {
  await deleteRedirect(String(formData.get("id")));
}

export async function deleteSubscriberFromForm(formData: FormData) {
  await deleteSubscriber(String(formData.get("id")));
}

export async function updateSettingsFromForm(formData: FormData) {
  await updateSettings({
    siteName: String(formData.get("siteName") ?? "ToolVerse"),
    siteDescription: String(formData.get("siteDescription") ?? "") || undefined,
    siteUrl: String(formData.get("siteUrl") ?? "") || undefined,
    defaultMetaTitle: String(formData.get("defaultMetaTitle") ?? "") || undefined,
    defaultMetaDescription: String(formData.get("defaultMetaDescription") ?? "") || undefined,
    googleAnalyticsId: String(formData.get("googleAnalyticsId") ?? "") || undefined,
    googleSearchConsoleId: String(formData.get("googleSearchConsoleId") ?? "") || undefined,
    adsenseClientId: String(formData.get("adsenseClientId") ?? "") || undefined,
    adsensePubId: String(formData.get("adsensePubId") ?? "") || undefined,
    contactEmail: String(formData.get("contactEmail") ?? "") || undefined,
    maintenanceMode: formData.get("maintenanceMode") === "on",
  });
}