"use client";

import { Suspense } from "react";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/route-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      {children}
      <Toaster richColors position="bottom-right" />
    </>
  );
}
