import { after } from "next/server";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { safeStoredRedirect } from "@/lib/redirects";

export default async function CatchAllRedirectPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;

  const rule = await prisma.redirect.findUnique({ where: { fromPath: path, isActive: true } });
  if (!rule) notFound();

  // Re-validated at request time: rows saved before validation existed (or
  // written directly to the DB) must never become an open redirect.
  const destination = safeStoredRedirect(rule);
  if (!destination) notFound();

  // Counted after the response is sent; a failed update never blocks the redirect.
  const ruleId = rule.id;
  after(async () => {
    await prisma.redirect.update({ where: { id: ruleId }, data: { hitCount: { increment: 1 } } }).catch(() => {});
  });

  if (rule.type === "PERMANENT") {
    permanentRedirect(destination);
  } else {
    redirect(destination);
  }
}
