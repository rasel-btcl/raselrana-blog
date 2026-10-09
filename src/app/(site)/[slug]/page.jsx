import AuthorCard from "@/components/blog/AuthorCard";
import PostArticle from "@/components/blog/PostArticle";
import PostCard from "@/components/blog/PostCard";
import PostNav from "@/components/blog/PostNav";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { postDate, postPath, postUrl, SITE_URL } from "@/lib/posts";
import { container, sectionHeading } from "@/lib/ui";
import {
  coverOf,
  getAdjacentPosts,
  getCurrentSlugFor,
  getLivePostBySlug,
  getRelatedPosts,
} from "@/services/posts/queries";
import { notFound, permanentRedirect } from "next/navigation";

// The article page: /blog/<slug>. Static routes next to this folder (about, tags,
// category, …) win over it, and RESERVED_SLUGS keeps posts from taking their names.

/** The picture shown when the link is shared: the featured image unless the post names another. */
function shareImageOf(post) {
  const cover = coverOf(post);
  return {
    url: post.ogImageUrl || (cover ? cloudinaryUrl(cover.url, 1200) : null),
    alt: cover?.alt || post.title,
  };
}

/**
 * The live post at this address. If a post used to live here, redirect to where
 * it is now (docs/BLOG_ADMIN_SPEC.md §6.2); otherwise `null`.
 */
async function loadPost(slug) {
  const post = await getLivePostBySlug(slug);
  if (post) return post;

  const current = await getCurrentSlugFor(slug);
  if (current) permanentRedirect(postPath(current));
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = postUrl(post.slug);
  const image = shareImageOf(post);

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
      authors: [post.author?.name ?? "Rasel Rana"],
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
      images: image.url ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: {
      card: image.url ? "summary_large_image" : "summary",
      title,
      description,
      images: image.url ? [image.url] : undefined,
    },
  };
}

/** Structured data for search engines (docs/BLOG_ADMIN_SPEC.md §8). */
function articleJsonLd(post) {
  const published = postDate(post);
  const image = shareImageOf(post);
  const data = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: image.url ? [image.url] : undefined,
    datePublished: published.toISOString(),
    // Only a significant update moves this date; ordinary edits do not.
    dateModified: (post.contentUpdatedAt ?? published).toISOString(),
    articleSection: post.category?.name,
    keywords: post.tags.map((tag) => tag.name).join(", ") || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post.slug) },
    author: {
      "@type": "Person",
      name: post.author?.name ?? "Rasel Rana",
      url: SITE_URL,
    },
    publisher: { "@type": "Person", name: "Rasel Rana", url: SITE_URL },
  };
  // "<" is escaped so text from a post can never close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound(); // also covers drafts, archived and not-yet-due posts

  const [{ older, newer }, related] = await Promise.all([
    getAdjacentPosts(post),
    getRelatedPosts(post),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }}
      />

      <PostArticle post={post} />

      <section className="border-t border-[var(--line)]">
        <div className={`${container} space-y-12 py-16 md:py-20`}>
          <PostNav older={older} newer={newer} />

          {related.length > 0 && (
            <div>
              <h2 className={sectionHeading}>Related posts</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {related.map((item) => (
                  <PostCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
          )}

          <AuthorCard author={post.author} />
        </div>
      </section>
    </>
  );
}
