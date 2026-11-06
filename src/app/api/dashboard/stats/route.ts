import { runApi } from "@/lib/api";
import { getDashboardStats } from "@/lib/google/sheets";

export const revalidate = 20;

export async function GET() {
  return runApi(async () => {
    const stats = await getDashboardStats();
    return Response.json(stats, {
      headers: {
        "Cache-Control":
          "public, s-maxage=20, stale-while-revalidate=60, max-age=0",
      },
    });
  });
}
