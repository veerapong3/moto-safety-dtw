import { handleApiError, jsonOk, toSafeUser } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/google/sheets";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonOk({ user: null });
    const user = await getUserById(session.userId);
    if (!user || !user.active) return jsonOk({ user: null });
    return jsonOk({ user: toSafeUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
