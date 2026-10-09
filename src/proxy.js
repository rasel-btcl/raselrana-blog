// Next.js 16 request proxy (replaces middleware.js)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// The request Auth.js hands over has lost the Next.js basePath, so add it back.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LOGIN_PATH = "/admin/login";

export default auth((req) => {
  // Depending on the wrapper, the path may or may not still carry the base path.
  const onLoginPage = req.nextUrl.pathname.endsWith(LOGIN_PATH);
  const to = (path) =>
    NextResponse.redirect(new URL(`${BASE_PATH}${path}`, req.nextUrl.origin));

  // The cookie is only a first filter here; pages and handlers check the user
  // against the database (src/lib/authz.js).
  // (No redirect away from the sign-in page for a signed-in visitor: a disabled
  // account still has a cookie, and would bounce between the two pages forever.)
  if (!req.auth && !onLoginPage) return to(LOGIN_PATH);
});

export const config = {
  matcher: ["/admin/:path*"],
};
