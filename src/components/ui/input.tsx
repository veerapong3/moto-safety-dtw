import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${props.className || ""}`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClass} ${props.className || ""}`} {...props} />;
}
