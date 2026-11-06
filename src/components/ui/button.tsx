import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-blue-700 text-white hover:bg-blue-800 shadow-sm disabled:opacity-60",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
