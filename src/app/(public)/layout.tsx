import { PerfHud } from "@/components/perf-hud";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <SiteFooter />
      <PerfHud />
    </div>
  );
}
