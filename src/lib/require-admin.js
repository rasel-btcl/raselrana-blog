import { NextResponse } from "next/server";
import { AuthzError, requireRole, requireUser } from "./authz";

// Guards for API route handlers, built on src/lib/authz.js. Each returns `{ user }`,
// or `{ response }` holding the 401/403 to send back.

async function guard(check) {
  try {
    return { user: await check() };
  } catch (error) {
    if (error instanceof AuthzError) {
      return {
        response: NextResponse.json(
          { error: error.message },
          { status: error.status },
        ),
      };
    }
    throw error;
  }
}

/** Any signed-in, active user. */
export function requireApiUser() {
  return guard(() => requireUser());
}

/** A signed-in, active ADMIN. */
export function requireAdmin() {
  return guard(() => requireRole("ADMIN"));
}
