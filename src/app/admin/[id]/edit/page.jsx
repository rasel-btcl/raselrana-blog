import PostEditor from "@/components/blog/PostEditor";
import { getAllTagNames, getPostById } from "@/services/posts/queries";
import { isValidPostId } from "@/services/posts/validation";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }) {
  const { id } = await params;
  if (!isValidPostId(id)) notFound();

  const [post, tagSuggestions] = await Promise.all([
    getPostById(id),
    getAllTagNames(),
  ]);
  if (!post) notFound();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
          Edit post
        </h1>
        {post.published && (
          <Link
            href={`/posts/${post.slug}`}
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
          tags: post.tags,
          coverUrl: post.coverUrl,
          coverPublicId: post.coverPublicId,
          content: post.content,
          published: post.published,
        }}
        tagSuggestions={tagSuggestions}
      />
    </>
  );
}
