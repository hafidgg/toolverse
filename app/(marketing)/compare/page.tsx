import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/shared/empty-state";
import { Scale } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  path: "/compare",
  title: "Compare Tools",
  description: "Compare digital tools side by side on features, pricing, and platforms.",
});

interface PageProps {
  searchParams: Promise<{ tools?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { tools: toolsParam } = await searchParams;
  const slugs = (toolsParam ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  const tools =
    slugs.length > 0
      ? await prisma.tool.findMany({
          where: { slug: { in: slugs }, status: "PUBLISHED" },
          include: {
            category: true,
            features: { orderBy: { order: "asc" } },
            platforms: { include: { platform: true } },
          },
        })
      : [];

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Compare Tools</h1>
      <p className="mt-2 text-muted-foreground">
        Add tool slugs to the URL to compare, e.g. <code>/compare?tools=tool-a,tool-b</code>
      </p>

      {tools.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Scale}
            title="No tools selected"
            description="Pick up to 4 tools from any tool page to compare them here."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b p-3 font-medium text-muted-foreground">Tool</th>
                {tools.map((t) => (
                  <th key={t.id} className="border-b p-3 font-semibold">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b p-3 text-muted-foreground">Category</td>
                {tools.map((t) => (
                  <td key={t.id} className="border-b p-3">
                    {t.category.name}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-b p-3 text-muted-foreground">Pricing</td>
                {tools.map((t) => (
                  <td key={t.id} className="border-b p-3">
                    {t.pricingModel}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-b p-3 text-muted-foreground">Platforms</td>
                {tools.map((t) => (
                  <td key={t.id} className="border-b p-3">
                    {t.platforms.map((p) => p.platform.name).join(", ") || "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 align-top text-muted-foreground">Key Features</td>
                {tools.map((t) => (
                  <td key={t.id} className="p-3 align-top">
                    <ul className="list-disc space-y-1 pl-4">
                      {t.features.slice(0, 5).map((f) => (
                        <li key={f.id}>{f.title}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
