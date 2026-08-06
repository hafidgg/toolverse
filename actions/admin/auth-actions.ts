"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth/session";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function changePassword(input: ChangePasswordInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const data = changePasswordSchema.parse(input);

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) throw new Error("Admin not found");

  const validCurrent = await verifyPassword(data.currentPassword, admin.passwordHash);
  if (!validCurrent) {
    return { success: false, error: "Current password is incorrect" };
  }

  const newHash = await hashPassword(data.newPassword);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "admin.password_change",
      entityType: "Admin",
      entityId: admin.id,
    },
  });

  return { success: true };
}
