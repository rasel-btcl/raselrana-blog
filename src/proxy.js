// Next.js 16 request proxy (replaces middleware.js)
import { auth } from "@/lib/auth";
import { COMING_SOON } from "@/lib/coming-soon";
import { NextResponse } from "next/server";

// The request Auth.js hands over has lost the Next.js basePath, so add it back.
const LOGIN_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;

const adminProxy = auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.nextUrl.origin));
  }
});

// Still reachable while the blog is closed, so the owner can sign in and write.
const OPEN_WHILE_COMING_SOON = ["/login", "/coming-soon"];

export default function proxy(req, event) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminProxy(req, event);
  }

  if (COMING_SOON && !OPEN_WHILE_COMING_SOON.includes(pathname)) {
    // A rewrite, not a redirect: the address stays, and it works again at launch.
    const url = req.nextUrl.clone();
    url.pathname = "/coming-soon";
    url.search = "";
    return NextResponse.rewrite(url);
  }
}

export const config = {
  // Every page, but not the API, Next.js internals or files (anything with a dot).
  // The home page is listed by itself: with a basePath the pattern does not match it.
  matcher: ["/", "/((?!api|_next|.*\\..*).*)"],
};
