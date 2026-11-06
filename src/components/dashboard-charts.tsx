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

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  return (
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
  );
}
