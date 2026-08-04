import { prisma } from "@/lib/db/client";
import { createCategoryFromForm, deleteCategoryFromForm } from "@/actions/admin/taxonomy-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  _count: { tools: number };
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  const columns: Column<CategoryRow>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
    { header: "Slug", cell: (c) => <code className="text-xs">{c.slug}</code> },
    { header: "Tools", cell: (c) => c._count.tools },
    { header: "Featured", cell: (c) => (c.isFeatured ? "Yes" : "—") },
    {
      header: "",
      cell: (c) => (
        <form action={deleteCategoryFromForm}>
          <input type="hidden" name="id" value={c.id} />
          <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      ),
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">{categories.length} categories</p>
        <div className="mt-6">
          <DataTable columns={columns} rows={categories} getRowId={(c) => c.id} emptyTitle="No categories yet" />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryFromForm} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required placeholder="ai-tools" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" className="h-4 w-4 rounded border" />
              Featured
            </label>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
