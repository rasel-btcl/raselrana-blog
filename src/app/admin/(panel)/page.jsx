import StatusBadge from "@/components/admin/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/posts";
import { buttonPrimary, metaLine, pageLabel } from "@/lib/ui";
import {
  getPostCounts,
  getPostsNeedingReview,
  getRecentlyEditedPosts,
  getUpcomingScheduledPosts,
} from "@/services/posts/queries";
import Link from "next/link";

export const metadata = { title: "Overview" };

const REVIEW_AFTER_MONTHS = 12;

function CountCard({ label, value, href }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--signal)]"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
        {value}
      </p>
    </Link>
  );
}

function Panel({ title, note, empty, children }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] px-6 py-4">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">
          {title}
        </h2>
        {note && <p className="mt-1 text-xs text-[var(--slate)]">{note}</p>}
      </div>
      {children ?? (
        <p className="px-6 py-5 text-sm text-[var(--slate)]">{empty}</p>
      )}
    </section>
  );
}

function PostRows({ posts, detail }) {
  return (
    <ul className="divide-y divide-[var(--line)]">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4"
        >
          <div className="min-w-0">
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="font-medium text-[var(--ink)] transition-colors hover:text-[var(--signal)]"
            >
              {post.title}
            </Link>
            <p className={`${metaLine} mt-1`}>{detail(post)}</p>
          </div>
          <StatusBadge status={post.status} />
        </li>
      ))}
    </ul>
  );
}

export default async function OverviewPage() {
  const [counts, recent, upcoming, needsReview] = await Promise.all([
    getPostCounts(),
    getRecentlyEditedPosts(5),
    getUpcomingScheduledPosts(5),
    getPostsNeedingReview(REVIEW_AFTER_MONTHS),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={pageLabel}>
            <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
            Blog admin
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Overview
          </h1>
        </div>
        <Link href="/admin/posts/new" className={buttonPrimary}>
          New post
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CountCard label="Drafts" value={counts.DRAFT} href="/admin/posts?status=DRAFT" />
        <CountCard label="Scheduled" value={counts.SCHEDULED} href="/admin/posts?status=SCHEDULED" />
        <CountCard label="Published" value={counts.PUBLISHED} href="/admin/posts?status=PUBLISHED" />
        <CountCard label="Archived" value={counts.ARCHIVED} href="/admin/posts?status=ARCHIVED" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Recently edited" empty="No posts yet. Write the first one.">
          {recent.length > 0 && (
            <PostRows
              posts={recent}
              detail={(post) =>
                `edited ${formatDateTime(post.updatedAt)}${
                  post.category ? ` · ${post.category.name}` : ""
                }`
              }
            />
          )}
        </Panel>

        <Panel title="Upcoming scheduled" empty="Nothing is scheduled.">
          {upcoming.length > 0 && (
            <PostRows
              posts={upcoming}
              detail={(post) => `goes live ${formatDateTime(post.publishedAt)}`}
            />
          )}
        </Panel>

        <div className="xl:col-span-2">
          <Panel
            title="Needs review"
            note={`Published posts not updated for more than ${REVIEW_AFTER_MONTHS} months, oldest first. Technical details go out of date; check them and mark a significant update.`}
            empty="Everything published is less than a year old."
          >
            {needsReview.length > 0 && (
              <PostRows
                posts={needsReview}
                detail={(post) => `last reviewed ${formatDate(post.reviewedAt)}`}
              />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
