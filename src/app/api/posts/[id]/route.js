import { requireAdmin } from "@/lib/require-admin";
import { deletePost, updatePost } from "@/services/posts/actions";
import { isValidPostId, parsePostInput } from "@/services/posts/validation";
import { NextResponse } from "next/server";

function notFound() {
  return NextResponse.json({ error: "Post not found" }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!isValidPostId(id)) return notFound();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = parsePostInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const post = await updatePost(id, data);
    if (!post) return notFound();
    return NextResponse.json({ post });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      );
    }

    console.error("Post update error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!isValidPostId(id)) return notFound();

  try {
    const deleted = await deletePost(id);
    if (!deleted) return notFound();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
