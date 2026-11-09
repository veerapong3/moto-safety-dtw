import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold tracking-wide text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base transition hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${props.className || ""}`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClass} ${props.className || ""}`} {...props} />;
}
