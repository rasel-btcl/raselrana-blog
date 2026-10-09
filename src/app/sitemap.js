import { CONTENT_TYPES } from "@/lib/content-types";
import { BLOG_URL, categoryPath, postPath, tagPath, typePath } from "@/lib/posts";
import { getSitemapData } from "@/services/posts/queries";

// Served at /blog/sitemap.xml. Rebuilt at most every 5 minutes, so a scheduled post
// appears without anyone doing anything; saving a post also refreshes it at once.
export const revalidate = 300;

const MIN_POSTS_FOR_TAG_PAGE = 2;

/**
 * Only what readers may find through search (docs/BLOG_ADMIN_SPEC.md §8): listed
 * articles, and the category, content-type and topic pages that have posts.
 * Drafts, archived, not-yet-due and noindex posts are never here.
 */
export default async function sitemap() {
  const { posts, categories, types, tags } = await getSitemapData();
  const url = (path) => `${BLOG_URL}${path === "/" ? "" : path}`;
  const newest = posts[0]?.lastModified;

  return [
    { url: url("/"), lastModified: newest },
    { url: url("/tags"), lastModified: newest },
    { url: url("/about") },
    ...posts.map((post) => ({
      url: url(postPath(post.slug)),
      lastModified: post.lastModified,
    })),
    ...[...categories.keys()].map((slug) => ({ url: url(categoryPath(slug)) })),
    ...CONTENT_TYPES.filter((type) => types.has(type.value)).map((type) => ({
      url: url(typePath(type.slug)),
    })),
    ...[...tags]
      .filter(([, count]) => count >= MIN_POSTS_FOR_TAG_PAGE)
      .map(([slug]) => ({ url: url(tagPath(slug)) })),
  ];
}
