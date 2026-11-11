"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageLoader } from "@/components/page-loader";

/** Brief branded splash on mount for pages without async data gates. */
export function PageSplash({
  children,
  label = "กำลังโหลดหน้า...",
  minMs = 350,
}: {
  children: ReactNode;
  label?: string;
  minMs?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), minMs);
    return () => clearTimeout(id);
  }, [minMs]);

  if (!ready) return <PageLoader label={label} />;
  return <>{children}</>;
}
