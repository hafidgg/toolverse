import { notFound, redirect, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db/client";

export default async function CatchAllRedirectPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;

  const rule = await prisma.redirect.findUnique({ where: { fromPath: path, isActive: true } });

  if (!rule) notFound();

  await prisma.redirect.update({ where: { id: rule.id }, data: { hitCount: { increment: 1 } } });

  if (rule.type === "PERMANENT") {
    permanentRedirect(rule.toPath);
  } else {
    redirect(rule.toPath);
  }
}
