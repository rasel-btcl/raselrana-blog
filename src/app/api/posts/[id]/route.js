import { canEditPost, canSetStatus } from "@/lib/authz";
import { requireAdmin, requireApiUser } from "@/lib/require-admin";
import { deletePost, PostError, updatePost } from "@/services/posts/actions";
import { getPostById } from "@/services/posts/queries";
import { isValidObjectId, parsePostInput } from "@/services/posts/validation";
import { NextResponse } from "next/server";

function fail(status, error) {
  return NextResponse.json({ error }, { status });
}

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail(404, "Post not found");

  const existing = await getPostById(id);
  if (!existing) return fail(404, "Post not found");
  if (!canEditPost(user, existing)) {
    return fail(403, "You cannot edit this post");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid JSON body");
  }

  const { data, error } = parsePostInput(body);
  if (error) return fail(400, error);
  if (!canSetStatus(user, data.status)) {
    return fail(403, "Only an admin can publish");
  }

  try {
    const post = await updatePost(existing, data);
    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof PostError) return fail(error.status, error.message);
    if (error?.code === "P2002") {
      return fail(409, "A post with this slug already exists");
    }

    console.error("Post update error:", error);
    return fail(500, "Failed to update post");
  }
}

export async function DELETE(request, { params }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail(404, "Post not found");

  try {
    const deleted = await deletePost(id);
    if (!deleted) return fail(404, "Post not found");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return fail(500, "Failed to delete post");
  }
}
