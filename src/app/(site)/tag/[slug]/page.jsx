import ListingHeader, { parsePage } from "@/components/blog/ListingHeader";
import PostListing from "@/components/blog/PostListing";
import { BLOG_URL, tagPath } from "@/lib/posts";
import { container } from "@/lib/ui";
import { getPublishedPosts, getTagBySlug } from "@/services/posts/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const tag = await getTagBySlug((await params).slug);
  if (!tag) return {};
  return {
    title: `${tag.name} — Topics`,
    description: `Posts about ${tag.name} on Rasel Rana's blog.`,
    alternates: { canonical: `${BLOG_URL}${tagPath(tag.slug)}` },
  };
}

export default async function TagPage({ params, searchParams }) {
  const { slug } = await params;
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
      <ListingHeader
        label={
          <Link href="/tags" className="hover:text-[var(--signal)]">
            Topic
          </Link>
        }
        title={tag.name}
        count={total}
      />
      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <PostListing
            posts={posts}
            page={page}
            totalPages={totalPages}
            hrefFor={hrefFor}
            empty="No posts on this page."
          />
        </div>
      </section>
    </>
  );
}
