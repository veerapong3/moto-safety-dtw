"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PerfHud } from "@/components/perf-hud";
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
    <div className="relative flex min-h-screen overflow-hidden bg-[#0b1f4a] text-white lg:bg-slate-50 lg:text-slate-900">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(59,130,246,0.45),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(14,165,233,0.18),transparent_45%),linear-gradient(160deg,#0b1f4a_0%,#12306b_48%,#1e40af_100%)] lg:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:48px_48px] lg:hidden"
      />

      {/* Brand panel (desktop) */}
      <aside className="relative hidden w-[48%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(96,165,250,0.35),transparent_55%),radial-gradient(ellipse_at_80%_90%,rgba(14,165,233,0.2),transparent_40%),linear-gradient(155deg,#0b1f4a_0%,#12306b_42%,#1e3a8a_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.95)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.95)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div
          aria-hidden
          className="absolute -right-16 top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -right-4 top-40 h-48 w-48 rounded-full border border-white/10"
        />

        <div className="relative animate-[fadeUp_.55s_ease-out]">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-white/90 transition hover:text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-lg shadow-blue-950/30">
              <i className="fa-solid fa-motorcycle text-lg" />
            </span>
            <span className="text-sm font-semibold tracking-wide">
              กลับหน้าหลัก
            </span>
          </Link>
        </div>

        <div className="relative max-w-md animate-[fadeUp_.7s_ease-out] text-white">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-sky-200/90">
            DTW School Safety
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            MOTO-Safety
            <span className="mt-2 block text-2xl font-semibold text-blue-100/90 xl:text-3xl">
              ระบบผู้ดูแล
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-blue-100/80">
            จัดการข้อมูลรถจักรยานยนต์นักเรียน
            เปิด–ปิดรับลงทะเบียน และติดตามความปลอดภัยในโรงเรียนดอนตาลวิทยา
          </p>
        </div>

        <p className="relative text-xs text-blue-200/70">
          งานความปลอดภัยในสถานศึกษา · สพม.มุกดาหาร
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:bg-slate-50 lg:px-12 xl:px-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,transparent_42%)] lg:block"
        />

        <div className="relative mx-auto w-full max-w-[420px] animate-[fadeUp_.6s_ease-out]">
          <div className="mb-8 lg:hidden">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-100/90"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              กลับหน้าหลัก
            </Link>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-lg shadow-blue-950/25">
              <i className="fa-solid fa-motorcycle text-xl" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              MOTO-Safety
            </h1>
            <p className="mt-2 text-sm text-blue-100/80">
              เข้าสู่ระบบผู้ดูแล · โรงเรียนดอนตาลวิทยา
            </p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              เข้าสู่ระบบ
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              สำหรับผู้ดูแลระบบความปลอดภัยรถจักรยานยนต์
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-5 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-md lg:mt-8 lg:border-slate-200/80 lg:bg-white lg:p-0 lg:shadow-none lg:backdrop-blur-0"
          >
            <label className="block space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-blue-100 lg:text-slate-600">
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
                  className="w-full rounded-2xl border border-white/20 bg-white/95 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 lg:border-slate-200 lg:bg-slate-50 lg:focus:bg-white"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-blue-100 lg:text-slate-600">
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
                  className="w-full rounded-2xl border border-white/20 bg-white/95 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 lg:border-slate-200 lg:bg-slate-50 lg:focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 lg:shadow-blue-700/20"
            >
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-gradient-to-t from-sky-400/20 to-transparent transition duration-500 group-hover:translate-y-0"
              />
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <i className="fa-solid fa-arrow-right transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-blue-100/70 lg:text-slate-400">
            © {new Date().getFullYear()} MOTO-Safety DTW_School
          </p>
        </div>
      </main>

      <PerfHud />
    </div>
  );
}
