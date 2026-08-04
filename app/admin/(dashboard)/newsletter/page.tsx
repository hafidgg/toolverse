import { prisma } from "@/lib/db/client";
import { deleteSubscriberFromForm } from "@/actions/admin/content-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface SubscriberRow {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: Date;
}

export default async function AdminNewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const columns: Column<SubscriberRow>[] = [
    { header: "Email", cell: (s) => s.email },
    {
      header: "Status",
      cell: (s) => (
        <Badge variant={s.status === "SUBSCRIBED" ? "success" : "secondary"}>{s.status}</Badge>
      ),
    },
    { header: "Source", cell: (s) => s.source ?? "—" },
    { header: "Joined", cell: (s) => new Date(s.createdAt).toLocaleDateString() },
    {
      header: "",
      cell: (s) => (
        <form action={deleteSubscriberFromForm}>
          <input type="hidden" name="id" value={s.id} />
          <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      ),
    },
  ];

  const subscribedCount = subscribers.filter((s) => s.status === "SUBSCRIBED").length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {subscribedCount} active subscribers · {subscribers.length} total
      </p>
      <div className="mt-6">
        <DataTable columns={columns} rows={subscribers} getRowId={(s) => s.id} emptyTitle="No subscribers yet" />
      </div>
    </div>
  );
}
