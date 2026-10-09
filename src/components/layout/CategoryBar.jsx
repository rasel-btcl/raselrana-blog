import { contentTypeByValue } from "@/lib/content-types";
import { categoryPath, typePath } from "@/lib/posts";
import { getCategories } from "@/services/posts/queries";
import Link from "next/link";

const link =
  "whitespace-nowrap py-3 text-sm text-[var(--slate)] transition-colors hover:text-[var(--ink)]";

/**
 * The categories in their admin order, under the top bar. The top bar itself stays
 * as docs/design-brief.md describes it; this row scrolls sideways on phones.
 * Troubleshooting gets its own highlighted link: it is what people search for.
 */
export default async function CategoryBar() {
  const categories = await getCategories();
  const troubleshooting = contentTypeByValue("TROUBLESHOOTING");

  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categories"
      className="border-b border-[var(--line)] bg-[var(--paper)]"
    >
      <ul className="mx-auto flex max-w-6xl items-center gap-x-7 overflow-x-auto px-6">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={categoryPath(category.slug)} className={link}>
              {category.name}
            </Link>
          </li>
        ))}
        <li className="ml-auto pl-4">
          <Link
            href={typePath(troubleshooting.slug)}
            className="block whitespace-nowrap py-3 font-mono text-xs uppercase tracking-[0.15em] text-[var(--signal)] underline-offset-4 hover:underline"
          >
            {troubleshooting.label}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
