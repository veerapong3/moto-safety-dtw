"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicConfig } from "@/lib/types";

export default function SystemClosedPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto my-8 max-w-2xl sm:my-16">
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
        <div className="flex flex-col items-center p-8 text-center sm:p-12">
          <div className="relative mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50 text-amber-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-20" />
            <i className="fa-solid fa-hourglass-half text-4xl" />
          </div>
          <span className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-sm">
            Registration Temporarily Closed
          </span>
          <h2 className="mb-4 text-2xl font-extrabold leading-tight text-slate-800 sm:text-3xl">
            ขณะนี้ระบบปิดรับข้อมูลชั่วคราว
          </h2>
          <div className="mx-auto mb-8 max-w-md space-y-3">
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {config?.closedMessage ||
                "งานระบบสารสนเทศและความปลอดภัยการใช้รถจักรยานยนต์ของโรงเรียน ได้ทำการปิดระบบลงทะเบียนสำหรับนักเรียนชั่วคราว"}
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              หากมีความจำเป็น กรุณาติดต่อฝ่ายปกครองหรือผู้ดูแลระบบของสถานศึกษาโดยตรง
            </p>
          </div>
          <div className="my-6 w-full border-t border-slate-100" />
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-700 sm:w-auto"
            >
              <i className="fa-solid fa-house mr-2" />
              กลับหน้าหลักระบบ
            </Link>
            {config?.contactEmail && (
              <a
                href={`mailto:${config.contactEmail}`}
                className="flex w-full items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
              >
                <i className="fa-solid fa-envelope mr-2" />
                ติดต่อผู้ช่วยเทคนิค
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
