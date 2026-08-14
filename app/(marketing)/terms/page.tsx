import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: "The terms that govern your use of ToolVerse.",
});

export default function TermsPage() {
  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>

      <div className="prose prose-neutral mt-6 max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">What ToolVerse is</h2>
          <p>
            ToolVerse is an editorial directory of digital tools and software. We describe,
            categorize, and link to third-party products; we do not sell, host, or operate
            any of the tools listed here ourselves. By using this site, you agree to these
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">No warranty on listed tools</h2>
          <p>
            Listings are provided for informational purposes. We make a good-faith effort
            to keep names, official websites, categories, and general pricing model (free,
            freemium, paid, and so on) accurate, but pricing and features can change on the
            vendor&apos;s side faster than we can verify them. Always confirm current
            pricing and terms directly on the tool&apos;s own official website before making
            a purchasing decision, which is exactly why we link to it from every listing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Third-party websites</h2>
          <p>
            ToolVerse is not responsible for the content, security, pricing, or business
            practices of any third-party website you reach by clicking through from this
            site. Your use of any linked tool is governed entirely by that tool&apos;s own
            terms and privacy policy, not ours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Acceptable use</h2>
          <p>
            You agree not to use ToolVerse to scrape the site at a volume that degrades
            service for other visitors, attempt to bypass the site&apos;s security controls,
            or use the directory content to build a directly competing directory without
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">No visitor accounts, no user-submitted content</h2>
          <p>
            ToolVerse does not have visitor accounts, comments, reviews, or any other form
            of user-submitted public content. Everything published on the site is written
            and maintained by ToolVerse&apos;s own editorial team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Changes</h2>
          <p>
            We may update these terms as the site evolves. Continued use of ToolVerse after
            a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p>
            Questions about these terms can be sent via our{" "}
            <Link href="/contact" className="text-primary underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
