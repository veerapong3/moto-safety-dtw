import { handleApiError } from "@/lib/api";
import { getPublicConfig } from "@/lib/google/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await getPublicConfig();
    const res = NextResponse.json(config);
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
