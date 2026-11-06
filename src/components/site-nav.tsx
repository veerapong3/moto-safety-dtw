"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "หน้าแรก" },
  { href: "/form", label: "ลงทะเบียน" },
  { href: "/admin", label: "ผู้ดูแล" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fafafa]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-0">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-tight text-slate-900"
        >
          MOTO-Safety
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition ${
                  active
                    ? "font-semibold text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-900 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 md:hidden">
          <div className="mx-auto max-w-2xl space-y-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm text-slate-700"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
