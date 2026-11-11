"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar on client navigations so route changes feel responsive
 * even when segment loading UI is brief.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const first = useRef(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);

    setDone(false);
    setActive(true);

    finishTimer.current = setTimeout(() => {
      setDone(true);
      hideTimer.current = setTimeout(() => {
        setActive(false);
        setDone(false);
      }, 280);
    }, 420);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, [pathname, searchParams]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden"
    >
      <div
        className={`h-full origin-left bg-gradient-to-r from-blue-600 via-sky-400 to-yellow-400 shadow-[0_0_12px_rgba(37,99,235,0.55)] transition-[width,opacity] duration-300 ease-out ${
          done ? "w-full opacity-0" : "w-[72%] opacity-100"
        }`}
        style={{
          width: done ? "100%" : undefined,
          animation: done ? undefined : "routeProgressGrow 0.9s ease-out forwards",
        }}
      />
    </div>
  );
}
