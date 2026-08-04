import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });

  // Constant-shape response to avoid user enumeration
  const genericError = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (!admin || !admin.isActive) {
    return genericError;
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);
  if (!validPassword) {
    return genericError;
  }

  const token = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  await setSessionCookie(token);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "admin.login",
      entityType: "Admin",
      entityId: admin.id,
      ipAddress: ip,
    },
  });

  return NextResponse.json({ success: true });
}
