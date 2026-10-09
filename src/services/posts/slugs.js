import { prisma } from "@/lib/prisma";

// Articles will live at /blog/<slug> (docs/BLOG_ADMIN_SPEC.md §4.4), so a slug must
// never equal a top-level route of the blog.
export const RESERVED_SLUGS = new Set([
  "about",
  "admin",
  "api",
  "author",
  "category",
  "feed",
  "login",
  "page",
  "posts",
  "preview",
  "search",
  "sitemap",
  "tag",
  "tags",
  "type",
]);

/**
 * True when another post uses this slug now, or used it before
 * (old slugs keep redirecting, so they stay taken).
 */
export async function isSlugTaken(slug, exceptPostId) {
  const other = await prisma.post.findFirst({
    where: {
      OR: [{ slug }, { previousSlugs: { has: slug } }],
      ...(exceptPostId ? { NOT: { id: exceptPostId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(other);
}

/**
 * The `previousSlugs` list to store when a post is saved with `newSlug`.
 * The old slug is remembered only if the post has ever been published
 * (nobody can have linked to a draft).
 */
export function nextPreviousSlugs(existing, newSlug) {
  const previous = existing.previousSlugs.filter((slug) => slug !== newSlug);
  const wasPublic = Boolean(
    existing.publishedAt && existing.publishedAt <= new Date(),
  );

  if (wasPublic && existing.slug !== newSlug && !previous.includes(existing.slug)) {
    previous.push(existing.slug);
  }
  return previous;
}
