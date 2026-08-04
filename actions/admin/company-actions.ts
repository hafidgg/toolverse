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

const companySchema = z.object({
  name: z.string().min(2).max(140),
  slug: z.string().min(2).max(160).regex(slugRegex),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  foundedYear: z.coerce.number().int().min(1900).max(2100).optional(),
  country: z.string().max(80).optional(),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companySchema>;

export async function createCompany(input: CompanyInput) {
  await requireAdmin();
  const data = companySchema.parse(input);
  await prisma.company.create({
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      websiteUrl: data.websiteUrl || null,
      twitterUrl: data.twitterUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      githubUrl: data.githubUrl || null,
    },
  });
  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  return { success: true };
}

export async function updateCompany(id: string, input: CompanyInput) {
  await requireAdmin();
  const data = companySchema.parse(input);
  await prisma.company.update({
    where: { id },
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      websiteUrl: data.websiteUrl || null,
      twitterUrl: data.twitterUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      githubUrl: data.githubUrl || null,
    },
  });
  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  return { success: true };
}

export async function deleteCompany(id: string) {
  await requireAdmin();
  await prisma.company.delete({ where: { id } });
  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  return { success: true };
}

export async function createCompanyFromForm(formData: FormData) {
  await createCompany({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    logoUrl: String(formData.get("logoUrl") ?? "") || undefined,
    websiteUrl: String(formData.get("websiteUrl") ?? "") || undefined,
    country: String(formData.get("country") ?? "") || undefined,
    foundedYear: formData.get("foundedYear") ? Number(formData.get("foundedYear")) : undefined,
  });
}

export async function deleteCompanyFromForm(formData: FormData) {
  await deleteCompany(String(formData.get("id")));
}
