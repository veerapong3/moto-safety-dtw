"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "หน้าแรก", icon: "fa-house" },
  { href: "/form", label: "ลงทะเบียน", icon: "fa-clipboard-list" },
  { href: "/admin", label: "ผู้ดูแล", icon: "fa-user-shield" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-950/30 bg-[#0b1f4d]/95 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 font-bold text-slate-900 shadow-inner">
            <i className="fa-solid fa-motorcycle text-lg" />
          </div>
          <div>
            <span className="font-display block text-lg font-bold tracking-tight sm:inline">
              MOTO-Safety
            </span>
            <span className="ml-0 block text-xs text-blue-200/80 sm:ml-2 sm:inline">
              DTW School
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-blue-100/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <i className={`fa-solid ${l.icon} mr-1.5 opacity-80`} />
                {l.label}
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
        <div className="border-t border-white/10 bg-[#0a1a40] md:hidden">
          <div className="space-y-1 px-3 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-base font-medium hover:bg-white/10"
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
