"use server";

import { AuthzError, requireRole, requireUser } from "@/lib/authz";
import {
  archivePost,
  duplicatePost,
  PostError,
  unarchivePost,
} from "@/services/posts/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Server actions can be called directly, without going through the page, so each one
// checks the user and validates its input itself (docs/BLOG_ADMIN_SPEC.md §6.5, §9).

const idSchema = z.string().regex(/^[a-f0-9]{24}$/i);

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
}

/** Runs the work; problems the user can understand are swallowed after a refresh. */
async function run(id, check, work) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;

  try {
    const user = await check();
    await work(parsed.data, user);
  } catch (error) {
    // Signed out, not allowed, or the post is gone: the refreshed list shows the truth.
    if (!(error instanceof AuthzError) && !(error instanceof PostError)) {
      throw error;
    }
  }
  refreshAdmin();
}

export async function archivePostAction(id) {
  await run(id, () => requireRole("ADMIN"), (postId) => archivePost(postId));
}

export async function unarchivePostAction(id) {
  await run(id, () => requireRole("ADMIN"), (postId) => unarchivePost(postId));
}

export async function duplicatePostAction(id) {
  let copyId = null;
  await run(
    id,
    () => requireUser(),
    async (postId, user) => {
      copyId = (await duplicatePost(postId, user)).id;
    },
  );
  // Open the copy straight away. redirect() must be called outside try/catch.
  if (copyId) redirect(`/admin/posts/${copyId}/edit`);
}
