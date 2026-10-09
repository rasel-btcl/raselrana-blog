import PostEditor from "@/components/blog/PostEditor";
import { canEditPost, getCurrentUser } from "@/lib/authz";
import { postPath } from "@/lib/posts";
import {
  getAllTagNames,
  getCategories,
  getPostById,
  getPostOptions,
} from "@/services/posts/queries";
import { isValidObjectId } from "@/services/posts/validation";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const [user, post, categories, tagSuggestions, postOptions] =
    await Promise.all([
      getCurrentUser(),
      getPostById(id),
      getCategories(),
      getAllTagNames(),
      getPostOptions(),
    ]);
  if (!post || !canEditPost(user, post)) notFound();
  const now = new Date();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
          Edit post
        </h1>
        {post.status === "PUBLISHED" && (
          <Link
            href={postPath(post.slug)}
            className="text-sm font-medium text-[var(--signal)] underline underline-offset-4"
          >
            View on the blog
          </Link>
        )}
      </div>
      {/* key: start from fresh state when a different post is opened */}
      <PostEditor
        key={post.id}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          categoryId: post.categoryId,
          contentType: post.contentType,
          tags: post.tags.map((tag) => tag.name),
          featuredImage: post.featuredImage,
          content: post.content,
          showOnMainSite: post.showOnMainSite,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          // Has it ever been public? Then a changed slug leaves a redirect behind.
          everPublic: Boolean(post.publishedAt && post.publishedAt <= now),
          relatedPostIds: post.relatedPostIds,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          ogImageUrl: post.ogImageUrl,
          canonicalUrl: post.canonicalUrl,
          noindex: post.noindex,
        }}
        categories={categories}
        tagSuggestions={tagSuggestions}
        postOptions={postOptions}
      />
    </>
  );
}
