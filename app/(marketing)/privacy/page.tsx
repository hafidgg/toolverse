import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description: "What ToolVerse collects, why, and how you can control it.",
});

export default function PrivacyPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>

      <div className="prose prose-neutral mt-6 max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">No visitor accounts</h2>
          <p>
            ToolVerse does not require or offer visitor accounts. You can browse, search,
            and compare every tool on the site without registering or logging in. Only
            ToolVerse&apos;s own administrators authenticate, to manage the directory&apos;s
            content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">What we collect</h2>
          <p>We collect two kinds of data, both described below in full and nothing else.</p>
          <ul className="list-disc pl-6">
            <li>
              <strong>First-party usage analytics.</strong> When you view a page, click
              through to a tool&apos;s website, or run a search, we log that event (which
              page, which tool, the referring page, and a timestamp) to understand which
              tools and categories are useful to visitors. This data is not tied to a user
              account, since there are no visitor accounts, and is used in aggregate.
            </li>
            <li>
              <strong>Newsletter email address.</strong> If you choose to subscribe to our
              newsletter, we store the email address you provide, when you subscribed, and
              where on the site you subscribed from, so we can send you updates and let you
              unsubscribe at any time.
            </li>
          </ul>
          <p>
            We do not collect passwords, payment information, or government-issued IDs from
            visitors, since there is no visitor account system to require them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cookies</h2>
          <p>
            ToolVerse does not currently use Google Analytics or serve advertising, and does
            not set any tracking cookies for visitors. If we enable Google AdSense or
            Google Analytics in the future, this policy will be updated first to describe
            exactly what those services collect and the cookies they set. See our{" "}
            <Link href="/cookies" className="text-primary underline">
              Cookie Policy
            </Link>{" "}
            for the current, always-accurate state of this.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Third-party (external) links</h2>
          <p>
            Every tool listing links out to that tool&apos;s own official website. Once you
            click through, you are on a site we do not control, governed by that site&apos;s
            own privacy practices, which we encourage you to review independently. Outbound
            links carry a <code>rel=&quot;sponsored nofollow&quot;</code> attribute for
            search engines, a technical SEO signal rather than an indication that every link
            is a paid placement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Data retention and control</h2>
          <p>
            Analytics events are retained to inform which tools and categories to feature,
            with no fixed public retention schedule disclosed here. If you subscribed to
            the newsletter and want your email removed, contact us via the{" "}
            <Link href="/contact" className="text-primary underline">
              Contact page
            </Link>{" "}
            and we will remove it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Changes to this policy</h2>
          <p>
            If what we collect changes, for example if we enable AdSense or Analytics, we
            will update this page to reflect that before it takes effect, not after.
          </p>
        </section>
      </div>
    </main>
  );
}
