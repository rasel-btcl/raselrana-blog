import { tagPath } from "@/lib/posts";
import { container, pageHeading, pageLabel } from "@/lib/ui";
import { getTagCounts } from "@/services/posts/queries";
import Link from "next/link";

export const metadata = {
  title: "Topics",
  description: "Every topic on Rasel Rana's blog, with the posts in each.",
};

export default async function TopicsPage() {
  const topics = await getTagCounts();

  return (
    <>
      <section className={`${container} py-16 md:py-20`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          Blog
        </p>
        <h1
          className={`${pageHeading} rise mt-6`}
          style={{ "--delay": "80ms" }}
        >
          Topics
        </h1>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          {topics.length === 0 ? (
            <p className="text-[var(--slate)]">No topics yet.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map(({ tag, count }) => (
                <li key={tag}>
                  <Link
                    href={tagPath(tag)}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--signal)]"
                  >
                    <span className="font-display text-xl font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--signal)]">
                      {tag}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[var(--slate)]">
                      {count} {count === 1 ? "post" : "posts"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
