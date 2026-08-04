"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).regex(slugRegex),
  description: z.string().max(500).optional(),
  isFeatured: z.boolean().default(false),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export async function createCategory(input: CategoryInput) {
  await requireAdmin();
  const data = categorySchema.parse(input);
  await prisma.category.create({ data });
  revalidateTag("tools");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, input: CategoryInput) {
  await requireAdmin();
  const data = categorySchema.parse(input);
  await prisma.category.update({ where: { id }, data });
  revalidateTag("tools");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true };
}

const subcategorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).regex(slugRegex),
  categoryId: z.string().cuid(),
  description: z.string().max(500).optional(),
});

export type SubcategoryInput = z.infer<typeof subcategorySchema>;

export async function createSubcategory(input: SubcategoryInput) {
  await requireAdmin();
  const data = subcategorySchema.parse(input);
  await prisma.subcategory.create({ data });
  revalidatePath("/admin/subcategories");
  return { success: true };
}

export async function deleteSubcategory(id: string) {
  await requireAdmin();
  await prisma.subcategory.delete({ where: { id } });
  revalidatePath("/admin/subcategories");
  return { success: true };
}

const tagSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(80).regex(slugRegex),
});

export type TagInput = z.infer<typeof tagSchema>;

export async function createTag(input: TagInput) {
  await requireAdmin();
  const data = tagSchema.parse(input);
  await prisma.tag.create({ data });
  revalidatePath("/admin/tags");
  return { success: true };
}

export async function deleteTag(id: string) {
  await requireAdmin();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  return { success: true };
}

// ---------------------------------------------------------------------------
// FormData wrappers — for plain <form action={...}> usage without client JS
// ---------------------------------------------------------------------------

export async function createCategoryFromForm(formData: FormData) {
  await createCategory({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
  });
}

export async function deleteCategoryFromForm(formData: FormData) {
  await deleteCategory(String(formData.get("id")));
}

export async function createSubcategoryFromForm(formData: FormData) {
  await createSubcategory({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
  });
}

export async function deleteSubcategoryFromForm(formData: FormData) {
  await deleteSubcategory(String(formData.get("id")));
}

export async function createTagFromForm(formData: FormData) {
  await createTag({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  });
}

export async function deleteTagFromForm(formData: FormData) {
  await deleteTag(String(formData.get("id")));
}
