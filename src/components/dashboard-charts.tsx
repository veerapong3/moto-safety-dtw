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
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
];

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const labels = Object.keys(stats.byGrade);
  const values = Object.values(stats.byGrade);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-800 sm:text-base">
          จำนวนรถจักรยานยนต์ แยกตามระดับชั้น ม.1–6
        </h3>
        <div className="relative h-[260px] w-full">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "คัน",
                  data: values,
                  backgroundColor: labels.map(
                    (_, i) => gradeColors[i % gradeColors.length],
                  ),
                  borderRadius: 8,
                  barThickness: 28,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => `${c.raw} คัน` } },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: { color: "#64748b", font: { size: 12, weight: 600 } },
                },
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: "#94a3b8" },
                  grid: { color: "rgba(226,232,240,0.9)" },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-800 sm:text-base">
          สัดส่วนความปลอดภัย หมวกนิรภัย
        </h3>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="relative h-[200px] w-[200px]">
            <Doughnut
              data={{
                labels: ["สวมหมวก", "ไม่สวมหมวก"],
                datasets: [
                  {
                    data: [stats.helmetYes, stats.helmetNo],
                    backgroundColor: ["#22c55e", "#e2e8f0"],
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                plugins: { legend: { display: false } },
              }}
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-emerald-600">
                  {stats.helmetRate}%
                </p>
                <p className="text-[11px] font-semibold text-slate-400">
                  ปลอดภัย
                </p>
              </div>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              สวมหมวก{" "}
              <strong className="tabular-nums">{stats.helmetYes.toLocaleString()}</strong>
            </li>
            <li className="flex items-center gap-2 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              ไม่สวมหมวก{" "}
              <strong className="tabular-nums">{stats.helmetNo.toLocaleString()}</strong>
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
