import { prisma } from "@/lib/db/client";
import { createSubcategoryFromForm, deleteSubcategoryFromForm } from "@/actions/admin/taxonomy-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  category: { name: string };
}

export default async function AdminSubcategoriesPage() {
  const [subcategories, categories] = await Promise.all([
    prisma.subcategory.findMany({ orderBy: { name: "asc" }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const columns: Column<SubcategoryRow>[] = [
    { header: "Name", cell: (s) => <span className="font-medium">{s.name}</span> },
    { header: "Slug", cell: (s) => <code className="text-xs">{s.slug}</code> },
    { header: "Parent Category", cell: (s) => s.category.name },
    {
      header: "",
      cell: (s) => (
        <form action={deleteSubcategoryFromForm}>
          <input type="hidden" name="id" value={s.id} />
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
        <h1 className="text-2xl font-bold tracking-tight">Subcategories</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subcategories.length} subcategories</p>
        <div className="mt-6">
          <DataTable columns={columns} rows={subcategories} getRowId={(s) => s.id} emptyTitle="No subcategories yet" />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSubcategoryFromForm} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
            <div>
              <Label htmlFor="categoryId">Parent Category</Label>
              <select id="categoryId" name="categoryId" required className="h-10 w-full rounded-md border px-3 text-sm">
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
