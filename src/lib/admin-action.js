import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthzError, requireRole, requireUser } from "./authz";

/** A problem the person can fix; its message is shown to them. */
export class ActionError extends Error {}

/**
 * Runs the body of an admin form's server action and then returns to `back` with
 * either `?ok=<done>` or `?error=<message>`, which the page shows as a notice.
 * `done` may be a function, called after the work, when the text depends on the result.
 * It works without JavaScript, and nothing internal leaks: unexpected errors are
 * logged and replaced by a generic message.
 *
 * Server actions can be called without loading the page, so the user check lives
 * here: ADMIN by default, any signed-in user with `{ admin: false }`.
 */
export async function runAdminAction({ back, done, admin = true, work }) {
  let message = null;

  try {
    const user = admin ? await requireRole("ADMIN") : await requireUser();
    await work(user);
  } catch (error) {
    if (error instanceof AuthzError) {
      message = "You are not allowed to do that. Please sign in again.";
    } else if (error instanceof z.ZodError) {
      message = error.issues[0]?.message ?? "Please check the form.";
    } else if (error instanceof ActionError) {
      message = error.message;
    } else if (error?.code === "P2002") {
      message = "That name or slug is already in use.";
    } else {
      console.error("Admin action failed:", error);
      message = "Something went wrong. Please try again.";
    }
  }

  // redirect() works by throwing, so it must stay outside the try block.
  const query = message
    ? `error=${encodeURIComponent(message)}`
    : `ok=${encodeURIComponent(typeof done === "function" ? done() : done)}`;
  redirect(`${back}${back.includes("?") ? "&" : "?"}${query}`);
}

/** The notice to show, read from the page's search params. */
export function readNotice(params) {
  const text = (value) => (typeof value === "string" ? value.slice(0, 300) : "");
  if (text(params.error)) return { kind: "error", text: text(params.error) };
  if (text(params.ok)) return { kind: "ok", text: text(params.ok) };
  return null;
}
