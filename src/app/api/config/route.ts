import { handleApiError, jsonOk } from "@/lib/api";
import { getPublicConfig } from "@/lib/google/sheets";

export async function GET() {
  try {
    const config = await getPublicConfig();
    return jsonOk(config);
  } catch (err) {
    return handleApiError(err);
  }
}
