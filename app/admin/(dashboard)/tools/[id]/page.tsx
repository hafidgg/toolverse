import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { ToolForm } from "@/components/admin/tool-form";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [tool, categories, companies] = await Promise.all([
    prisma.tool.findUnique({
      where: { id },
      include: { tags: true, platforms: true, seo: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!tool) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Edit {tool.name}</h1>
      <div className="mt-6">
        <ToolForm
          toolId={tool.id}
          categories={categories}
          companies={companies}
          defaultValues={{
            name: tool.name,
            slug: tool.slug,
            tagline: tool.tagline ?? undefined,
            description: tool.description,
            longDescription: tool.longDescription ?? undefined,
            logoUrl: tool.logoUrl ?? undefined,
            websiteUrl: tool.websiteUrl,
            affiliateUrl: tool.affiliateUrl ?? undefined,
            pricingModel: tool.pricingModel,
            startingPrice: tool.startingPrice ? Number(tool.startingPrice) : undefined,
            currency: tool.currency ?? "USD",
            status: tool.status,
            isFeatured: tool.isFeatured,
            isVerified: tool.isVerified,
            categoryId: tool.categoryId,
            subcategoryId: tool.subcategoryId ?? undefined,
            companyId: tool.companyId ?? undefined,
            tagIds: tool.tags.map((t) => t.tagId),
            platformIds: tool.platforms.map((p) => p.platformId),
            metaTitle: tool.seo?.metaTitle ?? undefined,
            metaDescription: tool.seo?.metaDescription ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
