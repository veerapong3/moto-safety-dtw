"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  formatMs,
  getPerfSnapshot,
  perfStatusCopy,
  perfTone,
  resetPagePerf,
  subscribePerf,
  type PagePerf,
  type PerfOp,
  type PerfTone,
} from "@/lib/perf-client";

const toneClass: Record<PerfTone, string> = {
  good: "text-emerald-700",
  ok: "text-amber-700",
  slow: "text-red-700",
  neutral: "text-slate-500",
};

const toneDot: Record<PerfTone, string> = {
  good: "bg-emerald-500",
  ok: "bg-amber-500",
  slow: "bg-red-500",
  neutral: "bg-slate-300",
};

const toastShell: Record<PerfTone, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-950",
  ok: "border-amber-200 bg-amber-50 text-amber-950",
  slow: "border-red-200 bg-red-50 text-red-950",
  neutral: "border-border bg-white text-slate-800",
};

const toastTag: Record<PerfTone, string> = {
  good: "bg-emerald-600 text-white",
  ok: "bg-amber-500 text-white",
  slow: "bg-red-600 text-white",
  neutral: "bg-slate-500 text-white",
};

type Flash = {
  id: number;
  tone: PerfTone;
  tag: string;
  title: string;
  tip: string;
};

export function PerfHud() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ops, setOps] = useState<PerfOp[]>([]);
  const [page, setPage] = useState<PagePerf>(getPerfSnapshot().page);
  const [flash, setFlash] = useState<Flash | null>(null);
  const announcedLoad = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    announcedLoad.current = null;
    setFlash(null);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    resetPagePerf(pathname);
  }, [pathname]);

  useEffect(() => {
    const sync = () => {
      const snap = getPerfSnapshot();
      setOps(snap.ops);
      setPage(snap.page);

      // โชว์ข้อความสั้นเมื่อโหลดหน้าเสร็จครั้งแรกของ route นี้
      if (
        snap.page.pending === 0 &&
        snap.page.loadMs != null &&
        announcedLoad.current !== snap.page.loadMs
      ) {
        announcedLoad.current = snap.page.loadMs;
        const copy = perfStatusCopy(snap.page.loadMs);
        setFlash({
          id: Date.now(),
          tone: copy.tone,
          tag: copy.tag,
          title: copy.title,
          tip: copy.tip,
        });
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setFlash(null), 3200);
      }
    };
    sync();
    return subscribePerf(sync);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const last = ops[0] || null;
  const pageTone = perfTone(page.loadMs);
  const lastTone = perfTone(last?.clientMs);
  const loading = page.pending > 0;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex max-w-[min(100vw-1.5rem,22rem)] flex-col items-end gap-2">
      {flash ? (
        <div
          key={flash.id}
          role="status"
          className={`pointer-events-none animate-[fadeUp_.35s_ease-out] rounded-2xl border px-3 py-2.5 shadow-lg shadow-slate-900/10 ${toastShell[flash.tone]}`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toastTag[flash.tone]}`}
            >
              {flash.tag}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-snug">{flash.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug opacity-80">
                {flash.tip}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-border bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <p className="text-xs font-bold text-slate-900">
                เวลาโหลดหน้า / Sheets API
              </p>
              <p className="text-[11px] text-slate-500">
                แสดงความเร็วโหลดหน้าและ API
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-muted"
            >
              ปิด
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-border bg-slate-50/80 px-3 py-2.5 text-xs">
            <div>
              <p className="text-slate-500">โหลดหน้านี้</p>
              <p className={`font-semibold tabular-nums ${toneClass[pageTone]}`}>
                {loading ? "กำลังโหลด…" : formatMs(page.loadMs)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">API ล่าสุด</p>
              <p className={`font-semibold tabular-nums ${toneClass[lastTone]}`}>
                {last ? formatMs(last.clientMs) : "—"}
              </p>
            </div>
          </div>

          <ul className="max-h-64 divide-y divide-border overflow-y-auto">
            {ops.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                ยังไม่มีคำขอในรอบนี้
              </li>
            ) : (
              ops.map((op) => {
                const tone = perfTone(op.clientMs);
                return (
                  <li key={op.id} className="px-3 py-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {op.label}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {op.method} {op.path}
                          {op.status ? ` · ${op.status}` : " · ล้มเหลว"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`font-bold tabular-nums ${toneClass[tone]}`}
                        >
                          {formatMs(op.clientMs)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          server {formatMs(op.serverMs)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <p className="border-t border-border px-3 py-2 text-[10px] leading-relaxed text-slate-400">
            Good &lt;0.8s · OK &lt;2s · Slow ≥2s · server ส่วนใหญ่คือ Google
            Sheets
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md shadow-slate-900/10 backdrop-blur hover:bg-white"
        title="เปิดสถิติเวลาโหลด / Google Sheets"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading ? "animate-pulse bg-sky-500" : toneDot[pageTone]
          }`}
        />
        <span
          className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase ${
            loading
              ? "bg-sky-100 text-sky-700"
              : `${toastTag[pageTone]} !normal-case`
          }`}
        >
          {loading ? "…" : perfStatusCopy(page.loadMs).tag}
        </span>
        <span className="tabular-nums">
          {loading ? "กำลังโหลด" : formatMs(page.loadMs)}
        </span>
      </button>
    </div>
  );
}
