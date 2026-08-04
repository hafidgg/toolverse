import { prisma } from "@/lib/db/client";
import {
  createCollectionFromForm,
  deleteCollectionFromForm,
  addToolToCollectionFromForm,
  removeToolFromCollection,
} from "@/actions/admin/content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const [collections, tools] = await Promise.all([
    prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: { tools: { include: { tool: { select: { id: true, name: true } } } } },
    }),
    prisma.tool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">{collections.length} collections</p>

        <div className="mt-6 space-y-6">
          {collections.map((collection) => (
            <Card key={collection.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{collection.title}</CardTitle>
                <form action={deleteCollectionFromForm}>
                  <input type="hidden" name="id" value={collection.id} />
                  <Button variant="ghost" size="icon" type="submit" aria-label="Delete collection">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {collection.tools.map((entry) => (
                    <li key={entry.toolId} className="flex items-center justify-between py-2 text-sm">
                      {entry.tool.name}
                      <form
                        action={async () => {
                          "use server";
                          await removeToolFromCollection(collection.id, entry.toolId);
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">Remove</Button>
                      </form>
                    </li>
                  ))}
                  {collection.tools.length === 0 && (
                    <li className="py-2 text-sm text-muted-foreground">No tools added yet.</li>
                  )}
                </ul>
                <form action={addToolToCollectionFromForm} className="mt-3 flex gap-2">
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <select name="toolId" required className="h-9 flex-1 rounded-md border px-2 text-sm">
                    <option value="">Add tool…</option>
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">New Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCollectionFromForm} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input id="coverImage" name="coverImage" />
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
