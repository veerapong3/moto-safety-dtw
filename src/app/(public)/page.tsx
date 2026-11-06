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
      <p className="py-12 text-center text-sm text-slate-400">กำลังโหลดกราฟ...</p>
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
    <div className="mx-auto max-w-2xl space-y-16 py-6 sm:py-10">
      <section className="animate-fade-up space-y-8 text-center">
        <div>
          <p className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            MOTO-Safety
          </p>
          <p className="mt-2 text-sm text-slate-500">
            โรงเรียนดอนตาลวิทยา
          </p>
        </div>

        <div>
          <h1 className="text-base text-slate-600 sm:text-lg">
            ตรวจสอบเลขทะเบียนรถจักรยานยนต์
          </h1>
          <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
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
              placeholder="เช่น กข1234"
              autoComplete="off"
              className="w-full border border-slate-200 bg-white px-4 py-3 text-center font-display text-lg font-medium tracking-wide text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-400 focus:outline-none sm:text-left"
            />
            <button
              type="button"
              onClick={() => void checkPlate()}
              disabled={checking}
              className="bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {checking ? "..." : "ตรวจสอบ"}
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            ยังไม่มีในระบบ?{" "}
            <Link
              href="/form"
              className="text-slate-700 underline underline-offset-4 hover:text-slate-900"
            >
              ลงทะเบียน
            </Link>
          </p>
        </div>
      </section>

      {result && (
        <div
          className={`animate-slide-in border-y py-5 text-center ${
            result.exists
              ? "border-emerald-200 text-emerald-800"
              : "border-rose-200 text-rose-800"
          }`}
        >
          <p className="font-display text-lg font-semibold">
            {result.exists ? "พบในระบบแล้ว" : "ไม่พบในระบบ"}
          </p>
          {result.exists ? (
            <p className="mt-1 text-sm text-slate-600">
              {result.plate_number} · {result.province} · {result.brand} · สี
              {result.color}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              <Link href="/form" className="underline underline-offset-4">
                ไปลงทะเบียน
              </Link>
            </p>
          )}
        </div>
      )}

      <section>
        <h2 className="text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          สรุปในโรงเรียน
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {[
            { label: "รถทั้งหมด", value: stats?.total ?? "—" },
            { label: "ม.ต้น", value: stats?.junior ?? "—" },
            { label: "ม.ปลาย", value: stats?.senior ?? "—" },
            {
              label: "มีหมวก",
              value: stats ? `${stats.helmetRate}%` : "—",
            },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <dt className="text-xs text-slate-400">{item.label}</dt>
              <dd className="font-display mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {stats && (
        <section className="border-t border-slate-100 pt-12">
          <DashboardCharts stats={stats} />
        </section>
      )}
    </div>
  );
}
