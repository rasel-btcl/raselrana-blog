import AuthorCard from "@/components/blog/AuthorCard";
import PostArticle from "@/components/blog/PostArticle";
import PostCard from "@/components/blog/PostCard";
import PostNav from "@/components/blog/PostNav";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { postDate, postUrl } from "@/lib/posts";
import { container, sectionHeading } from "@/lib/ui";
import {
  coverOf,
  getAdjacentPosts,
  getLivePostBySlug,
  getRelatedPosts,
} from "@/services/posts/queries";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getLivePostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = postUrl(post.slug);

  // The picture social networks show when the link is shared: the featured image,
  // unless the post names another one.
  const cover = coverOf(post);
  const shareImage =
    post.ogImageUrl || (cover ? cloudinaryUrl(cover.url, 1200) : null);

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    ...(post.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Rasel Rana",
      publishedTime: postDate(post).toISOString(),
      modifiedTime: (post.contentUpdatedAt ?? postDate(post)).toISOString(),
      authors: ["Rasel Rana"],
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
      images: shareImage
        ? [{ url: shareImage, alt: cover?.alt || post.title }]
        : undefined,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getLivePostBySlug(slug);
  if (!post) notFound(); // also covers drafts

  const [{ older, newer }, related] = await Promise.all([
    getAdjacentPosts(post),
    getRelatedPosts(post),
  ]);

  return (
    <>
      <PostArticle post={post} />

      <section className="border-t border-[var(--line)]">
        <div className={`${container} space-y-12 py-16 md:py-20`}>
          <PostNav older={older} newer={newer} />

          {related.length > 0 && (
            <div>
              <h2 className={sectionHeading}>Related posts</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <PostCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
          )}

          <AuthorCard />
        </div>
      </section>
    </>
  );
}
