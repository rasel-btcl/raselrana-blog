// Next.js 16 request proxy (replaces middleware.js)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// The request Auth.js hands over has lost the Next.js basePath, so add it back.
const LOGIN_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
