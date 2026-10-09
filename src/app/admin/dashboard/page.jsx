import DeletePostButton from "@/components/admin/DeletePostButton";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/posts";
import { buttonPrimary, buttonSmall, chip, metaLine, pageLabel } from "@/lib/ui";
import { getAllPostsForAdmin } from "@/services/posts/queries";
import Link from "next/link";

export const metadata = { title: "Posts" };

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const [session, posts] = await Promise.all([auth(), getAllPostsForAdmin()]);
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={pageLabel}>
            <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
            Signed in as {session?.user?.name ?? session?.user?.email}
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Posts
          </h1>
        </div>
        <Link href="/admin/new-post" className={buttonPrimary}>
          New post
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="All posts" value={posts.length} />
        <Stat label="Published" value={publishedCount} />
        <Stat label="Drafts" value={posts.length - publishedCount} />
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {posts.length === 0 ? (
          <p className="p-7 text-sm text-[var(--slate)]">
            No posts yet. Write the first one.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-4 p-6"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`${chip} ${
                        post.published
                          ? "border-[var(--signal)] text-[var(--signal)]"
                          : ""
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <Link
                      href={`/admin/${post.id}/edit`}
                      className="font-display text-lg font-medium text-[var(--ink)] transition-colors hover:text-[var(--signal)]"
                    >
                      {post.title}
                    </Link>
                  </div>
                  <p className={`${metaLine} mt-2 break-all`}>
                    /{post.slug}
                    {post.published && post.publishedAt
                      ? ` · published ${formatDate(post.publishedAt)}`
                      : ""}
                    {` · edited ${formatDate(post.updatedAt)}`}
                    {post.tags.length > 0 ? ` · ${post.tags.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.published && (
                    <Link href={`/posts/${post.slug}`} className={buttonSmall}>
                      View
                    </Link>
                  )}
                  <Link href={`/admin/${post.id}/edit`} className={buttonSmall}>
                    Edit
                  </Link>
                  <DeletePostButton id={post.id} title={post.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
