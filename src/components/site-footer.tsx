const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "0.1.0";
const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD?.trim() || "dev";
const DEVELOPER = "Dev V.tak";

type SiteFooterProps = {
  schoolName?: string;
  appName?: string;
  affiliation?: string;
  className?: string;
};

export function SiteFooter({
  schoolName = "โรงเรียนดอนตาลวิทยา",
  appName = "MOTO-Safety",
  affiliation = "งานความปลอดภัยในสถานศึกษา · สพม.มุกดาหาร",
  className = "",
}: SiteFooterProps) {
  const yearBe = new Date().getFullYear() + 543;

  return (
    <footer
      className={`mt-auto shrink-0 bg-[linear-gradient(135deg,#1e40af_0%,#1e3a8a_55%,#0f2866_100%)] text-[rgba(239,246,255,0.85)] shadow-[inset_0_3px_0_#93c5fd] ${className}`}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-4 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-7 md:py-[1.125rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/20 bg-white/15 text-[#eff6ff]"
            aria-hidden
          >
            <i className="fa-solid fa-motorcycle text-sm" />
          </span>
          <div className="min-w-0">
            <strong className="block text-base font-bold leading-snug text-[#eff6ff]">
              {schoolName}
            </strong>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[rgba(239,246,255,0.72)]">
              {affiliation} · ระบบ {appName}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2.5 text-left md:items-end md:text-right">
          <p className="m-0 text-[0.8125rem] text-[rgba(239,246,255,0.72)]">
            สงวนลิขสิทธิ์ พ.ศ. {yearBe} · ใช้ภายในสถานศึกษา
          </p>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1.5 text-[0.72rem] font-semibold text-[rgba(239,246,255,0.9)]"
              title={`เวอร์ชันระบบ v${APP_VERSION} · build ${APP_BUILD}`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(147,197,253,0.28)] px-1.5 py-0.5 font-bold tabular-nums text-[#dbeafe]">
                <span>v{APP_VERSION}</span>
                <span className="font-semibold text-[rgba(219,234,254,0.7)]">
                  ·
                </span>
                <span className="font-semibold tracking-wide">
                  build {APP_BUILD}
                </span>
              </span>
            </span>

            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-1.5 pr-2.5 text-[0.72rem] font-semibold text-[rgba(239,246,255,0.82)]"
              title="ผู้พัฒนา"
            >
              <span className="grid h-[1.35rem] w-[1.35rem] place-items-center rounded-full bg-[rgba(147,197,253,0.28)] text-[#dbeafe]">
                <i className="fa-solid fa-user-pen text-[10px]" />
              </span>
              <span className="text-[rgba(239,246,255,0.55)]">ผู้พัฒนา</span>
              <span className="font-semibold text-[#eff6ff]">{DEVELOPER}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
