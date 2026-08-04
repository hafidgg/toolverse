"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { uploadImage, deleteImage } from "@/lib/cloudinary/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];

export async function uploadMedia(formData: FormData) {
  const session = await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Unsupported file type");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 8MB)");

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await uploadImage(dataUri, "toolverse");

  const media = await prisma.media.create({
    data: {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      type: "IMAGE",
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      folder: "toolverse",
      uploadedByAdminId: session.adminId,
    },
  });

  revalidatePath("/admin/media");
  return { success: true, media };
}

export async function deleteMedia(id: string) {
  await requireAdmin();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Not found");

  await deleteImage(media.publicId);
  await prisma.media.delete({ where: { id } });

  revalidatePath("/admin/media");
  return { success: true };
}
