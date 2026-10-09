import Link from "next/link";

function NavLink({ post, label, align }) {
  if (!post) return <span className="hidden md:block" />;
  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--signal)] ${
        align === "right" ? "md:text-right" : ""
      }`}
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--signal)]">
        {post.title}
      </p>
    </Link>
  );
}

/** Previous (older) on the left, next (newer) on the right. */
export default function PostNav({ older, newer }) {
  if (!older && !newer) return null;
  return (
    <nav aria-label="More posts" className="grid gap-4 md:grid-cols-2">
      <NavLink post={older} label="← Previous post" />
      <NavLink post={newer} label="Next post →" align="right" />
    </nav>
  );
}
