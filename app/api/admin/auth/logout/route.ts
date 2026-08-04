import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        adminId: session.adminId,
        action: "admin.logout",
        entityType: "Admin",
        entityId: session.adminId,
      },
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
