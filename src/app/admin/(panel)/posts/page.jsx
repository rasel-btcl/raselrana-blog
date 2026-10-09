import DeletePostButton from "@/components/admin/DeletePostButton";
import StatusBadge, { STATUS_LABELS } from "@/components/admin/StatusBadge";
import Pagination from "@/components/blog/Pagination";
import { CONTENT_TYPES, contentTypeByValue } from "@/lib/content-types";
import { formatDate, formatDateTime, postPath } from "@/lib/posts";
import { buttonPrimary, buttonSmall, fieldLabel, input } from "@/lib/ui";
import { getCategories, getPostsForAdminList } from "@/services/posts/queries";
import { isValidObjectId } from "@/services/posts/validation";
import Link from "next/link";
import {
  archivePostAction,
  duplicatePostAction,
  unarchivePostAction,
} from "./actions";

export const metadata = { title: "Posts" };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const rowButton =
  "rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]";

const th =
  "px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--slate)]";

function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Only values we know are passed on to the query. */
function readFilters(params) {
  const text = (value) => (typeof value === "string" ? value : "");
  return {
    status: text(params.status) in STATUS_LABELS ? params.status : "",
    contentType: contentTypeByValue(text(params.type)) ? params.type : "",
    categoryId: isValidObjectId(params.category) ? params.category : "",
    q: text(params.q).trim().slice(0, 80),
  };
}

function PostDate({ post }) {
  if (post.status === "SCHEDULED" && post.publishedAt) {
    return <>goes live {formatDateTime(post.publishedAt)}</>;
  }
  if (post.publishedAt) return <>{formatDate(post.publishedAt)}</>;
  return <>—</>;
}

export default async function PostsListPage({ searchParams }) {
  const params = await searchParams;
  const filters = readFilters(params);
  const page = parsePage(params.page);

  const [{ posts, total, totalPages }, categories] = await Promise.all([
    getPostsForAdminList({
      page,
      status: filters.status || undefined,
      contentType: filters.contentType || undefined,
      categoryId: filters.categoryId || undefined,
      q: filters.q || undefined,
    }),
    getCategories(),
  ]);

  const filtered = Object.values(filters).some(Boolean);

  const hrefFor = (n) => {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.contentType) query.set("type", filters.contentType);
    if (filters.categoryId) query.set("category", filters.categoryId);
    if (filters.q) query.set("q", filters.q);
    if (n > 1) query.set("page", String(n));
    const text = query.toString();
    return text ? `/admin/posts?${text}` : "/admin/posts";
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
          Posts
        </h1>
        <Link href="/admin/posts/new" className={buttonPrimary}>
          New post
        </Link>
      </div>

      {/* A plain GET form, so filtering works without JavaScript. Native forms do not get the base path. */}
      <form
        action={`${basePath}/admin/posts`}
        method="get"
        className="mt-8 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto] xl:items-end"
      >
        <div>
          <label htmlFor="filter-q" className={fieldLabel}>
            Search title
          </label>
          <input
            id="filter-q"
            type="search"
            name="q"
            defaultValue={filters.q}
            maxLength={80}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="filter-status" className={fieldLabel}>
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={filters.status}
            className={input}
          >
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-category" className={fieldLabel}>
            Category
          </label>
          <select
            id="filter-category"
            name="category"
            defaultValue={filters.categoryId}
            className={input}
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-type" className={fieldLabel}>
            Content type
          </label>
          <select
            id="filter-type"
            name="type"
            defaultValue={filters.contentType}
            className={input}
          >
            <option value="">All</option>
            {CONTENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonSmall}>
            Filter
          </button>
          {filtered && (
            <Link href="/admin/posts" className={buttonSmall}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="mt-6 font-mono text-xs text-[var(--slate)]">
        {total} {total === 1 ? "post" : "posts"}
        {filtered ? " match" : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {posts.length === 0 ? (
          <p className="p-6 text-sm text-[var(--slate)]">
            {filtered
              ? "No posts match these filters."
              : "No posts yet. Write the first one."}
          </p>
        ) : (
          <table className="w-full min-w-[60rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className={th}>Title</th>
                <th className={th}>Category</th>
                <th className={th}>Type</th>
                <th className={th}>Status</th>
                <th className={th}>Published</th>
                <th className={th}>Last edited</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {posts.map((post) => {
                const neverPublished =
                  post.status === "DRAFT" && !post.publishedAt;
                return (
                  <tr key={post.id} className="align-top">
                    <td className="max-w-xs px-4 py-4">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-medium text-[var(--ink)] transition-colors hover:text-[var(--signal)]"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 break-all font-mono text-xs text-[var(--slate)]">
                        /{post.slug}
                        {post.showOnMainSite ? "" : " · hidden from main site"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--slate)]">
                      {post.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-[var(--slate)]">
                      {contentTypeByValue(post.contentType)?.label ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[var(--slate)]">
                      <PostDate post={post} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[var(--slate)]">
                      {formatDateTime(post.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className={rowButton}
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/preview/${post.id}`}
                          target="_blank"
                          className={rowButton}
                        >
                          Preview
                        </Link>
                        {post.status === "PUBLISHED" && (
                          <Link href={postPath(post.slug)} className={rowButton}>
                            View live
                          </Link>
                        )}
                        <form action={duplicatePostAction.bind(null, post.id)}>
                          <button type="submit" className={rowButton}>
                            Duplicate
                          </button>
                        </form>
                        {post.status === "ARCHIVED" ? (
                          <form action={unarchivePostAction.bind(null, post.id)}>
                            <button type="submit" className={rowButton}>
                              Unarchive
                            </button>
                          </form>
                        ) : (
                          <form action={archivePostAction.bind(null, post.id)}>
                            <button type="submit" className={rowButton}>
                              Archive
                            </button>
                          </form>
                        )}
                        {/* Only a draft that was never public may be deleted. */}
                        {neverPublished && (
                          <DeletePostButton
                            id={post.id}
                            title={post.title}
                            className={rowButton}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
