"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "หน้าหลัก", icon: "fa-house", match: "exact" as const },
  { href: "/#stats", label: "สถิติ", icon: "fa-chart-column", match: "hash" as const },
  { href: "/form", label: "ลงทะเบียน", icon: "fa-pen-to-square", match: "prefix" as const },
  { href: "/admin", label: "ผู้ดูแล", icon: "fa-user-shield", match: "prefix" as const },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/school-mark.jpg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div className="min-w-0">
            <span className="font-display block truncate text-[15px] font-bold leading-tight text-[#1d4ed8] sm:text-base">
              MOTO-SafetyDTW
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              DTW School · โรงเรียนดอนตาลวิทยา
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.match === "exact"
                ? pathname === "/"
                : l.match === "prefix"
                  ? pathname.startsWith(l.href)
                  : false;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#2563eb] text-white shadow-sm shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <i className={`fa-solid ${l.icon} text-xs opacity-80`} />
                {l.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className={`fa-solid ${l.icon} mr-2 text-blue-600`} />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
