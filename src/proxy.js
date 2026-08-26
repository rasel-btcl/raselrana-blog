import { NextResponse } from "next/server";

export function proxy(request) {
  // your logic here
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // whatever paths you're targeting
};
