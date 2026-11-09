"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { timedFetch } from "@/lib/perf-client";
import { swalError, swalInfo, swalSuccess, swalWarning } from "@/lib/swal";
import type { DashboardStats, PublicConfig } from "@/lib/types";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
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
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<PlateResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    timedFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => toast.error("โหลดสถิติไม่สำเร็จ"));
    timedFetch("/api/config")
      .then((r) => r.json())
      .then((d: PublicConfig) => setConfig(d))
      .catch(() => undefined);
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
          `หมายเลข "${q}" ยังไม่ได้ลงทะเบียน หรืออาจพิมพ์ผิด — ไปที่เมนู "ลงทะเบียน (นักเรียน)" เพื่อบันทึกข้อมูล`,
        );
      }
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      await swalError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "โปรดตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 text-[11rem] leading-none text-white/[0.07] sm:text-[14rem]"
        >
          <i className="fa-solid fa-motorcycle" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-16 text-[7rem] leading-none text-white/[0.05] sm:right-40"
        >
          <i className="fa-solid fa-helmet-safety" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative max-w-xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {config?.academicYear && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50 backdrop-blur-sm">
                <i className="fa-solid fa-calendar-days text-[10px] opacity-80" />
                ปีการศึกษา {config.academicYear}
              </span>
            )}
            {config?.semester && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50 backdrop-blur-sm">
                <i className="fa-solid fa-book-open text-[10px] opacity-80" />
                ภาคเรียนที่ {config.semester}
              </span>
            )}
          </div>
          <h2 className="mb-2 text-2xl font-extrabold">
            <i className="fa-solid fa-magnifying-glass-chart mr-2" />
            ระบบตรวจสอบการลงทะเบียน
          </h2>
          <p className="mb-6 text-sm text-blue-100">
            ตรวจสอบได้ว่ารถจักรยานยนต์ของคุณได้รับการบันทึกเข้าสู่ระบบสารสนเทศความปลอดภัยของโรงเรียนแล้วหรือยัง
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="เช่น กข1234 หรือ 1กพ4567 (ห้ามเว้นวรรค)"
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={checkPlate}
              disabled={checking}
              className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-md transition hover:bg-yellow-400 disabled:opacity-60"
            >
              <i className="fa-solid fa-square-check mr-2" />
              ตรวจสอบข้อมูล
            </button>
          </div>
          <p className="mt-4 text-sm text-blue-100/90">
            ยังไม่เคยลงทะเบียน?{" "}
            <Link
              href="/guide"
              className="font-bold text-yellow-300 underline-offset-2 hover:underline"
            >
              อ่านคู่มือการกรอกก่อน
            </Link>{" "}
            หรือ{" "}
            <Link
              href="/form"
              className="font-bold text-yellow-300 underline-offset-2 hover:underline"
            >
              ไปหน้าลงทะเบียน
            </Link>
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-2xl border p-6 shadow-md ${
            result.exists
              ? "border-emerald-500 bg-emerald-50"
              : "border-rose-500 bg-rose-50"
          }`}
        >
          {result.exists ? (
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-check mt-0.5 text-2xl text-emerald-600" />
              <div>
                <h4 className="text-base font-extrabold text-emerald-800">
                  พบข้อมูลการลงทะเบียนเสร็จสมบูรณ์
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  หมายเลขทะเบียน{" "}
                  <strong className="underline">
                    {result.plate_number} ({result.province})
                  </strong>{" "}
                  สี{result.color} ยี่ห้อ {result.brand} ได้รับการยืนยันในระบบแล้ว
                </p>
                {result.created_at && (
                  <p className="mt-2 text-xs text-emerald-600/70">
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
                <h4 className="text-base font-extrabold text-rose-800">
                  ไม่พบข้อมูลทะเบียนนี้ในระบบ
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  ยังไม่ได้บันทึก หรืออาจพิมพ์ผิด — ไปที่เมนู{" "}
                  <Link
                    href="/form"
                    className="font-bold text-blue-600 hover:underline"
                  >
                    ลงทะเบียน (นักเรียน)
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-4 text-xl font-bold text-slate-800">
          <i className="fa-solid fa-chart-simple mr-2 text-blue-600" />
          สรุปสถานะข้อมูลความปลอดภัย
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[
            {
              label: "รถลงทะเบียนทั้งหมด",
              value: stats?.total ?? "…",
              icon: "fa-motorcycle",
              wrap: "border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-sky-50",
              iconBox:
                "bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-blue-600/25",
              valueColor: "text-blue-800",
            },
            {
              label: "ชั้น ม.ต้น (ม.1-ม.3)",
              value: stats?.junior ?? "…",
              icon: "fa-graduation-cap",
              wrap: "border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-teal-50",
              iconBox:
                "bg-gradient-to-br from-cyan-600 to-teal-500 text-white shadow-cyan-600/25",
              valueColor: "text-cyan-900",
            },
            {
              label: "ชั้น ม.ปลาย (ม.4-ม.6)",
              value: stats?.senior ?? "…",
              icon: "fa-user-graduate",
              wrap: "border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50",
              iconBox:
                "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25",
              valueColor: "text-amber-900",
            },
            {
              label: "อัตราการมีหมวกนิรภัย",
              value: stats ? `${stats.helmetRate}%` : "…",
              icon: "fa-helmet-safety",
              wrap: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-green-50",
              iconBox:
                "bg-gradient-to-br from-emerald-600 to-green-500 text-white shadow-emerald-600/25",
              valueColor: "text-emerald-800",
              sub: stats
                ? `มีหมวก ${stats.helmetYes} จากทั้งหมด ${stats.total} คน`
                : "",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.wrap}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-[0.07]"
              >
                <i className={`fa-solid ${card.icon}`} />
              </div>
              <div
                className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-lg ${card.iconBox}`}
              >
                <i className={`fa-solid ${card.icon} text-xl`} />
              </div>
              <div className="relative min-w-0">
                <span className="block text-[11px] font-semibold tracking-wide text-slate-500">
                  {card.label}
                </span>
                <span
                  className={`mt-0.5 block text-3xl font-extrabold tabular-nums ${card.valueColor}`}
                >
                  {card.value}
                </span>
                {card.sub && (
                  <span className="mt-1 block text-[10px] font-semibold text-emerald-700/70">
                    {card.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats && <DashboardCharts stats={stats} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-blue-100 text-2xl text-blue-700">
              <i className="fa-solid fa-book-open" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                คู่มือการกรอกสำหรับนักเรียน
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-600">
                อ่านวิธีกรอกข้อมูล รูปแบบทะเบียน และตัวอย่างรูปหลักฐานก่อนเริ่มลงทะเบียน
              </p>
              <Link
                href="/guide"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-base font-bold text-white transition hover:bg-blue-800"
              >
                <i className="fa-solid fa-book-open" />
                เปิดคู่มือ
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-700 to-sky-600 p-7 text-white shadow-md sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15 text-2xl">
              <i className="fa-solid fa-clipboard-list" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-extrabold sm:text-2xl">
                ยังไม่มีข้อมูลในระบบใช่ไหม?
              </h3>
              <p className="mt-2 text-base leading-relaxed text-blue-100">
                หากตรวจสอบทะเบียนแล้วไม่พบ หรือยังไม่ได้บันทึก —
                ลงทะเบียนรถจักรยานยนต์ได้ทันที
              </p>
              <Link
                href="/form"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3.5 text-base font-bold text-slate-900 transition hover:bg-yellow-300"
              >
                <i className="fa-solid fa-pen-to-square" />
                ลงทะเบียนเลย
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
