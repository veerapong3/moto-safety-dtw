import { handleApiError, jsonOk } from "@/lib/api";
import { getDashboardStats } from "@/lib/google/sheets";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return jsonOk(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
