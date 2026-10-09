import AuthorCard from "@/components/blog/AuthorCard";
import PostArticle from "@/components/blog/PostArticle";
import { canEditPost, getCurrentUser } from "@/lib/authz";
import { formatDateTime } from "@/lib/posts";
import { container } from "@/lib/ui";
import { getPostById } from "@/services/posts/queries";
import { isValidObjectId } from "@/services/posts/validation";
import Link from "next/link";
import { notFound } from "next/navigation";

// A private view of unpublished work: never cached, never indexed.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

const STATUS_NOTES = {
  DRAFT: "This post is a draft. Only you can see this page.",
  SCHEDULED: "This post is scheduled and not public yet.",
  ARCHIVED: "This post is archived and not public.",
  PUBLISHED: "This is the saved version of a published post.",
};

/**
 * The post exactly as readers will see it, in any status. Only for a signed-in user
 * who may edit it; everyone else gets the ordinary "not found" page, so the address
 * does not even confirm that the post exists.
 */
export default async function PreviewPage({ params }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const [user, post] = await Promise.all([getCurrentUser(), getPostById(id)]);
  if (!user || !post || !canEditPost(user, post)) notFound();

  return (
    <>
      <div className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div
          className={`${container} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3`}
        >
          <p className="text-sm text-[var(--ink)]">
            <span className="mr-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--signal)]">
              {post.status === "PUBLISHED"
                ? "Preview"
                : "Preview — not published"}
            </span>
            {STATUS_NOTES[post.status]}
            {post.status === "SCHEDULED" && post.publishedAt
              ? ` Goes live ${formatDateTime(post.publishedAt)}.`
              : ""}
          </p>
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="text-sm font-medium text-[var(--signal)] underline underline-offset-4"
          >
            Back to the editor
          </Link>
        </div>
      </div>

      <PostArticle post={post} />

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <AuthorCard author={post.author} />
        </div>
      </section>
    </>
  );
}
