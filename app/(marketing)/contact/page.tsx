import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/db/client";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  path: "/contact",
  title: "Contact",
  description: "Get in touch with the ToolVerse team.",
});

export default async function ContactPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  const email = settings?.contactEmail || settings?.supportEmail;

  return (
    <main className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      {email ? (
        <p className="mt-4 text-muted-foreground">
          For tool submissions, partnerships, or corrections, reach us at{" "}
          <a href={`mailto:${email}`} className="text-primary underline">
            {email}
          </a>
          .
        </p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          A dedicated contact channel isn&apos;t set up yet. Please check back soon — in the
          meantime, feel free to reach out through any channels listed on our social
          profiles, once available.
        </p>
      )}
    </main>
  );
}
