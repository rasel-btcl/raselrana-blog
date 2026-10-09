import { canSetStatus } from "@/lib/authz";
import { requireApiUser } from "@/lib/require-admin";
import { createPost, PostError } from "@/services/posts/actions";
import { getPostsForMainSite } from "@/services/posts/queries";
import { parsePostInput } from "@/services/posts/validation";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function fail(status, error) {
  return NextResponse.json({ error }, { status });
}

/**
 * Public: newest posts for the main site's "Latest writing" section.
 * Only posts with "Show on main site" switched on are returned.
 * The response shape is a contract with the main site — see docs/main-site-api.md.
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
    const posts = await getPostsForMainSite(limit);

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
    return fail(500, "Failed to load posts");
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

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
    const post = await createPost(data, user);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof PostError) return fail(error.status, error.message);
    if (error?.code === "P2002") {
      return fail(409, "A post with this slug already exists");
    }

    console.error("Post creation error:", error);
    return fail(500, "Failed to create post");
  }
}
