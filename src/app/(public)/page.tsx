"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { DashboardStats } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
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
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => toast.error("โหลดสถิติไม่สำเร็จ"));
  }, []);

  async function checkPlate() {
    const q = plate.trim().replace(/\s+/g, "");
    if (!q) {
      toast.warning("กรุณากรอกเลขทะเบียนก่อนกดตรวจสอบข้อมูล");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/registrations/check-plate?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ตรวจสอบไม่สำเร็จ");
        return;
      }
      setResult(data);
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div className="max-w-xl">
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
              placeholder="กรอกเลขทะเบียน เช่น ยนร456 (ห้ามเว้นวรรค)"
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
                    วันที่ยืนยัน: {new Date(result.created_at).toLocaleString("th-TH")}
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
                  <Link href="/form" className="font-bold text-blue-600 hover:underline">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "รถลงทะเบียนทั้งหมด",
              value: stats?.total ?? 0,
              icon: "fa-motorcycle",
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "ชั้น ม.ต้น (ม.1-ม.3)",
              value: stats?.junior ?? 0,
              icon: "fa-graduation-cap",
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "ชั้น ม.ปลาย (ม.4-ม.6)",
              value: stats?.senior ?? 0,
              icon: "fa-user-graduate",
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "อัตราการมีหมวกนิรภัย",
              value: `${stats?.helmetRate ?? 0}%`,
              icon: "fa-helmet-safety",
              color: "bg-emerald-50 text-emerald-600",
              sub: stats
                ? `มีหมวก ${stats.helmetYes} จากทั้งหมด ${stats.total} คน`
                : "",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className={`rounded-xl p-4 ${card.color}`}>
                <i className={`fa-solid ${card.icon} text-3xl`} />
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <span className="text-3xl font-extrabold text-slate-800">
                  {card.value}
                </span>
                {card.sub && (
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                    {card.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">
              จำนวนรถจักรยานยนต์แยกตามระดับชั้น
            </h3>
            <div className="relative h-[300px] w-full">
              <Bar
                data={{
                  labels: Object.keys(stats.byGrade),
                  datasets: [
                    {
                      label: "จำนวนรถ (คัน)",
                      data: Object.values(stats.byGrade),
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(99, 102, 241, 0.7)",
                        "rgba(139, 92, 246, 0.7)",
                        "rgba(168, 85, 247, 0.7)",
                        "rgba(236, 72, 153, 0.7)",
                        "rgba(244, 63, 94, 0.7)",
                      ],
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">
              สัดส่วนความปลอดภัยหมวกนิรภัย
            </h3>
            <div className="relative flex h-[300px] w-full items-center justify-center">
              <Doughnut
                data={{
                  labels: ["มีหมวกนิรภัย", "ไม่มีหมวกนิรภัย"],
                  datasets: [
                    {
                      data: [stats.helmetYes, stats.helmetNo],
                      backgroundColor: [
                        "rgba(16, 185, 129, 0.85)",
                        "rgba(244, 63, 94, 0.85)",
                      ],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
