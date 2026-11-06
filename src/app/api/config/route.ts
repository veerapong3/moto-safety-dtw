import { handleApiError } from "@/lib/api";
import { getPublicConfig } from "@/lib/google/sheets";

export const revalidate = 60;

export async function GET() {
  try {
    const config = await getPublicConfig();
    return Response.json(config, {
      headers: {
        "Cache-Control":
          "public, s-maxage=60, stale-while-revalidate=120, max-age=0",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
