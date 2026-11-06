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
  const grades = Object.keys(stats.byGrade);
  const values = Object.values(stats.byGrade);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h3 className="mb-5 font-display text-lg font-semibold text-slate-800">
          จำนวนรถแยกตามระดับชั้น
        </h3>
        <div className="relative h-[300px] w-full">
          <Bar
            data={{
              labels: grades,
              datasets: [
                {
                  label: "จำนวนรถ (คัน)",
                  data: values,
                  backgroundColor: grades.map((_, i) =>
                    i % 2 === 0
                      ? "rgba(29, 78, 216, 0.78)"
                      : "rgba(245, 158, 11, 0.78)",
                  ),
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { family: "Kanit, Sarabun, sans-serif" } },
                },
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 },
                  grid: { color: "rgba(148,163,184,0.25)" },
                },
              },
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-5 font-display text-lg font-semibold text-slate-800">
          สัดส่วนหมวกนิรภัย
        </h3>
        <div className="relative flex h-[300px] w-full items-center justify-center">
          <Doughnut
            data={{
              labels: ["มีหมวก", "ไม่มีหมวก"],
              datasets: [
                {
                  data: [stats.helmetYes, stats.helmetNo],
                  backgroundColor: [
                    "rgba(5, 150, 105, 0.9)",
                    "rgba(225, 29, 72, 0.85)",
                  ],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "68%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    boxWidth: 12,
                    font: { family: "Sarabun, sans-serif", size: 12 },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
