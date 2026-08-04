"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { toolFormSchema, type ToolFormInput } from "@/lib/validators/tool";

class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function createTool(input: ToolFormInput) {
  const admin = await requireAdmin();
  const data = toolFormSchema.parse(input);

  const tool = await prisma.tool.create({
    data: {
      name: data.name,
      slug: data.slug,
      tagline: data.tagline,
      description: data.description,
      longDescription: data.longDescription,
      logoUrl: data.logoUrl || null,
      websiteUrl: data.websiteUrl,
      affiliateUrl: data.affiliateUrl || null,
      pricingModel: data.pricingModel,
      startingPrice: data.startingPrice,
      currency: data.currency ?? "USD",
      status: data.status,
      isFeatured: data.isFeatured,
      isVerified: data.isVerified,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? undefined,
      companyId: data.companyId ?? undefined,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      platforms: { create: data.platformIds.map((platformId) => ({ platformId })) },
      seo: {
        create: {
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.adminId,
      action: "tool.create",
      entityType: "Tool",
      entityId: tool.id,
    },
  });

  revalidateTag("tools");
  revalidatePath("/admin/tools");
  revalidatePath("/tools");

  return { success: true, toolId: tool.id };
}

export async function updateTool(toolId: string, input: ToolFormInput) {
  const admin = await requireAdmin();
  const data = toolFormSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.tool.update({
      where: { id: toolId },
      data: {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline,
        description: data.description,
        longDescription: data.longDescription,
        logoUrl: data.logoUrl || null,
        websiteUrl: data.websiteUrl,
        affiliateUrl: data.affiliateUrl || null,
        pricingModel: data.pricingModel,
        startingPrice: data.startingPrice,
        currency: data.currency ?? "USD",
        status: data.status,
        isFeatured: data.isFeatured,
        isVerified: data.isVerified,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId ?? null,
        companyId: data.companyId ?? null,
      },
    });

    await tx.toolTag.deleteMany({ where: { toolId } });
    await tx.toolTag.createMany({
      data: data.tagIds.map((tagId) => ({ toolId, tagId })),
      skipDuplicates: true,
    });

    await tx.toolPlatform.deleteMany({ where: { toolId } });
    await tx.toolPlatform.createMany({
      data: data.platformIds.map((platformId) => ({ toolId, platformId })),
      skipDuplicates: true,
    });
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.adminId,
      action: "tool.update",
      entityType: "Tool",
      entityId: toolId,
    },
  });

  revalidateTag("tools");
  revalidatePath("/admin/tools");
  revalidatePath(`/tools/${data.slug}`);

  return { success: true };
}

export async function deleteTool(toolId: string) {
  const admin = await requireAdmin();

  await prisma.tool.delete({ where: { id: toolId } });

  await prisma.auditLog.create({
    data: {
      adminId: admin.adminId,
      action: "tool.delete",
      entityType: "Tool",
      entityId: toolId,
    },
  });

  revalidateTag("tools");
  revalidatePath("/admin/tools");

  return { success: true };
}
