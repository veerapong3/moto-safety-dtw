import { Suspense } from "react";
import { PageLoader } from "@/components/page-loader";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoader label="กำลังเปิดหน้าเข้าสู่ระบบ..." />}>
      {children}
    </Suspense>
  );
}
