import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { getPublicConfig, getSetting } from "@/lib/google/sheets";
import { storeRegistrationImage } from "@/lib/storage";
import type { ImageKind } from "@/lib/types";

const KINDS = new Set(["bike", "plate", "rider", "samples"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") || "");
    const label = String(form.get("label") || "image");
    const isSample = String(form.get("sample") || "") === "1";

    if (!(file instanceof File)) return jsonError("ไม่พบไฟล์");
    if (!KINDS.has(kindRaw) && !isSample) {
      return jsonError("ชนิดไฟล์ไม่ถูกต้อง");
    }

    const session = await getSession();
    const config = await getPublicConfig();

    if (isSample || kindRaw === "samples") {
      if (!session || session.role !== "admin") {
        return jsonError("ไม่มีสิทธิ์อัปโหลดรูปตัวอย่าง", 403);
      }
    } else if (!session) {
      if (!config.registrationOpen) {
        return jsonError("ระบบปิดรับลงทะเบียนชั่วคราว", 403);
      }
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("รองรับเฉพาะไฟล์รูปภาพ");
    }
    if (file.size > 4 * 1024 * 1024) {
      return jsonError("ไฟล์ใหญ่เกิน 4MB (หลังบีบอัดแล้ว)");
    }

    const academicYear =
      (await getSetting("CURRENT_ACADEMIC_YEAR")) ||
      String(new Date().getFullYear() + 543);

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = (isSample ? "samples" : kindRaw) as ImageKind | "samples";

    const stored = await storeRegistrationImage({
      academicYear,
      kind,
      label,
      fileName: file.name || `${kind}.jpg`,
      mimeType: file.type || "image/jpeg",
      buffer,
    });

    return jsonOk(stored);
  } catch (err) {
    return handleApiError(err);
  }
}
