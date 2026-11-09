import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "motosafety_session";

const PUBLIC_PATHS = [
  "/",
  "/form",
  "/guide",
  "/system-closed",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/config",
  "/api/dashboard/stats",
  "/api/registrations/check-plate",
  "/api/files",
];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Public POST create registration
  if (pathname === "/api/registrations" && request.method === "POST") {
    return NextResponse.next();
  }

  // Public upload only during open registration is checked in route
  if (pathname === "/api/upload" && request.method === "POST") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSecret();
  let valid = false;

  if (token && secret) {
    try {
      await jwtVerify(token, secret);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (valid && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
