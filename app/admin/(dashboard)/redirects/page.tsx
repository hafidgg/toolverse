import { prisma } from "@/lib/db/client";
import { createRedirectFromForm, deleteRedirectFromForm } from "@/actions/admin/content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface RedirectRow {
  id: string;
  fromPath: string;
  toPath: string;
  type: string;
  hitCount: number;
}

export default async function AdminRedirectsPage() {
  const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });

  const columns: Column<RedirectRow>[] = [
    { header: "From", cell: (r) => <code className="text-xs">{r.fromPath}</code> },
    { header: "To", cell: (r) => <code className="text-xs">{r.toPath}</code> },
    { header: "Type", cell: (r) => r.type },
    { header: "Hits", cell: (r) => r.hitCount },
    {
      header: "",
      cell: (r) => (
        <form action={deleteRedirectFromForm}>
          <input type="hidden" name="id" value={r.id} />
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
        <h1 className="text-2xl font-bold tracking-tight">Redirects</h1>
        <p className="mt-1 text-sm text-muted-foreground">{redirects.length} redirect rules</p>
        <div className="mt-6">
          <DataTable columns={columns} rows={redirects} getRowId={(r) => r.id} emptyTitle="No redirects yet" />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add Redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRedirectFromForm} className="space-y-3">
            <div>
              <Label htmlFor="fromPath">From Path</Label>
              <Input id="fromPath" name="fromPath" placeholder="/old-url" required />
            </div>
            <div>
              <Label htmlFor="toPath">To Path</Label>
              <Input id="toPath" name="toPath" placeholder="/new-url" required />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" className="h-10 w-full rounded-md border px-3 text-sm">
                <option value="PERMANENT">Permanent (301/308)</option>
                <option value="TEMPORARY">Temporary (302/307)</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
