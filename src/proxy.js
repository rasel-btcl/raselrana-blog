// proxy.js (project root — replaces middleware.js on Next.js 16+)
import { auth } from "@/lib/auth";

import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isOnAdmin = pathname.startsWith("/admin") && !isLoginPage;

  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
