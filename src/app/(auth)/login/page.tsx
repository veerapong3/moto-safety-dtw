"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PerfHud } from "@/components/perf-hud";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#bfdbfe_0%,_transparent_45%),radial-gradient(circle_at_bottom_left,_#dbeafe_0%,_transparent_40%)]" />
      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-xl font-bold text-white">
              <i className="fa-solid fa-motorcycle" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MOTO-Safety</h1>
            <p className="mt-1 text-sm text-slate-500">เข้าสู่ระบบผู้ดูแล</p>
            <p className="mt-0.5 text-xs text-slate-400">โรงเรียนดอนตาลวิทยา</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="ชื่อผู้ใช้">
              <Input name="username" autoComplete="username" required />
            </Field>
            <Field label="รหัสผ่าน">
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                >
                  <i
                    className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  />
                </button>
              </div>
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link href="/" className="text-blue-600 hover:underline">
              กลับหน้าหลัก
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
      <PerfHud />
    </div>
  );
}
