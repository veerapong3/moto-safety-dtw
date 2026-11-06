import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import {
  getPublicConfig,
  getSettingsMap,
  setSettings,
} from "@/lib/google/sheets";
import { settingsUpdateSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdmin();
    const map = await getSettingsMap();
    const publicConfig = await getPublicConfig();
    return jsonOk({ settings: map, config: publicConfig });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    }

    const entries: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) entries[k] = v;
    }
    await setSettings(entries);
    const config = await getPublicConfig();
    return jsonOk({ message: "บันทึกการตั้งค่าสำเร็จ", config });
  } catch (err) {
    return handleApiError(err);
  }
}
