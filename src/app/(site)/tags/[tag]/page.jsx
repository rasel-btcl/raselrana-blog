import Pagination from "@/components/blog/Pagination";
import PostCard from "@/components/blog/PostCard";
import { tagPath } from "@/lib/posts";
import { container, pageHeading, pageLabel } from "@/lib/ui";
import { getPublishedPosts, getTagBySlug } from "@/services/posts/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export async function generateMetadata({ params }) {
  const tag = await getTagBySlug((await params).tag);
  if (!tag) return {};
  return {
    title: `${tag.name} — Topics`,
    description: `Posts about ${tag.name} on Rasel Rana's blog.`,
  };
}

// The address holds the topic's slug.
export default async function TopicPage({ params, searchParams }) {
  const { tag: slug } = await params;
  const page = parsePage((await searchParams).page);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { posts, total, totalPages } = await getPublishedPosts({
    page,
    tagSlug: tag.slug,
  });
  if (total === 0) notFound();

  const hrefFor = (n) =>
    n > 1 ? `${tagPath(tag.slug)}?page=${n}` : tagPath(tag.slug);

  return (
    <>
      <section className={`${container} py-16 md:py-20`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          <Link href="/tags" className="hover:text-[var(--signal)]">
            Topic
          </Link>
        </p>
        <h1
          className={`${pageHeading} rise mt-6`}
          style={{ "--delay": "80ms" }}
        >
          {tag.name}
        </h1>
        <p
          className="rise mt-5 font-mono text-xs text-[var(--slate)]"
          style={{ "--delay": "160ms" }}
        >
          {total} {total === 1 ? "post" : "posts"}
        </p>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>
      </section>
    </>
  );
}
