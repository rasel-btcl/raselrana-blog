import { cache } from "react";
import { auth } from "./auth";
import { prisma } from "./prisma";

/** Thrown by the helpers below. `status` is the HTTP status to answer with. */
export class AuthzError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

/**
 * The signed-in user, read from the database (not from the session cookie), so a
 * changed role or a disabled account takes effect at once. `null` when signed out
 * or inactive. Cached for the length of one request.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return user?.isActive ? user : null;
});

/** Signed in and active, or throws AuthzError(401). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError(401, "Unauthorized");
  return user;
}

/** Signed in with the given role (e.g. "ADMIN"), or throws AuthzError(401 / 403). */
export async function requireRole(role) {
  const user = await requireUser();
  if (user.role !== role) throw new AuthzError(403, "Forbidden");
  return user;
}

/**
 * ADMIN can edit any post. AUTHOR can edit only their own posts, and only while
 * the post is not published.
 */
export function canEditPost(user, post) {
  if (!user || !post) return false;
  if (user.role === "ADMIN") return true;
  return (
    user.role === "AUTHOR" &&
    post.authorId === user.id &&
    post.status !== "PUBLISHED"
  );
}

/** Only ADMIN may publish, schedule or archive. */
export function canSetStatus(user, status) {
  return status === "DRAFT" || user?.role === "ADMIN";
}
