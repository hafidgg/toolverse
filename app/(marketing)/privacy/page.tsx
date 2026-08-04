import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacy",
  title: "Privacy Policy",
});

export default function PrivacyPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          ToolVerse does not require visitor accounts and does not collect personal data beyond
          standard analytics (page views, referrers, approximate location) and, if you subscribe,
          your email address for the newsletter. We use cookies for essential site function and
          for advertising via Google AdSense. See our Cookie Policy for details.
        </p>
        <p>Replace this placeholder with your finalized, jurisdiction-appropriate privacy policy before launch.</p>
      </div>
    </main>
  );
}
