"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { timedFetch } from "@/lib/perf-client";
import { swalError, swalInfo, swalSuccess, swalWarning } from "@/lib/swal";
import type { DashboardStats } from "@/lib/types";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-10 text-center text-sm text-slate-400">
        กำลังโหลดกราฟ...
      </div>
    ),
  },
);

type PlateResult = {
  exists: boolean;
  plate_number?: string;
  province?: string;
  brand?: string;
  color?: string;
  created_at?: string;
};

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<PlateResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    timedFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => toast.error("โหลดสถิติไม่สำเร็จ"));
  }, []);

  async function checkPlate() {
    const q = plate.trim().replace(/\s+/g, "");
    if (!q) {
      toast.warning("กรุณากรอกเลขทะเบียนก่อนกดตรวจสอบข้อมูล");
      await swalWarning(
        "ยังไม่ได้กรอกเลขทะเบียน",
        "กรุณาพิมพ์เลขทะเบียนรถ เช่น กข1234 แล้วกดตรวจสอบอีกครั้ง",
      );
      return;
    }
    setChecking(true);
    toast.message(`กำลังตรวจสอบทะเบียน ${q}...`);
    try {
      const res = await timedFetch(
        `/api/registrations/check-plate?q=${encodeURIComponent(q)}`,
      );
      const data = (await res.json()) as PlateResult & { error?: string };
      if (!res.ok) {
        toast.error(data.error || "ตรวจสอบไม่สำเร็จ");
        await swalError("ตรวจสอบไม่สำเร็จ", data.error || "ลองใหม่อีกครั้ง");
        return;
      }
      setResult(data);
      if (data.exists) {
        const detail = [
          `ทะเบียน ${data.plate_number} (${data.province})`,
          `ยี่ห้อ ${data.brand} · สี${data.color}`,
          data.created_at
            ? `วันที่ยืนยัน ${new Date(data.created_at).toLocaleString("th-TH")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
        toast.success(`พบทะเบียน ${data.plate_number} ในระบบแล้ว`);
        await swalSuccess("พบข้อมูลการลงทะเบียน", detail);
      } else {
        toast.error(`ไม่พบทะเบียน ${q} ในระบบ`);
        await swalInfo(
          "ไม่พบข้อมูลทะเบียนนี้ในระบบ",
          `หมายเลข "${q}" ยังไม่ได้ลงทะเบียน หรืออาจพิมพ์ผิด — ไปที่เมนู "ลงทะเบียน" เพื่อบันทึกข้อมูล`,
        );
      }
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      await swalError(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
        "โปรดตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,var(--hero-from)_0%,var(--hero-via)_48%,var(--hero-to)_100%)]"
          aria-hidden
        />
        <div
          className="animate-soft-pulse absolute -right-16 top-8 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[min(72vh,640px)] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="animate-fade-up max-w-2xl">
            <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              MOTO-Safety
            </p>
            <p className="mt-2 text-sm font-medium text-blue-100/90 sm:text-base">
              DTW School · โรงเรียนดอนตาลวิทยา
            </p>
            <h1 className="mt-5 max-w-xl text-lg font-semibold leading-snug text-white/95 sm:text-xl">
              ตรวจสอบว่ามอเตอร์ไซค์ของคุณลงทะเบียนในระบบความปลอดภัยแล้วหรือยัง
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100/80">
              พิมพ์เลขทะเบียนแล้วกดตรวจสอบ — หากยังไม่มีในระบบ สามารถลงทะเบียนได้ทันที
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <label className="sr-only" htmlFor="plate-check">
                เลขทะเบียนรถ
              </label>
              <input
                id="plate-check"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void checkPlate();
                }}
                placeholder="เลขทะเบียน เช่น กข1234"
                className="w-full rounded-2xl border-0 bg-white px-5 py-3.5 text-base font-semibold text-slate-900 shadow-lg shadow-blue-950/20 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-300/60"
              />
              <button
                type="button"
                onClick={() => void checkPlate()}
                disabled={checking}
                className="shrink-0 rounded-2xl bg-amber-400 px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-900/20 transition hover:bg-amber-300 disabled:opacity-60"
              >
                <i className="fa-solid fa-magnifying-glass mr-2" />
                {checking ? "กำลังตรวจ..." : "ตรวจสอบ"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/form"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <i className="fa-solid fa-clipboard-list" />
                ลงทะเบียนนักเรียน
              </Link>
              <span className="text-xs text-blue-100/70">
                ห้ามเว้นวรรคในเลขทะเบียน
              </span>
            </div>
          </div>
        </div>
      </section>

      {result && (
        <div
          className={`animate-slide-in rounded-2xl border px-5 py-5 sm:px-6 ${
            result.exists
              ? "border-emerald-200 bg-emerald-50/90"
              : "border-rose-200 bg-rose-50/90"
          }`}
        >
          {result.exists ? (
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-check mt-0.5 text-2xl text-emerald-600" />
              <div>
                <h2 className="font-display text-lg font-semibold text-emerald-900">
                  พบข้อมูลการลงทะเบียนแล้ว
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  หมายเลข{" "}
                  <strong className="font-bold">
                    {result.plate_number} ({result.province})
                  </strong>{" "}
                  สี{result.color} ยี่ห้อ {result.brand} ยืนยันในระบบแล้ว
                </p>
                {result.created_at && (
                  <p className="mt-2 text-xs text-emerald-700/70">
                    วันที่ยืนยัน:{" "}
                    {new Date(result.created_at).toLocaleString("th-TH")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-xmark mt-0.5 text-2xl text-rose-500" />
              <div>
                <h2 className="font-display text-lg font-semibold text-rose-900">
                  ไม่พบทะเบียนนี้ในระบบ
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  ยังไม่ได้บันทึก หรืออาจพิมพ์ผิด —{" "}
                  <Link
                    href="/form"
                    className="font-bold text-blue-700 hover:underline"
                  >
                    ไปลงทะเบียน
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="animate-fade-up space-y-5" style={{ animationDelay: "80ms" }}>
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            สรุปความปลอดภัยโรงเรียน
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ข้อมูลรวมจากรถที่ลงทะเบียนในระบบ MOTO-Safety
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[
            {
              label: "รถทั้งหมด",
              value: stats?.total ?? "…",
              icon: "fa-motorcycle",
              tone: "text-blue-700 bg-blue-50",
            },
            {
              label: "ม.ต้น",
              value: stats?.junior ?? "…",
              icon: "fa-graduation-cap",
              tone: "text-sky-700 bg-sky-50",
            },
            {
              label: "ม.ปลาย",
              value: stats?.senior ?? "…",
              icon: "fa-user-graduate",
              tone: "text-slate-700 bg-slate-100",
            },
            {
              label: "มีหมวกนิรภัย",
              value: stats ? `${stats.helmetRate}%` : "…",
              icon: "fa-helmet-safety",
              tone: "text-emerald-700 bg-emerald-50",
              sub: stats
                ? `${stats.helmetYes}/${stats.total} คน`
                : undefined,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-slate-200/40"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}
              >
                <i className={`fa-solid ${item.icon}`} />
              </div>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="font-display mt-0.5 text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">
                {item.value}
              </p>
              {item.sub && (
                <p className="mt-1 text-[11px] text-slate-400">{item.sub}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {stats && <DashboardCharts stats={stats} />}
    </div>
  );
}
