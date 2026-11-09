/**
 * Delete all motorcycle registrations (and linked files) via live admin API.
 * Keeps Users / Settings intact.
 *
 * Usage:
 *   BASE_URL=https://moto-safety-dtw.vercel.app npx tsx scripts/clear-registrations.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD?.trim();

function extractSessionCookie(res: Response): string {
  const fromGetSetCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  const raw =
    fromGetSetCookie.length > 0
      ? fromGetSetCookie
      : [res.headers.get("set-cookie") || ""];

  for (const line of raw) {
    const match = /motosafety_session=([^;]+)/.exec(line);
    if (match?.[1]) return `motosafety_session=${match[1]}`;
  }
  throw new Error("ไม่พบ session cookie หลัง login");
}

async function main() {
  if (!password) {
    throw new Error("ต้องมี ADMIN_PASSWORD ใน .env.local");
  }

  console.log("BASE_URL =", BASE);
  console.log("Clearing all Registrations (Users/Settings kept)...");

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    throw new Error(
      `login failed: ${loginBody.error || loginRes.status}`,
    );
  }

  const cookie = extractSessionCookie(loginRes);
  const listRes = await fetch(`${BASE}/api/registrations`, {
    headers: { Cookie: cookie },
  });
  const listBody = await listRes.json();
  if (!listRes.ok) {
    throw new Error(`list failed: ${listBody.error || listRes.status}`);
  }

  const items = (listBody.items || []) as Array<{
    id: string;
    student_id?: string;
    plate_number?: string;
  }>;
  console.log("found", items.length, "registrations");

  let deleted = 0;
  for (const item of items) {
    const delRes = await fetch(`${BASE}/api/registrations/${item.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    const delBody = await delRes.json().catch(() => ({}));
    if (!delRes.ok) {
      throw new Error(
        `delete ${item.id} failed: ${delBody.error || delRes.status}`,
      );
    }
    deleted += 1;
    console.log(
      "deleted",
      item.id,
      item.student_id || "",
      item.plate_number || "",
    );
    // gentle pacing for Sheets / Drive quotas
    await new Promise((r) => setTimeout(r, 800));
  }

  const stats = await fetch(`${BASE}/api/dashboard/stats`).then((r) =>
    r.json(),
  );
  console.log("deleted_count", deleted);
  console.log("stats_after", stats);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
