import { prisma } from "./prisma";

// docs/BLOG_ADMIN_SPEC.md §6.6: block after 5 failed attempts in 15 minutes for the
// same email + IP; forget attempts after 24 hours.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const KEEP_MS = 24 * 60 * 60 * 1000;

export function loginAttemptKey(email, request) {
  const forwarded = request?.headers?.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0].trim() ||
    request?.headers?.get("x-real-ip") ||
    "unknown";
  return `${email.slice(0, 254)}:${ip}`;
}

/** True when this email + IP has used up its failed attempts. */
export async function isLoginBlocked(key) {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // A successful sign-in starts the count again.
  const lastSuccess = await prisma.loginAttempt.findFirst({
    where: { key, success: true, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const failures = await prisma.loginAttempt.count({
    where: {
      key,
      success: false,
      createdAt: { gt: lastSuccess?.createdAt ?? windowStart },
    },
  });

  return failures >= MAX_FAILURES;
}

export async function recordLoginAttempt(key, success) {
  await prisma.loginAttempt.create({ data: { key, success } });

  // Opportunistic clean-up; a failure here must not break signing in.
  await prisma.loginAttempt
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } })
    .catch(() => {});
}
