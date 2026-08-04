import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ToolRowActions } from "./tool-row-actions";

export const dynamic = "force-dynamic";

interface ToolRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  category: { name: string };
  updatedAt: Date;
}

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const tools = await prisma.tool.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { category: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const columns: Column<ToolRow>[] = [
    { header: "Name", cell: (t) => <span className="font-medium">{t.name}</span> },
    { header: "Category", cell: (t) => t.category.name },
    {
      header: "Status",
      cell: (t) => (
        <Badge variant={t.status === "PUBLISHED" ? "success" : t.status === "DRAFT" ? "secondary" : "outline"}>
          {t.status}
        </Badge>
      ),
    },
    { header: "Featured", cell: (t) => (t.isFeatured ? "Yes" : "—") },
    { header: "Updated", cell: (t) => new Date(t.updatedAt).toLocaleDateString() },
    { header: "", cell: (t) => <ToolRowActions toolId={t.id} slug={t.slug} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tools.length} tools</p>
        </div>
        <Button asChild>
          <Link href="/admin/tools/new">
            <Plus className="mr-2 h-4 w-4" /> New Tool
          </Link>
        </Button>
      </div>

      <form className="mt-6 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tools…"
          className="h-10 w-full rounded-md border px-3 text-sm"
        />
      </form>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={tools}
          getRowId={(t) => t.id}
          emptyTitle="No tools yet"
          emptyDescription="Create your first tool to get started."
        />
      </div>
    </div>
  );
}
