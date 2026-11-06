import { put, del } from "@vercel/blob";
import { hasDriveUserOAuth } from "@/lib/google/auth-sa";
import {
  deleteDriveFile,
  uploadRegistrationImage,
} from "@/lib/google/drive";
import type { ImageKind } from "@/lib/types";

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function getStorageMode(): "drive-oauth" | "blob" | "none" {
  if (hasDriveUserOAuth()) return "drive-oauth";
  if (hasBlobStorage()) return "blob";
  return "none";
}

export async function storeRegistrationImage(params: {
  academicYear: string;
  kind: ImageKind | "samples";
  label: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
  const mode = getStorageMode();

  if (mode === "drive-oauth") {
    return uploadRegistrationImage(params);
  }

  if (mode === "blob") {
    const name = `${Date.now()}_${params.label.replace(/\s+/g, "_")}.jpg`;
    const pathname = `moto/${params.academicYear || "general"}/${params.kind}/${name}`;
    const blob = await put(pathname, params.buffer, {
      access: "public",
      contentType: params.mimeType,
      addRandomSuffix: true,
    });
    return {
      fileId: `blob:${blob.pathname}`,
      fileName: name,
      fileUrl: blob.url,
    };
  }

  throw new Error(
    "อัปโหลดไฟล์ยังใช้ไม่ได้: ยังไม่มี Drive OAuth และไม่มี BLOB_READ_WRITE_TOKEN",
  );
}

export async function removeStoredFile(fileId: string): Promise<void> {
  if (!fileId) return;
  if (fileId.startsWith("blob:")) {
    try {
      await del(fileId.slice(5));
    } catch {
      // ignore
    }
    return;
  }
  await deleteDriveFile(fileId);
}

export function fileUrlFor(fileId: string): string {
  if (!fileId) return "";
  if (fileId.startsWith("blob:")) return "";
  if (fileId.startsWith("http")) return fileId;
  return `/api/files/${fileId}`;
}
