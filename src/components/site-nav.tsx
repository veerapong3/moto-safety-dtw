"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: "fa-chart-pie" },
  { href: "/form", label: "ลงทะเบียน (นักเรียน)", icon: "fa-clipboard-list" },
  { href: "/admin", label: "ผู้ดูแลระบบ", icon: "fa-user-shield" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-blue-800 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-2 font-bold text-blue-800 shadow-inner">
            <i className="fa-solid fa-motorcycle text-xl" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-wider sm:inline">
              MOTO-Safety DTW_School
            </span>
            <span className="block text-xs text-blue-200 sm:hidden">
              ระบบสารสนเทศรถจักรยานยนต์
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-blue-700 ${
                  active ? "bg-blue-900" : ""
                }`}
              >
                <i className={`fa-solid ${l.icon} mr-1`} /> {l.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="p-2 text-blue-200 hover:text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-xl`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-blue-700 bg-blue-900 md:hidden">
          <div className="space-y-1 px-3 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium hover:bg-blue-800"
              >
                <i className={`fa-solid ${l.icon} mr-2`} />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
