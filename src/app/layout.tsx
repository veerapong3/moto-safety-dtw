import type { Metadata } from "next";
import { Kanit, Sarabun } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "ระบบสารสนเทศความปลอดภัยรถจักรยานยนต์",
  description: "MOTO-Safety DTW_School — โรงเรียนดอนตาลวิทยา",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body
        className={`${sarabun.variable} ${kanit.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
