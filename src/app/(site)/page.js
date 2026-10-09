import Pagination from "@/components/blog/Pagination";
import PostCard, { FeatureCard } from "@/components/blog/PostCard";
import SearchForm from "@/components/blog/SearchForm";
import TagChip from "@/components/blog/TagChip";
import { container, pageHeading, pageLabel, sectionHeading } from "@/lib/ui";
import { getPublishedPosts, getTagCounts } from "@/services/posts/queries";
import Link from "next/link";

const MAX_TOPIC_CHIPS = 12;

function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default async function BlogHome({ searchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const page = parsePage(params.page);

  const [{ posts, total, totalPages }, topics] = await Promise.all([
    getPublishedPosts({ page, q }),
    getTagCounts(),
  ]);

  // The newest post gets the large card, but only on the plain first page.
  const feature = !q && page === 1 ? posts[0] : null;
  const rest = feature ? posts.slice(1) : posts;

  const hrefFor = (n) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (n > 1) query.set("page", String(n));
    const text = query.toString();
    return text ? `/?${text}` : "/";
  };

  return (
    <>
      <section className={`${container} py-16 md:py-20`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          Blog
        </p>
        <h1
          className={`${pageHeading} rise mt-6 max-w-4xl`}
          style={{ "--delay": "80ms" }}
        >
          Notes on telecom networks, power and engineering.
        </h1>
        <p
          className="rise mt-6 max-w-2xl text-lg leading-relaxed text-[var(--slate)]"
          style={{ "--delay": "160ms" }}
        >
          Practical writing from day-to-day work on telecommunications
          infrastructure and the electrical systems behind it.
        </p>

        <div className="mt-10 space-y-6">
          <SearchForm defaultValue={q} />
          {topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {topics.slice(0, MAX_TOPIC_CHIPS).map(({ tag, count }) => (
                <TagChip key={tag} tag={tag} count={count} />
              ))}
              {topics.length > MAX_TOPIC_CHIPS && (
                <Link
                  href="/tags"
                  className="px-2 font-mono text-xs text-[var(--signal)] underline underline-offset-4"
                >
                  All topics
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          {q && (
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className={sectionHeading}>
                {total} {total === 1 ? "result" : "results"} for “{q}”
              </h2>
              <Link
                href="/"
                className="text-sm font-medium text-[var(--signal)] underline underline-offset-4"
              >
                Clear search
              </Link>
            </div>
          )}

          {posts.length === 0 ? (
            <p className="text-[var(--slate)]">
              {q
                ? "No posts match that search. Try a different word."
                : "No posts yet. The first one is on its way."}
            </p>
          ) : (
            <>
              {feature && <FeatureCard post={feature} />}
              {rest.length > 0 && (
                <div
                  className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
                    feature ? "mt-6" : ""
                  }`}
                >
                  {rest.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </>
          )}

          <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>
      </section>
    </>
  );
}
