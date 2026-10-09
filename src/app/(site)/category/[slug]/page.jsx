import ListingHeader, { parsePage } from "@/components/blog/ListingHeader";
import PostListing from "@/components/blog/PostListing";
import { CONTENT_TYPES, contentTypeBySlug } from "@/lib/content-types";
import { BLOG_URL, categoryPath } from "@/lib/posts";
import { chip, container } from "@/lib/ui";
import { getCategoryBySlug, getPublishedPosts } from "@/services/posts/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return {};
  return {
    title: category.name,
    description:
      category.description ?? `Posts about ${category.name} on Rasel Rana's blog.`,
    // The filtered views (?type=) are the same page for search engines.
    alternates: { canonical: `${BLOG_URL}${categoryPath(category.slug)}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const page = parsePage(query.page);
  // ?type=troubleshooting narrows the list to one content type.
  const type = typeof query.type === "string" ? contentTypeBySlug(query.type) : null;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { posts, total, totalPages } = await getPublishedPosts({
    page,
    categoryId: category.id,
    contentType: type?.value,
  });

  const base = categoryPath(category.slug);
  const hrefFor = (n, typeSlug = type?.slug) => {
    const search = new URLSearchParams();
    if (typeSlug) search.set("type", typeSlug);
    if (n > 1) search.set("page", String(n));
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };

  const chipClass = (active) =>
    `${chip} transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)] ${
      active ? "border-[var(--signal)] text-[var(--signal)]" : ""
    }`;

  return (
    <>
      <ListingHeader
        label="Category"
        title={category.name}
        description={category.description}
        count={total}
      >
        <nav aria-label="Filter by content type" className="rise mt-8 flex flex-wrap gap-2">
          <Link
            href={base}
            aria-current={type ? undefined : "true"}
            className={chipClass(!type)}
          >
            All
          </Link>
          {CONTENT_TYPES.map((item) => (
            <Link
              key={item.slug}
              href={hrefFor(1, item.slug)}
              aria-current={type?.slug === item.slug ? "true" : undefined}
              className={chipClass(type?.slug === item.slug)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </ListingHeader>

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <PostListing
            posts={posts}
            page={page}
            totalPages={totalPages}
            hrefFor={(n) => hrefFor(n)}
            empty={
              type
                ? `No ${type.label.toLowerCase()} posts in this category yet.`
                : "No posts in this category yet."
            }
          />
        </div>
      </section>
    </>
  );
}
