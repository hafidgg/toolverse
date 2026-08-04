import type { Metadata } from "next";
import { buildMetadata, organizationSchema, websiteSchema } from "@/lib/seo/metadata";
import { Toaster } from "@/components/shared/toaster";
import { AnalyticsScripts } from "@/components/shared/analytics-scripts";
import "@/styles/globals.css";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: "Discover the Best Digital Tools",
  description:
    "ToolVerse is a curated directory of the best digital tools and online resources — compare, filter, and find exactly what you need.",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <AnalyticsScripts />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
