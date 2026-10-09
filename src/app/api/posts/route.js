import { COMING_SOON } from "@/lib/coming-soon";
import { requireAdmin } from "@/lib/require-admin";
import { createPost } from "@/services/posts/actions";
import { getLatestPosts } from "@/services/posts/queries";
import { parsePostInput } from "@/services/posts/validation";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function badRequest(error) {
  return NextResponse.json({ error }, { status: 400 });
}

/**
 * Public: newest published posts for the main site's "Latest writing" section.
 * The response shape is a contract with the main site — see docs/design-brief.md §8.
 */
export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = Number(raw);
  const limit =
    raw !== null &&
    Number.isInteger(parsed) &&
    parsed >= 1 &&
    parsed <= MAX_LIMIT
      ? parsed
      : DEFAULT_LIMIT;

  try {
    // Nothing to link to while the blog shows the "coming soon" page.
    const posts = COMING_SOON ? [] : await getLatestPosts(limit);

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Latest posts error:", error);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { data, error } = parsePostInput(body);
  if (error) return badRequest(error);

  try {
    const post = await createPost(data);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
