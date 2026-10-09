import { contentTypeByValue } from "@/lib/content-types";
import { categoryPath, postPath, tagPath, typePath } from "@/lib/posts";
import { revalidatePath } from "next/cache";

/**
 * Refresh the public pages a post appears on (docs/BLOG_ADMIN_SPEC.md §6.7).
 * Pass every version of the post involved in the change (before and after an edit),
 * so pages it has just left are refreshed too. Paths are written without /blog.
 */
export function revalidatePosts(...posts) {
  const paths = new Set(["/", "/tags", "/sitemap.xml"]);

  for (const post of posts) {
    if (!post) continue;

    paths.add(postPath(post.slug));
    if (post.category?.slug) paths.add(categoryPath(post.category.slug));

    const type = contentTypeByValue(post.contentType);
    if (type) paths.add(typePath(type.slug));

    for (const tag of post.tags ?? []) paths.add(tagPath(tag.slug));
  }

  for (const path of paths) revalidatePath(path);
}
