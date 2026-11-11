type PageLoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export function PageLoader({
  label = "กำลังโหลดหน้า...",
  fullScreen = false,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        fullScreen
          ? "fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/90 backdrop-blur-sm"
          : "flex min-h-[55vh] w-full items-center justify-center py-16"
      }
    >
      <div className="page-loader relative w-full max-w-sm px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]"
        >
          <div className="page-loader-glow absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="page-loader-glow-delay absolute bottom-4 left-1/3 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl" />
        </div>

        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <span
            aria-hidden
            className="page-loader-ring absolute inset-0 rounded-full border-2 border-blue-200/70"
          />
          <span
            aria-hidden
            className="page-loader-ring-delay absolute inset-3 rounded-full border border-dashed border-blue-300/80"
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-900/25">
            <i className="fa-solid fa-motorcycle page-loader-bike text-2xl" />
          </div>
        </div>

        <div className="page-loader-road mx-auto mb-5 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200">
          <div className="page-loader-road-bar h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-yellow-400" />
        </div>

        <p
          className="text-lg font-semibold tracking-wide text-slate-800"
          style={{ fontFamily: "var(--font-kanit), sans-serif" }}
        >
          MOTO-Safety
        </p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
