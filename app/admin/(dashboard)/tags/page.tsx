import { prisma } from "@/lib/db/client";
import { createTagFromForm, deleteTagFromForm } from "@/actions/admin/taxonomy-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  _count: { tools: number };
}

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  const columns: Column<TagRow>[] = [
    { header: "Name", cell: (t) => <span className="font-medium">{t.name}</span> },
    { header: "Slug", cell: (t) => <code className="text-xs">{t.slug}</code> },
    { header: "Tools", cell: (t) => t._count.tools },
    {
      header: "",
      cell: (t) => (
        <form action={deleteTagFromForm}>
          <input type="hidden" name="id" value={t.id} />
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
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tags.length} tags</p>
        <div className="mt-6">
          <DataTable columns={columns} rows={tags} getRowId={(t) => t.id} emptyTitle="No tags yet" />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTagFromForm} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
