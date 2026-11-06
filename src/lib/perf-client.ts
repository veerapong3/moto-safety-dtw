"use client";

export type PerfOp = {
  id: string;
  at: number;
  label: string;
  method: string;
  path: string;
  status: number;
  clientMs: number;
  serverMs: number | null;
  ok: boolean;
};

export type PagePerf = {
  path: string;
  loadMs: number | null;
  startedAt: number;
  pending: number;
};

type Listener = () => void;

const MAX_OPS = 12;
const ops: PerfOp[] = [];
let page: PagePerf = {
  path: "/",
  loadMs: null,
  startedAt: Date.now(),
  pending: 0,
};
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribePerf(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPerfSnapshot() {
  return { ops: ops.slice(), page: { ...page } };
}

export function resetPagePerf(path: string) {
  page = {
    path,
    loadMs: null,
    startedAt: performance.now(),
    pending: 0,
  };
  emit();
}

function shortPath(url: string) {
  try {
    const u = new URL(url, "http://local");
    return u.pathname + (u.search ? "?…" : "");
  } catch {
    return url;
  }
}

function guessLabel(method: string, path: string): string {
  const p = path.split("?")[0];
  if (method === "GET" && p === "/api/dashboard/stats") return "โหลดสถิติ Dashboard";
  if (method === "GET" && p === "/api/config") return "โหลดการตั้งค่าฟอร์ม";
  if (method === "GET" && p === "/api/registrations") return "โหลดตารางทะเบียน";
  if (method === "GET" && p.startsWith("/api/registrations/check-plate"))
    return "ตรวจทะเบียน";
  if (method === "POST" && p === "/api/registrations") return "บันทึกการลงทะเบียน";
  if (method === "PATCH" && /^\/api\/registrations\//.test(p))
    return "แก้ไขทะเบียน";
  if (method === "DELETE" && /^\/api\/registrations\//.test(p))
    return "ลบทะเบียน";
  if (method === "POST" && p === "/api/upload") return "อัปโหลดรูป";
  if (method === "GET" && p === "/api/settings") return "โหลดตั้งค่าระบบ";
  if (method === "PUT" && p === "/api/settings") return "บันทึกตั้งค่า";
  if (method === "POST" && p === "/api/auth/login") return "เข้าสู่ระบบ";
  if (method === "GET" && p === "/api/auth/me") return "ตรวจ session";
  if (method === "GET" && p.startsWith("/api/files/")) return "โหลดรูปภาพ";
  return `${method} ${p}`;
}

function pushOp(op: PerfOp) {
  ops.unshift(op);
  if (ops.length > MAX_OPS) ops.length = MAX_OPS;
  emit();
}

function onFetchStart() {
  page = { ...page, pending: page.pending + 1 };
  emit();
}

function onFetchEnd() {
  const pending = Math.max(0, page.pending - 1);
  const loadMs =
    pending === 0 && page.loadMs == null
      ? Math.round(performance.now() - page.startedAt)
      : page.loadMs;
  page = { ...page, pending, loadMs };
  emit();
}

export function formatMs(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 2)} s`;
}

export function perfTone(ms: number | null | undefined) {
  if (ms == null) return "neutral" as const;
  if (ms < 800) return "good" as const;
  if (ms < 2000) return "ok" as const;
  return "slow" as const;
}

export type PerfTone = ReturnType<typeof perfTone>;

export function perfStatusCopy(ms: number | null | undefined): {
  tone: PerfTone;
  tag: string;
  title: string;
  tip: string;
} {
  const tone = perfTone(ms);
  const time = formatMs(ms);
  if (tone === "good") {
    return {
      tone,
      tag: "Good",
      title: `โหลดเร็ว ${time}`,
      tip: "Sheets/API ตอบดี · ใช้งานลื่น",
    };
  }
  if (tone === "ok") {
    return {
      tone,
      tag: "OK",
      title: `โหลดพอใช้ ${time}`,
      tip: "ช้าเล็กน้อย · ปกติสำหรับ Google Sheets",
    };
  }
  if (tone === "slow") {
    return {
      tone,
      tag: "Slow",
      title: `โหลดช้า ${time}`,
      tip: "อาจติดโควต้า Sheets หรือเน็ตช้า · ลองรีเฟรช",
    };
  }
  return {
    tone: "neutral",
    tag: "…",
    title: "กำลังโหลด",
    tip: "รอข้อมูลจากเซิร์ฟเวอร์",
  };
}

export async function timedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: { label?: string },
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const path = shortPath(url);
  const label = opts?.label || guessLabel(method, path);

  onFetchStart();
  const t0 = performance.now();
  try {
    const res = await fetch(input, init);
    const clientMs = Math.round(performance.now() - t0);
    const serverHeader = res.headers.get("X-Server-Time-Ms");
    const serverMs = serverHeader != null ? Number(serverHeader) : null;
    pushOp({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      label,
      method,
      path,
      status: res.status,
      clientMs,
      serverMs: Number.isFinite(serverMs) ? serverMs : null,
      ok: res.ok,
    });
    return res;
  } catch (err) {
    const clientMs = Math.round(performance.now() - t0);
    pushOp({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      label,
      method,
      path,
      status: 0,
      clientMs,
      serverMs: null,
      ok: false,
    });
    throw err;
  } finally {
    onFetchEnd();
  }
}
