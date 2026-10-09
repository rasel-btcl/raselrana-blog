import { buttonSmall, metaLine } from "@/lib/ui";
import Link from "next/link";

/** `hrefFor(page)` builds the address for a page number. */
export default function Pagination({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pages"
      className="mt-12 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={buttonSmall}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <p className={metaLine}>
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={buttonSmall}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
