"use client";

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

const gradeColors = [
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#eab308",
  "#f97316",
  "#ef4444",
];

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const labels = Object.keys(stats.byGrade);
  const values = Object.values(stats.byGrade);
  const maxVal = Math.max(1, ...values);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              จำนวนรถจักรยานยนต์แยกตามระดับชั้น
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              ม.1–ม.6 · หน่วยเป็นคัน
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
            รวม {stats.total.toLocaleString()} คัน
          </span>
        </div>
        <div className="relative h-[300px] w-full px-4 pb-4 pt-2">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "จำนวนรถ (คัน)",
                  data: values,
                  backgroundColor: labels.map(
                    (_, i) => gradeColors[i % gradeColors.length],
                  ),
                  hoverBackgroundColor: labels.map(
                    (_, i) => gradeColors[i % gradeColors.length],
                  ),
                  borderRadius: 10,
                  borderSkipped: false,
                  maxBarThickness: 42,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "#0f172a",
                  titleFont: { size: 12 },
                  bodyFont: { size: 13, weight: "bold" },
                  padding: 10,
                  cornerRadius: 10,
                  callbacks: {
                    label: (ctx) => ` ${ctx.parsed.y} คัน`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    color: "#64748b",
                    font: { size: 12, weight: 600 },
                  },
                },
                y: {
                  beginAtZero: true,
                  suggestedMax: maxVal + 1,
                  ticks: {
                    stepSize: 1,
                    color: "#94a3b8",
                    font: { size: 11 },
                  },
                  grid: {
                    color: "rgba(226, 232, 240, 0.9)",
                  },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">
            สัดส่วนความปลอดภัยหมวกนิรภัย
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            สวมหมวก vs ไม่สวมหมวก
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 px-6 py-5">
          <div className="relative h-[200px] w-[200px]">
            <Doughnut
              data={{
                labels: ["มีหมวกนิรภัย", "ไม่มีหมวกนิรภัย"],
                datasets: [
                  {
                    data: [stats.helmetYes, stats.helmetNo],
                    backgroundColor: ["#10b981", "#fb7185"],
                    hoverBackgroundColor: ["#059669", "#f43f5e"],
                    borderWidth: 0,
                    spacing: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#0f172a",
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                      label: (ctx) =>
                        ` ${ctx.label}: ${ctx.parsed.toLocaleString()} คน`,
                    },
                  },
                },
              }}
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-extrabold tabular-nums text-emerald-600">
                  {stats.helmetRate}%
                </p>
                <p className="text-[11px] font-semibold text-slate-400">
                  ปลอดภัย
                </p>
              </div>
            </div>
          </div>

          <ul className="w-full space-y-2">
            <li className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium text-emerald-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                มีหมวกนิรภัย
              </span>
              <strong className="tabular-nums text-emerald-900">
                {stats.helmetYes.toLocaleString()}
              </strong>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium text-rose-800">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                ไม่มีหมวกนิรภัย
              </span>
              <strong className="tabular-nums text-rose-900">
                {stats.helmetNo.toLocaleString()}
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
