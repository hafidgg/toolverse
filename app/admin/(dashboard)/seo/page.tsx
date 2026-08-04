import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const [toolsMissingSeo, categoriesMissingSeo, postsMissingSeo, totalTools, totalPosts, totalCategories] =
    await Promise.all([
      prisma.tool.findMany({
        where: { status: "PUBLISHED", OR: [{ seo: null }, { seo: { metaDescription: null } }] },
        select: { id: true, name: true, slug: true },
        take: 50,
      }),
      prisma.category.findMany({
        where: { isActive: true, OR: [{ seo: null }, { seo: { metaDescription: null } }] },
        select: { id: true, name: true, slug: true },
        take: 50,
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", OR: [{ seo: null }, { seo: { metaDescription: null } }] },
        select: { id: true, title: true, slug: true },
        take: 50,
      }),
      prisma.tool.count({ where: { status: "PUBLISHED" } }),
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);

  type MissingItem = { id: string; name?: string; title?: string };

  const sections: {
    title: string;
    total: number;
    missing: MissingItem[];
    hrefFor: (id: string) => string;
    labelKey: "name" | "title";
  }[] = [
    {
      title: "Tools",
      total: totalTools,
      missing: toolsMissingSeo,
      hrefFor: (id: string) => `/admin/tools/${id}`,
      labelKey: "name",
    },
    {
      title: "Categories",
      total: totalCategories,
      missing: categoriesMissingSeo,
      hrefFor: () => `/admin/categories`,
      labelKey: "name",
    },
    {
      title: "Blog Posts",
      total: totalPosts,
      missing: postsMissingSeo,
      hrefFor: (id: string) => `/admin/blog/${id}`,
      labelKey: "title",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">SEO Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Entities missing a meta description are flagged below — filling these in improves search snippets.
      </p>

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <Badge variant={section.missing.length === 0 ? "success" : "outline"}>
                {section.total - section.missing.length}/{section.total} complete
              </Badge>
            </CardHeader>
            <CardContent>
              {section.missing.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> All items have meta descriptions.
                </p>
              ) : (
                <ul className="divide-y">
                  {section.missing.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        {item[section.labelKey]}
                      </span>
                      <Link href={section.hrefFor(item.id)} className="text-primary hover:underline">
                        Fix
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
