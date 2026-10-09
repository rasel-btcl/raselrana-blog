import { NextResponse } from "next/server";
import { auth } from "./auth";

/**
 * Guard for API route handlers. Returns `{ session }` for a signed-in admin,
 * otherwise `{ response }` holding the 401/403 to send back.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}
