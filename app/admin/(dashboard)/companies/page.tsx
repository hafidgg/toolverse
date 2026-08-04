import { prisma } from "@/lib/db/client";
import { createCompanyFromForm, deleteCompanyFromForm } from "@/actions/admin/company-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  _count: { tools: number };
}

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  const columns: Column<CompanyRow>[] = [
    { header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
    { header: "Slug", cell: (c) => <code className="text-xs">{c.slug}</code> },
    { header: "Country", cell: (c) => c.country ?? "—" },
    { header: "Tools", cell: (c) => c._count.tools },
    {
      header: "",
      cell: (c) => (
        <form action={deleteCompanyFromForm}>
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
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">{companies.length} companies</p>
        <div className="mt-6">
          <DataTable columns={columns} rows={companies} getRowId={(c) => c.id} emptyTitle="No companies yet" />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add Company</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCompanyFromForm} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
            <div>
              <Label htmlFor="websiteUrl">Website</Label>
              <Input id="websiteUrl" name="websiteUrl" />
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" name="logoUrl" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" />
            </div>
            <div>
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input id="foundedYear" name="foundedYear" type="number" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
