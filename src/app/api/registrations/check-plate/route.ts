import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { findRegistrationByPlate } from "@/lib/google/sheets";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const plate = (searchParams.get("q") || "").replace(/\s+/g, "");
    if (!plate) return jsonError("กรุณาระบุเลขทะเบียน");

    const match = await findRegistrationByPlate(plate);
    if (!match) return jsonOk({ exists: false });

    // Public response — no PII (name/phone/student id/photos)
    return jsonOk({
      exists: true,
      plate_number: match.plate_number,
      province: match.province,
      brand: match.brand,
      color: match.color,
      created_at: match.created_at,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
