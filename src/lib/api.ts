import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
  if (message === "UNAUTHORIZED") return jsonError("กรุณาเข้าสู่ระบบ", 401);
  if (message === "FORBIDDEN") return jsonError("ไม่มีสิทธิ์เข้าถึง", 403);
  console.error(err);
  return jsonError(message, 500);
}

/** Attach Sheets/API duration headers for client perf HUD. */
export function withServerTiming<T extends Response>(
  res: T,
  startedAt: number,
): T {
  const ms = Math.max(0, Date.now() - startedAt);
  res.headers.set("X-Server-Time-Ms", String(ms));
  res.headers.set("Server-Timing", `app;dur=${ms}`);
  return res;
}

export async function runApi(fn: () => Promise<Response>): Promise<Response> {
  const startedAt = Date.now();
  try {
    return withServerTiming(await fn(), startedAt);
  } catch (err) {
    return withServerTiming(handleApiError(err), startedAt);
  }
}

export function toSafeUser(user: {
  id: string;
  username: string;
  display_name: string;
  role: string;
  active: boolean;
  created_at: string;
  created_by: string;
}) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    active: user.active,
    created_at: user.created_at,
    created_by: user.created_by,
  };
}
