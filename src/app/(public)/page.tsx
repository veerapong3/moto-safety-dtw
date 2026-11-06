"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
      <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-sm text-slate-400">
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
          `หมายเลข "${q}" ยังไม่ได้ลงทะเบียน หรืออาจพิมพ์ผิด — กด "ลงทะเบียนเลย" เพื่อบันทึกข้อมูล`,
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
    <div className="-mx-4 -mt-6 space-y-6 sm:-mx-6 sm:-mt-8 sm:space-y-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-student.jpg"
            alt=""
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/78 to-sky-100/35"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto flex min-h-[min(58vh,480px)] max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
          <div className="animate-fade-up max-w-xl">
            <p className="font-display text-4xl font-bold italic tracking-tight text-[#1d4ed8] sm:text-5xl">
              MOTO-SafetyDTW
            </p>
            <p className="mt-4 inline-block rounded-2xl bg-[#2563eb] px-4 py-2.5 text-sm font-medium leading-snug text-white shadow-md shadow-blue-600/20 sm:text-[15px]">
              ตรวจสอบว่ารถมอเตอร์ไซค์ของคุณลงทะเบียนในระบบความปลอดภัยแล้วหรือยัง
            </p>

            <div className="mt-6 flex max-w-lg flex-col gap-2 sm:flex-row sm:items-stretch">
              <label className="sr-only" htmlFor="plate-check">
                เลขทะเบียนรถ
              </label>
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-lg shadow-slate-900/5">
                <i className="fa-solid fa-motorcycle text-slate-400" />
                <input
                  id="plate-check"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void checkPlate();
                  }}
                  placeholder="กรอกเลขทะเบียน เช่น กข1234"
                  autoComplete="off"
                  className="w-full border-0 bg-transparent py-3 text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void checkPlate()}
                disabled={checking}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                <i className="fa-solid fa-magnifying-glass" />
                {checking ? "กำลังตรวจ..." : "ตรวจสอบ"}
              </button>
            </div>

            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <i className="fa-solid fa-helmet-safety" />
              สวมหมวกนิรภัยทุกครั้งก่อนขับขี่
            </p>
          </div>
        </div>
      </section>

      {result && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className={`animate-slide-in rounded-2xl border px-5 py-4 ${
              result.exists
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <p className="font-display text-lg font-bold">
              {result.exists ? "พบในระบบแล้ว" : "ไม่พบในระบบ"}
            </p>
            {result.exists ? (
              <p className="mt-1 text-sm text-slate-700">
                {result.plate_number} · {result.province} · {result.brand} · สี
                {result.color}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-700">
                ยังไม่ได้บันทึก หรือพิมพ์ผิด —{" "}
                <Link href="/form" className="font-bold text-blue-700 underline">
                  ลงทะเบียนเลย
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <section id="stats" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            สถิติภาพรวม MOTO-Safety
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ข้อมูลรวมจากรถที่ลงทะเบียนในระบบโรงเรียน
          </p>
        </div>

        {stats ? (
          <>
            <DashboardCharts stats={stats} />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "รถทั้งหมด",
                  value: stats.total,
                  tone: "bg-blue-50 text-blue-700 border-blue-100",
                  icon: "fa-motorcycle",
                },
                {
                  label: "สวมหมวก (ปลอดภัย)",
                  value: stats.helmetYes,
                  tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  icon: "fa-helmet-safety",
                },
                {
                  label: "ไม่สวมหมวก (เสี่ยง)",
                  value: stats.helmetNo,
                  tone: "bg-rose-50 text-rose-700 border-rose-100",
                  icon: "fa-triangle-exclamation",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${item.tone}`}
                >
                  <i className={`fa-solid ${item.icon} text-xl opacity-80`} />
                  <div>
                    <p className="text-xs font-semibold opacity-80">{item.label}</p>
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
            กำลังโหลดสถิติ...
          </div>
        )}
      </section>

      {/* Register CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
              <i className="fa-solid fa-bullhorn" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-slate-900">
                ยังไม่มีข้อมูลในระบบใช่ไหม?
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                ลงทะเบียนรถและข้อมูลหมวกนิรภัยได้ทันที
              </p>
            </div>
          </div>
          <Link
            href="/form"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-[#1d4ed8] sm:w-auto"
          >
            <i className="fa-solid fa-pen-to-square" />
            ลงทะเบียนเลย
          </Link>
        </div>
      </section>
    </div>
  );
}
