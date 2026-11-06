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
      <div className="py-16 text-center text-sm text-slate-400">
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

function MotorcycleArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="320" cy="360" rx="220" ry="18" fill="rgba(0,0,0,0.28)" />
      <circle
        cx="150"
        cy="290"
        r="78"
        stroke="rgba(255,255,255,0.88)"
        strokeWidth="14"
      />
      <circle
        cx="150"
        cy="290"
        r="28"
        stroke="rgba(251,191,36,0.95)"
        strokeWidth="10"
      />
      <circle
        cx="490"
        cy="290"
        r="78"
        stroke="rgba(255,255,255,0.88)"
        strokeWidth="14"
      />
      <circle
        cx="490"
        cy="290"
        r="28"
        stroke="rgba(251,191,36,0.95)"
        strokeWidth="10"
      />
      <path
        d="M210 275 L280 180 H360 L410 250 H455"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M280 180 L250 120 H310"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M250 120 H200"
        stroke="rgba(251,191,36,0.95)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M360 180 L400 120"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <rect
        x="395"
        y="98"
        width="54"
        height="28"
        rx="6"
        fill="rgba(251,191,36,0.95)"
      />
      <path
        d="M280 180 L320 250 L410 250"
        stroke="rgba(147,197,253,0.55)"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <circle cx="320" cy="250" r="10" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

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
    <div className="-mx-4 -mt-6 sm:-mx-6 sm:-mt-8 lg:-mx-8">
      {/* HERO — one composition */}
      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[#071428] text-white">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#1e3a8a_0%,transparent_50%),radial-gradient(ellipse_at_85%_15%,#b45309_0%,transparent_42%),linear-gradient(160deg,#06101f_0%,#0c2348_48%,#102a56_100%)]"
          aria-hidden
        />
        <div className="home-road absolute inset-x-0 bottom-0 h-40" aria-hidden />
        <div className="home-lane absolute bottom-16 left-0 h-1 w-full" aria-hidden />

        <MotorcycleArt className="animate-moto-in pointer-events-none absolute -right-8 bottom-8 w-[min(92vw,620px)] opacity-90 sm:right-0 sm:bottom-10 md:w-[min(55vw,640px)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-center px-5 py-14 sm:px-8 lg:px-10">
          <div className="animate-fade-up max-w-xl">
            <p className="font-display text-[clamp(2.75rem,9vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
              MOTO
              <span className="block text-amber-400">Safety</span>
            </p>
            <p className="mt-3 text-sm font-medium tracking-wide text-sky-200/80">
              โรงเรียนดอนตาลวิทยา · DTW School
            </p>
            <h1 className="mt-6 max-w-md text-lg font-medium leading-snug text-white/90 sm:text-xl">
              เช็กเลขทะเบียนมอเตอร์ไซค์ว่าอยู่ในระบบความปลอดภัยแล้วหรือยัง
            </h1>

            <div className="mt-8 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
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
                  placeholder="กข1234"
                  autoComplete="off"
                  className="w-full border-0 bg-white px-5 py-4 font-display text-xl font-semibold tracking-wider text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400/50 sm:rounded-none"
                />
                <button
                  type="button"
                  onClick={() => void checkPlate()}
                  disabled={checking}
                  className="shrink-0 bg-amber-400 px-8 py-4 font-display text-base font-bold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60 sm:min-w-[9rem]"
                >
                  {checking ? "ตรวจ..." : "ตรวจสอบ"}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Link
                  href="/form"
                  className="font-semibold text-amber-300 underline-offset-4 transition hover:text-amber-200 hover:underline"
                >
                  ยังไม่มีในระบบ? ลงทะเบียน →
                </Link>
                <span className="text-sky-200/55">ห้ามเว้นวรรค</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Result */}
      {result && (
        <div
          className={`animate-slide-in border-y px-5 py-6 sm:px-8 ${
            result.exists
              ? "border-emerald-700/30 bg-emerald-950 text-emerald-50"
              : "border-rose-700/30 bg-rose-950 text-rose-50"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {result.exists ? "พบในระบบแล้ว" : "ไม่พบในระบบ"}
              </p>
              {result.exists ? (
                <p className="mt-1 text-sm text-emerald-100/80">
                  <span className="font-display text-lg font-bold tracking-wider text-white">
                    {result.plate_number}
                  </span>{" "}
                  · {result.province} · {result.brand} · สี{result.color}
                  {result.created_at
                    ? ` · ${new Date(result.created_at).toLocaleString("th-TH")}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-rose-100/80">
                  ยังไม่ได้บันทึก หรือพิมพ์ผิด —{" "}
                  <Link href="/form" className="font-bold text-amber-300 hover:underline">
                    ไปลงทะเบียน
                  </Link>
                </p>
              )}
            </div>
            <i
              className={`fa-solid text-3xl opacity-80 ${
                result.exists ? "fa-circle-check" : "fa-circle-xmark"
              }`}
            />
          </div>
        </div>
      )}

      {/* Stats strip — one job */}
      <section className="border-b border-slate-200 bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            ภาพรวมในโรงเรียน
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ข้อมูลรวมจากรถที่ลงทะเบียนใน MOTO-Safety
          </p>

          <dl className="mt-8 grid grid-cols-2 divide-slate-200 border-y border-slate-200 lg:grid-cols-4 lg:divide-x">
            {[
              { label: "รถทั้งหมด", value: stats?.total ?? "—", unit: "คัน" },
              { label: "ม.ต้น", value: stats?.junior ?? "—", unit: "คัน" },
              { label: "ม.ปลาย", value: stats?.senior ?? "—", unit: "คัน" },
              {
                label: "มีหมวกนิรภัย",
                value: stats ? `${stats.helmetRate}` : "—",
                unit: "%",
                sub: stats ? `${stats.helmetYes} จาก ${stats.total}` : undefined,
              },
            ].map((item) => (
              <div key={item.label} className="px-0 py-6 lg:px-6 first:lg:pl-0 last:lg:pr-0">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  {item.label}
                </dt>
                <dd className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold tabular-nums text-slate-900 sm:text-5xl">
                    {item.value}
                  </span>
                  <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                </dd>
                {item.sub && (
                  <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            ใช้ระบบอย่างไร
          </h2>
          <p className="mt-1 text-sm text-slate-500">สามขั้นสั้นๆ สำหรับนักเรียน</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "พิมพ์ทะเบียน",
                d: "ใส่เลขทะเบียนรถโดยไม่เว้นวรรค แล้วกดตรวจสอบ",
              },
              {
                n: "02",
                t: "ดูผลทันที",
                d: "ระบบบอกว่าพบในระบบแล้ว หรือยังไม่ได้ลงทะเบียน",
              },
              {
                n: "03",
                t: "ลงทะเบียนถ้ายังไม่มี",
                d: "กรอกข้อมูล + อัปโหลดรูปหลักฐาน ใช้เวลาไม่กี่นาที",
              },
            ].map((step) => (
              <li key={step.n} className="relative">
                <span className="font-display text-5xl font-bold text-amber-400/90">
                  {step.n}
                </span>
                <p className="mt-3 font-display text-lg font-semibold text-slate-900">
                  {step.t}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Charts */}
      {stats && (
        <section className="border-t border-slate-200 bg-[#f7f8fa]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
            <h2 className="mb-8 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
              รายละเอียดสถิติ
            </h2>
            <DashboardCharts stats={stats} />
          </div>
        </section>
      )}
    </div>
  );
}
