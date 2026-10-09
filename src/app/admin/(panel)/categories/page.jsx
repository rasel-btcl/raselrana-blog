import Notice from "@/components/admin/Notice";
import { readNotice } from "@/lib/admin-action";
import { buttonPrimary, buttonSmall, fieldLabel, input } from "@/lib/ui";
import { getCategoriesWithCounts } from "@/services/taxonomy/categories";
import Link from "next/link";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  updateCategoryAction,
} from "./actions";

export const metadata = { title: "Categories" };

const rowButton =
  "rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)] disabled:cursor-not-allowed disabled:opacity-40";

const th =
  "px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--slate)]";

function CategoryForm({ action, category, submitLabel }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="category-name" className={fieldLabel}>
          Name
        </label>
        <input
          id="category-name"
          name="name"
          defaultValue={category?.name ?? ""}
          maxLength={60}
          required
          className={input}
        />
      </div>
      <div>
        <label htmlFor="category-slug" className={fieldLabel}>
          Slug (leave empty to make it from the name)
        </label>
        <input
          id="category-slug"
          name="slug"
          defaultValue={category?.slug ?? ""}
          maxLength={60}
          spellCheck={false}
          className={`${input} font-mono`}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="category-description" className={fieldLabel}>
          Description (shown on the category page)
        </label>
        <textarea
          id="category-description"
          name="description"
          defaultValue={category?.description ?? ""}
          maxLength={300}
          rows={2}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="category-order" className={fieldLabel}>
          Sort order
        </label>
        <input
          id="category-order"
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          defaultValue={category?.sortOrder ?? ""}
          placeholder="Last"
          className={input}
        />
      </div>
      <div className="flex items-end gap-3">
        <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
          {submitLabel}
        </button>
        {category && (
          <Link href="/admin/categories" className={buttonSmall}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

export default async function CategoriesPage({ searchParams }) {
  const params = await searchParams;
  const categories = await getCategoriesWithCounts();
  const editing = categories.find((category) => category.id === params.edit);

  return (
    <>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
        Categories
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--slate)]">
        Every post has exactly one category. Their order here is the order
        in the blog&apos;s navigation.
      </p>

      <Notice notice={readNotice(params)} />

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-[var(--slate)]">
            No categories yet. Add the first one below, or run{" "}
            <code className="font-mono">npm run seed:categories</code>.
          </p>
        ) : (
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className={th}>Order</th>
                <th className={th}>Name</th>
                <th className={th}>Slug</th>
                <th className={th}>Posts</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {categories.map((category, index) => (
                <tr key={category.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 font-mono text-xs text-[var(--slate)]">
                        {category.sortOrder}
                      </span>
                      <form action={moveCategoryAction.bind(null, category.id, "up")}>
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label={`Move ${category.name} up`}
                          className={rowButton}
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveCategoryAction.bind(null, category.id, "down")}>
                        <button
                          type="submit"
                          disabled={index === categories.length - 1}
                          aria-label={`Move ${category.name} down`}
                          className={rowButton}
                        >
                          ↓
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-[var(--ink)]">{category.name}</p>
                    {category.description && (
                      <p className="mt-1 max-w-md text-xs text-[var(--slate)]">
                        {category.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[var(--slate)]">
                    {category.slug}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/posts?category=${category.id}`}
                      className="text-[var(--signal)] underline underline-offset-4"
                    >
                      {category.postCount}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/categories?edit=${category.id}#edit`}
                        className={rowButton}
                      >
                        Edit
                      </Link>
                      {category.postCount === 0 ? (
                        <form action={deleteCategoryAction.bind(null, category.id)}>
                          <button
                            type="submit"
                            className={`${rowButton} hover:border-[var(--danger)] hover:text-[var(--danger)]`}
                          >
                            Delete
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-[var(--slate)]">
                          Move posts first
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section
        id="edit"
        className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
      >
        <h2 className="mb-5 font-display text-xl font-medium text-[var(--ink)]">
          {editing ? `Edit “${editing.name}”` : "Add a category"}
        </h2>
        {/* key: a fresh form when switching between adding and editing */}
        <CategoryForm
          key={editing?.id ?? "new"}
          action={
            editing
              ? updateCategoryAction.bind(null, editing.id)
              : createCategoryAction
          }
          category={editing}
          submitLabel={editing ? "Save category" : "Add category"}
        />
      </section>
    </>
  );
}
