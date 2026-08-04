import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/terms",
  title: "Terms of Service",
});

export default function TermsPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          By using ToolVerse you agree to use the directory for lawful purposes only. Listings
          are provided for informational purposes; ToolVerse is not responsible for the products,
          pricing, or practices of third-party tools listed here.
        </p>
        <p>Replace this placeholder with your finalized terms before launch.</p>
      </div>
    </main>
  );
}
