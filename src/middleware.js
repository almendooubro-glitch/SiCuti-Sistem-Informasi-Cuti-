import { NextResponse } from "next/server";

const SESSION_COOKIE = "sicuti_session";

export function middleware(request) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cuti/:path*",
    "/divisi/:path*",
    "/jenis-cuti/:path*",
    "/pengaturan/:path*",
    "/pengguna/:path*",
    "/profil/:path*",
    "/verifikasi/:path*",
  ],
};
