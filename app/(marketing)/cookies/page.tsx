import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/cookies",
  title: "Cookie Policy",
});

export default function CookiesPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          ToolVerse uses essential cookies for site functionality and, where enabled, advertising
          cookies via Google AdSense to serve relevant ads. You can control cookies through your
          browser settings.
        </p>
        <p>Replace this placeholder with your finalized cookie policy before launch.</p>
      </div>
    </main>
  );
}
