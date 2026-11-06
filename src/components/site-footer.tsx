const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "0.1.0";
const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD?.trim() || "dev";
const DEVELOPER = "Dev V.tak";

type SiteFooterProps = {
  schoolName?: string;
  appName?: string;
  className?: string;
};

export function SiteFooter({
  schoolName = "โรงเรียนดอนตาลวิทยา",
  appName = "MOTO-SafetyDTW",
  className = "",
}: SiteFooterProps) {
  return (
    <footer
      className={`mt-auto shrink-0 bg-[#0b2a6b] text-blue-100 ${className}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <i className="fa-solid fa-check text-sm" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug text-white">
              ความปลอดภัยเริ่มต้นที่ตัวเรา — สวมหมวกทุกครั้งก่อนขับขี่
            </p>
            <p className="mt-1 text-xs text-blue-200/80">
              {schoolName} · ระบบ {appName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:justify-end">
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold tabular-nums text-blue-100">
            v{APP_VERSION} · {APP_BUILD}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-blue-100">
            ผู้พัฒนา {DEVELOPER}
          </span>
        </div>
      </div>
    </footer>
  );
}
