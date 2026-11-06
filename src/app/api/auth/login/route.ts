import { handleApiError, jsonError, jsonOk, toSafeUser } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getUserByUsername } from "@/lib/google/sheets";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    }

    const user = await getUserByUsername(parsed.data.username);
    if (!user) return jsonError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);

    const ok = await verifyPassword(parsed.data.password, user.password_hash);
    if (!ok) return jsonError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
    if (!user.active) return jsonError("บัญชีถูกระงับ", 403);

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    });
    await setSessionCookie(token);

    return jsonOk({ user: toSafeUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
