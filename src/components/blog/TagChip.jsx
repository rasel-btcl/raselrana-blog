import { tagPath } from "@/lib/posts";
import { chip } from "@/lib/ui";
import Link from "next/link";

/** A topic chip. Pass `linked={false}` inside a card that is already one link. */
export default function TagChip({ tag, count, linked = true, active = false }) {
  const className = `${chip} ${
    active ? "border-[var(--signal)] text-[var(--signal)]" : ""
  }`;
  const body = (
    <>
      {tag}
      {count != null && <span className="ml-1.5 opacity-70">{count}</span>}
    </>
  );

  if (!linked) return <span className={className}>{body}</span>;

  return (
    <Link
      href={tagPath(tag)}
      className={`${className} transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]`}
    >
      {body}
    </Link>
  );
}
