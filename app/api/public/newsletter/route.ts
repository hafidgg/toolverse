import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/client";

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const { email, source } = parsed.data;

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    if (existing.status === "SUBSCRIBED") {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: "SUBSCRIBED", subscribedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email,
      status: "SUBSCRIBED",
      subscribedAt: new Date(),
      confirmToken: nanoid(32),
      unsubscribeToken: nanoid(32),
      source: source ?? "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
