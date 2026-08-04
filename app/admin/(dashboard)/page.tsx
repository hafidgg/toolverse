import { Wrench, FolderTree, FileText, Users, Eye, MousePointerClick } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [toolCount, categoryCount, postCount, subscriberCount, recentAudit, totalViews, totalClicks] =
    await Promise.all([
      prisma.tool.count(),
      prisma.category.count(),
      prisma.blogPost.count(),
      prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { admin: { select: { name: true } } },
      }),
      prisma.tool.aggregate({ _sum: { viewCount: true } }),
      prisma.tool.aggregate({ _sum: { clickCount: true } }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of ToolVerse content and activity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tools" value={toolCount} icon={Wrench} />
        <StatCard label="Categories" value={categoryCount} icon={FolderTree} />
        <StatCard label="Blog Posts" value={postCount} icon={FileText} />
        <StatCard label="Newsletter Subscribers" value={subscriberCount} icon={Users} />
        <StatCard label="Total Tool Views" value={totalViews._sum.viewCount ?? 0} icon={Eye} />
        <StatCard label="Total Outbound Clicks" value={totalClicks._sum.clickCount ?? 0} icon={MousePointerClick} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {recentAudit.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    <span className="font-medium">{log.admin.name}</span>{" "}
                    <span className="text-muted-foreground">{log.action}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
