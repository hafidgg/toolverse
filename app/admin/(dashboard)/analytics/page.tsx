import { prisma } from "@/lib/db/client";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, MousePointerClick, Search, TrendingUp } from "lucide-react";
import { AnalyticsChart } from "./analytics-chart";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [pageViews, outboundClicks, searches, topTools, dailyEvents] = await Promise.all([
    prisma.analyticsEvent.count({ where: { eventType: "page_view", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { eventType: "outbound_click", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { eventType: "search", createdAt: { gte: since } } }),
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { id: true, name: true, viewCount: true, clickCount: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { eventType: true, createdAt: true },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (const event of dailyEvents) {
    const day = event.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const chartData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last 30 days · first-party event tracking</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Page Views" value={pageViews} icon={Eye} />
        <StatCard label="Outbound Clicks" value={outboundClicks} icon={MousePointerClick} />
        <StatCard label="Searches" value={searches} icon={Search} />
        <StatCard label="Tracked Events" value={dailyEvents.length} icon={TrendingUp} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Events Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Top Tools by Views</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {topTools.map((tool, i) => (
              <li key={tool.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  {tool.name}
                </span>
                <span className="flex gap-4 text-muted-foreground">
                  <span>{tool.viewCount} views</span>
                  <span>{tool.clickCount} clicks</span>
                </span>
              </li>
            ))}
            {topTools.length === 0 && (
              <li className="py-2.5 text-sm text-muted-foreground">No data yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
