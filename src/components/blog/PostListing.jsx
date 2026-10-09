import Pagination from "@/components/blog/Pagination";
import PostCard from "@/components/blog/PostCard";

/** A grid of post cards with paging, or `empty` when there is nothing to show. */
export default function PostListing({ posts, page, totalPages, hrefFor, empty }) {
  if (posts.length === 0) {
    return <p className="text-[var(--slate)]">{empty}</p>;
  }
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
