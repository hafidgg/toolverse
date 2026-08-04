import { prisma } from "@/lib/db/client";
import { ToolForm } from "@/components/admin/tool-form";

export default async function NewToolPage() {
  const [categories, companies] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">New Tool</h1>
      <p className="mt-1 text-sm text-muted-foreground">Add a new tool to the directory.</p>
      <div className="mt-6">
        <ToolForm categories={categories} companies={companies} />
      </div>
    </div>
  );
}
