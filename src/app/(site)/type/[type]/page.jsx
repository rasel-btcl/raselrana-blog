import ListingHeader, { parsePage } from "@/components/blog/ListingHeader";
import PostListing from "@/components/blog/PostListing";
import { contentTypeBySlug } from "@/lib/content-types";
import { BLOG_URL, typePath } from "@/lib/posts";
import { container } from "@/lib/ui";
import { getPublishedPosts } from "@/services/posts/queries";
import { notFound } from "next/navigation";

const DESCRIPTIONS = {
  EXPLAINER: "What things are and how they work, explained from the ground up.",
  HOWTO: "Step-by-step guides for getting a specific job done.",
  TROUBLESHOOTING:
    "Symptoms, causes and fixes for problems met in the field, across every category.",
  COMPARISON: "Two options side by side, and when to choose which.",
};

export async function generateMetadata({ params }) {
  const type = contentTypeBySlug((await params).type);
  if (!type) return {};
  return {
    title: `${type.label} posts`,
    description: DESCRIPTIONS[type.value],
    alternates: { canonical: `${BLOG_URL}${typePath(type.slug)}` },
  };
}

// A hub for one content type, across all categories.
export default async function TypePage({ params, searchParams }) {
  const type = contentTypeBySlug((await params).type);
  if (!type) notFound();
  const page = parsePage((await searchParams).page);

  const { posts, total, totalPages } = await getPublishedPosts({
    page,
    contentType: type.value,
  });

  const base = typePath(type.slug);

  return (
    <>
      <ListingHeader
        label="Content type"
        title={type.label}
        description={DESCRIPTIONS[type.value]}
        count={total}
      />
      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <PostListing
            posts={posts}
            page={page}
            totalPages={totalPages}
            hrefFor={(n) => (n > 1 ? `${base}?page=${n}` : base)}
            empty={`No ${type.label.toLowerCase()} posts yet.`}
          />
        </div>
      </section>
    </>
  );
}
