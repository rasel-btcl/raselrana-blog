import { tagPath } from "@/lib/posts";
import { chip } from "@/lib/ui";
import Link from "next/link";

/**
 * A topic chip. `tag` is `{ name, slug }`.
 * Pass `linked={false}` inside a card that is already one link.
 */
export default function TagChip({ tag, count, linked = true }) {
  const body = (
    <>
      {tag.name}
      {count != null && <span className="ml-1.5 opacity-70">{count}</span>}
    </>
  );

  if (!linked) return <span className={chip}>{body}</span>;

  return (
    <Link
      href={tagPath(tag.slug)}
      className={`${chip} transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]`}
    >
      {body}
    </Link>
  );
}
