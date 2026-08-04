import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: "About",
  description: "Learn about ToolVerse's mission to help you find the right digital tools.",
});

export default function AboutPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">About ToolVerse</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          ToolVerse is a curated directory built to help people find, compare, and choose the
          right digital tools without wading through noise. Every listing is reviewed before
          publication, and every category is organized to answer one question quickly: what&apos;s
          the best tool for this job?
        </p>
        <p>
          We don&apos;t run user accounts, comments, or reviews — just a focused, fast, and
          continuously updated catalog maintained by a single editorial team.
        </p>
      </div>
    </main>
  );
}
