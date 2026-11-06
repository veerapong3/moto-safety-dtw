import { Readable } from "stream";
import { unwrapDriveFileId } from "@/lib/drive-link";
import { getDriveClient, hasDriveUserOAuth } from "@/lib/google/auth-sa";
import { getDriveRootFolderId } from "@/lib/google/sheets";
import type { ImageKind } from "@/lib/types";

export async function getDriveFileContent(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  fileName: string;
}> {
  const id = unwrapDriveFileId(fileId);
  if (!id) throw new Error("ไม่พบรหัสไฟล์ Drive");

  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId: id,
    fields: "id,name,mimeType",
    supportsAllDrives: true,
  });

  const res = await drive.files.get(
    { fileId: id, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
  );

  return {
    stream: res.data as Readable,
    mimeType: meta.data.mimeType || "application/octet-stream",
    fileName: meta.data.name || "file",
  };
}

async function findChildFolder(
  parentId: string,
  name: string,
): Promise<string | null> {
  const drive = getDriveClient();
  const q = [
    `'${parentId}' in parents`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
  ].join(" and ");
  const res = await drive.files.list({
    q,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(parentId: string, name: string): Promise<string> {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!res.data.id) throw new Error("Failed to create folder");
  return res.data.id;
}

async function ensureFolder(parentId: string, name: string): Promise<string> {
  const existing = await findChildFolder(parentId, name);
  if (existing) return existing;
  return createFolder(parentId, name);
}

export async function ensureRegistrationFolder(params: {
  academicYear: string;
  kind: ImageKind | "samples";
}): Promise<string> {
  const rootId = await getDriveRootFolderId();
  const year = params.academicYear || "general";
  const yearFolder = await ensureFolder(rootId, year);
  return ensureFolder(yearFolder, params.kind);
}

function safeFileName(base: string, originalName: string): string {
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf("."))
    : ".jpg";
  const clean = base
    .normalize("NFKD")
    .replace(/[^\w\u0E00-\u0E7F.-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  return `${Date.now()}_${clean || "file"}${ext}`;
}

export async function uploadRegistrationImage(params: {
  academicYear: string;
  kind: ImageKind | "samples";
  label: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
  if (!hasDriveUserOAuth()) {
    throw new Error(
      "อัปโหลดไฟล์ยังใช้ไม่ได้: ตั้งค่า Drive OAuth (GOOGLE_DRIVE_OAUTH_*) ตาม README",
    );
  }

  const folderId = await ensureRegistrationFolder({
    academicYear: params.academicYear,
    kind: params.kind,
  });

  const drive = getDriveClient();
  const name = safeFileName(params.label, params.fileName);
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType: params.mimeType,
      body: Readable.from(params.buffer),
    },
    fields: "id, name, webViewLink",
    supportsAllDrives: true,
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error("Upload failed");

  return {
    fileId,
    fileName: res.data.name || name,
    fileUrl: `/api/files/${fileId}`,
  };
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  if (!fileId) return;
  const id = unwrapDriveFileId(fileId);
  if (!id || id.startsWith("blob:")) return;
  const drive = getDriveClient();
  try {
    await drive.files.delete({ fileId: id, supportsAllDrives: true });
  } catch {
    // already gone
  }
}
