import Notice from "@/components/admin/Notice";
import Pagination from "@/components/blog/Pagination";
import { readNotice } from "@/lib/admin-action";
import { buttonPrimary, buttonSecondary, buttonSmall, fieldLabel, input } from "@/lib/ui";
import { getAllTags, getTagsForAdmin } from "@/services/taxonomy/tags";
import Link from "next/link";
import {
  deleteTagAction,
  deleteUnusedTagsAction,
  mergeTagsAction,
  renameTagAction,
} from "./actions";

export const metadata = { title: "Tags" };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const rowButton =
  "rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]";

const th =
  "px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--slate)]";

const panel = "mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6";

const isId = (value) => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default async function TagsPage({ searchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const page = parsePage(params.page);

  const [{ tags, total, totalPages, unusedCount }, allTags] = await Promise.all([
    getTagsForAdmin({ page, q: q || undefined }),
    getAllTags(),
  ]);

  const editing = allTags.find((tag) => tag.id === params.edit);
  // Merge is two steps: choose the topics (a GET form), then confirm.
  const source = isId(params.merge) ? allTags.find((tag) => tag.id === params.merge) : null;
  const target = isId(params.into) ? allTags.find((tag) => tag.id === params.into) : null;
  const confirming = source && target && source.id !== target.id;

  const hrefFor = (n) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (n > 1) query.set("page", String(n));
    const text = query.toString();
    return text ? `/admin/tags?${text}` : "/admin/tags";
  };

  return (
    <>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
        Tags
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--slate)]">
        Topics are created while writing a post. Here you can rename them,
        merge two that mean the same thing, and remove the ones no post uses.
      </p>

      <Notice notice={readNotice(params)} />

      {confirming && (
        <section className={`${panel} border-[var(--signal)]`}>
          <h2 className="font-display text-xl font-medium text-[var(--ink)]">
            Merge “{source.name}” into “{target.name}”?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--slate)]">
            {source.postCount} post{source.postCount === 1 ? "" : "s"} with “
            {source.name}” will get “{target.name}” instead, and “{source.name}”
            will be deleted. This cannot be undone.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={mergeTagsAction.bind(null, source.id, target.id)}>
              <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
                Merge topics
              </button>
            </form>
            <Link href="/admin/tags" className={`${buttonSecondary} px-5 py-2.5`}>
              Cancel
            </Link>
          </div>
        </section>
      )}

      {editing && (
        <section id="edit" className={panel}>
          <h2 className="mb-5 font-display text-xl font-medium text-[var(--ink)]">
            Rename “{editing.name}”
          </h2>
          <form
            key={editing.id}
            action={renameTagAction.bind(null, editing.id)}
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div>
              <label htmlFor="tag-name" className={fieldLabel}>
                Name
              </label>
              <input
                id="tag-name"
                name="name"
                defaultValue={editing.name}
                maxLength={40}
                required
                className={input}
              />
            </div>
            <div>
              <label htmlFor="tag-slug" className={fieldLabel}>
                Slug
              </label>
              <input
                id="tag-slug"
                name="slug"
                defaultValue={editing.slug}
                maxLength={60}
                spellCheck={false}
                className={`${input} font-mono`}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
                Save
              </button>
              <Link href="/admin/tags" className={buttonSmall}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      )}

      {/* Plain GET forms: they work without JavaScript, but need the base path written out. */}
      <form
        action={`${basePath}/admin/tags`}
        method="get"
        className="mt-8 flex max-w-xl gap-3"
      >
        <label htmlFor="tag-search" className="sr-only">
          Search topics
        </label>
        <input
          id="tag-search"
          type="search"
          name="q"
          defaultValue={q}
          maxLength={60}
          placeholder="Search topics"
          className={`${input} bg-[var(--surface)]`}
        />
        <button type="submit" className={buttonSmall}>
          Search
        </button>
        {q && (
          <Link href="/admin/tags" className={buttonSmall}>
            Clear
          </Link>
        )}
      </form>

      <p className="mt-6 font-mono text-xs text-[var(--slate)]">
        {total} topic{total === 1 ? "" : "s"}
        {q ? " match" : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {tags.length === 0 ? (
          <p className="p-6 text-sm text-[var(--slate)]">
            {q ? "No topics match that search." : "No topics yet."}
          </p>
        ) : (
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className={th}>Name</th>
                <th className={th}>Slug</th>
                <th className={th}>Posts</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{tag.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--slate)]">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3 text-[var(--slate)]">{tag.postCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/admin/tags?edit=${tag.id}#edit`} className={rowButton}>
                        Rename
                      </Link>
                      {tag.postCount === 0 && (
                        <form action={deleteTagAction.bind(null, tag.id)}>
                          <button
                            type="submit"
                            className={`${rowButton} hover:border-[var(--danger)] hover:text-[var(--danger)]`}
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />

      {allTags.length >= 2 && (
        <section className={panel}>
          <h2 className="font-display text-xl font-medium text-[var(--ink)]">
            Merge two topics
          </h2>
          <p className="mt-2 text-sm text-[var(--slate)]">
            For two topics that mean the same thing, such as “olt” and
            “gpon-olt”. You will be asked to confirm.
          </p>
          <form
            action={`${basePath}/admin/tags`}
            method="get"
            className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div>
              <label htmlFor="merge-source" className={fieldLabel}>
                Merge this topic (it is removed)
              </label>
              <select id="merge-source" name="merge" required defaultValue="" className={input}>
                <option value="" disabled>
                  Choose…
                </option>
                {allTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} ({tag.postCount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="merge-target" className={fieldLabel}>
                Into this topic (it is kept)
              </label>
              <select id="merge-target" name="into" required defaultValue="" className={input}>
                <option value="" disabled>
                  Choose…
                </option>
                {allTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} ({tag.postCount})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={buttonSmall}>
              Continue
            </button>
          </form>
          {source && target && source.id === target.id && (
            <p className="mt-3 text-sm text-[var(--danger)]">
              Choose two different topics.
            </p>
          )}
        </section>
      )}

      {unusedCount > 0 && (
        <section className={panel}>
          <h2 className="font-display text-xl font-medium text-[var(--ink)]">
            Unused topics
          </h2>
          <p className="mt-2 text-sm text-[var(--slate)]">
            {unusedCount} topic{unusedCount === 1 ? " is" : "s are"} not used
            by any post.
          </p>
          <form action={deleteUnusedTagsAction} className="mt-4">
            <button
              type="submit"
              className={`${buttonSmall} hover:border-[var(--danger)] hover:text-[var(--danger)]`}
            >
              Delete all unused topics
            </button>
          </form>
        </section>
      )}
    </>
  );
}
