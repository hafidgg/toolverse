import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/cookies",
  title: "Cookie Policy",
  description: "Exactly which cookies ToolVerse sets, and why.",
});

export default function CookiesPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>

      <div className="prose prose-neutral mt-6 max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">Cookies we currently set</h2>
          <p>
            As a visitor browsing ToolVerse, we do not currently set any cookies on your
            device: no analytics cookies, no advertising cookies, no tracking cookies of any
            kind. Our usage analytics (see our{" "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            ) are logged server-side per request and do not rely on a cookie to identify
            you.
          </p>
          <p>
            The only cookie ToolVerse sets at all is a session cookie used exclusively when
            a ToolVerse administrator logs into the admin panel to manage the site&apos;s
            content. It is <code>httpOnly</code>, never accessible to visitor-facing pages,
            and is never set for ordinary visitors browsing the public site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">If we enable advertising or analytics</h2>
          <p>
            We do not currently run Google AdSense or Google Analytics on ToolVerse. If we
            enable either in the future, they would set their own cookies (Google&apos;s
            standard advertising and analytics cookies, documented directly by Google), and
            we will update this page to say so explicitly, with details on what those
            cookies do and how to opt out, before they go live, not after.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cookies set by third-party sites you visit</h2>
          <p>
            Once you click through from a ToolVerse listing to a tool&apos;s own website,
            any cookies you encounter there are set by that site, not by us, and are
            governed by that site&apos;s own cookie policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Controlling cookies</h2>
          <p>
            Since ToolVerse itself sets no visitor-facing cookies today, there is nothing to
            opt out of on this site specifically. Your browser&apos;s own settings let you
            block or delete cookies from any site, including ours, at any time.
          </p>
        </section>
      </div>
    </main>
  );
}
