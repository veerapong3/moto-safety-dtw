import { handleApiError, jsonOk } from "@/lib/api";
import { getDashboardStats } from "@/lib/google/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    const res = NextResponse.json(stats);
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=20, stale-while-revalidate=60",
    );
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
