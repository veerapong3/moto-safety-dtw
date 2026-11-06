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

const ink = "rgba(15, 23, 42, 0.82)";
const mute = "rgba(148, 163, 184, 0.85)";

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
      <div>
        <h3 className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          ตามระดับชั้น
        </h3>
        <div className="relative h-[240px] w-full">
          <Bar
            data={{
              labels: Object.keys(stats.byGrade),
              datasets: [
                {
                  label: "คัน",
                  data: Object.values(stats.byGrade),
                  backgroundColor: ink,
                  borderRadius: 2,
                  barThickness: 18,
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
                  border: { display: false },
                  ticks: { color: "#94a3b8", font: { size: 11 } },
                },
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: "#94a3b8", font: { size: 11 } },
                  grid: { color: "rgba(226,232,240,0.9)" },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          หมวกนิรภัย
        </h3>
        <div className="relative mx-auto flex h-[240px] w-full max-w-[240px] items-center justify-center">
          <Doughnut
            data={{
              labels: ["มี", "ไม่มี"],
              datasets: [
                {
                  data: [stats.helmetYes, stats.helmetNo],
                  backgroundColor: [ink, mute],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "72%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    boxWidth: 8,
                    boxHeight: 8,
                    color: "#64748b",
                    font: { size: 11 },
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
