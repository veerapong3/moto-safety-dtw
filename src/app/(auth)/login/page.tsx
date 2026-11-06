"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PerfHud } from "@/components/perf-hud";
import { SiteFooter } from "@/components/site-footer";
import { timedFetch } from "@/lib/perf-client";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await timedFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      toast.success(`ยินดีต้อนรับ ${data.user.display_name}`);
      const next = search.get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext && safeNext !== "/" ? safeNext : "/admin");
      router.refresh();
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(59,130,246,0.22),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.7),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
      />

      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="animate-fade-up w-full max-w-[400px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]">
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-sky-500 to-amber-400" />

          <div className="px-7 pb-8 pt-7 sm:px-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-700/30">
                <i className="fa-solid fa-motorcycle text-xl" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                MOTO-Safety
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                เข้าสู่ระบบผู้ดูแล
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                โรงเรียนดอนตาลวิทยา · DTW School
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  ชื่อผู้ใช้
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <i className="fa-solid fa-user text-sm" />
                  </span>
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    placeholder="admin"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  รหัสผ่าน
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <i className="fa-solid fa-lock text-sm" />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    tabIndex={-1}
                  >
                    <i
                      className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-700/25 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link
                href="/"
                className="font-medium text-blue-700 hover:underline"
              >
                ← กลับหน้าแรก
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SiteFooter className="relative z-10" />
      <PerfHud />
    </div>
  );
}
