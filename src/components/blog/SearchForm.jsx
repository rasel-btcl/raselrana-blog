import { buttonPrimary, input } from "@/lib/ui";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** A plain GET form to the blog home (?q=…), so search works without JavaScript. */
export default function SearchForm({ defaultValue = "" }) {
  return (
    // A native form does not get the base path added, so it is written out here.
    <form
      action={basePath || "/"}
      method="get"
      role="search"
      className="flex max-w-xl gap-3"
    >
      <label htmlFor="blog-search" className="sr-only">
        Search posts
      </label>
      <input
        id="blog-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search posts"
        maxLength={80}
        className={`${input} bg-[var(--surface)]`}
      />
      <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
        Search
      </button>
    </form>
  );
}
