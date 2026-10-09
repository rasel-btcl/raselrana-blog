import { SLUG_PATTERN } from "@/lib/posts";
import { requireApiUser } from "@/lib/require-admin";
import { isSlugTaken, RESERVED_SLUGS } from "@/services/posts/slugs";
import { isValidObjectId } from "@/services/posts/validation";
import { NextResponse } from "next/server";

/**
 * For the editor's pre-publish checklist: may this slug be used?
 * `?slug=…&except=<post id>` → `{ available, reason }`.
 */
export async function GET(request) {
  const { response } = await requireApiUser();
  if (response) return response;

  const params = new URL(request.url).searchParams;
  const slug = (params.get("slug") ?? "").trim().toLowerCase();
  const except = params.get("except");

  if (!slug || slug.length > 120 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({
      available: false,
      reason: "Slug may only contain lowercase letters, numbers and single hyphens",
    });
  }
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false, reason: "That slug is reserved" });
  }

  const taken = await isSlugTaken(slug, isValidObjectId(except) ? except : null);
  return NextResponse.json({
    available: !taken,
    reason: taken ? "Another post uses (or used) this slug" : null,
  });
}
