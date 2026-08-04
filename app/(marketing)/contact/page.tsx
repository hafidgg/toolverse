import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/contact",
  title: "Contact",
  description: "Get in touch with the ToolVerse team.",
});

export default function ContactPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        For tool submissions, partnerships, or corrections, reach us at{" "}
        <a href="mailto:hello@toolverse.example.com" className="text-primary underline">
          hello@toolverse.example.com
        </a>
        .
      </p>
    </main>
  );
}
