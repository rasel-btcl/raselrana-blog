import AuthorCard from "@/components/blog/AuthorCard";
import PostCard from "@/components/blog/PostCard";
import PostNav from "@/components/blog/PostNav";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareRow from "@/components/blog/ShareRow";
import TableOfContents from "@/components/blog/TableOfContents";
import TagChip from "@/components/blog/TagChip";
import Markdown from "@/components/mdx/Markdown";
import { cloudinaryUrl, isCloudinaryImage } from "@/lib/cloudinary-loader";
import {
  excerptFor,
  formatDate,
  postDate,
  postUrl,
  readingMinutes,
} from "@/lib/posts";
import { getTableOfContents } from "@/lib/toc";
import { container, metaLine, sectionHeading } from "@/lib/ui";
import {
  getAdjacentPosts,
  getPublishedPostBySlug,
  getRelatedPosts,
} from "@/services/posts/queries";
import Image from "next/image";
import { notFound } from "next/navigation";

const MIN_TOC_HEADINGS = 3;
const ARTICLE_ID = "post-article";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const description = excerptFor(post);
  const url = postUrl(post.slug);
  const cover = isCloudinaryImage(post.coverUrl)
    ? cloudinaryUrl(post.coverUrl, 1200)
    : null;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      siteName: "Rasel Rana",
      publishedTime: postDate(post).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["Rasel Rana"],
      tags: post.tags,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound(); // also covers drafts

  const [{ older, newer }, related] = await Promise.all([
    getAdjacentPosts(post),
    getRelatedPosts(post),
  ]);

  const published = postDate(post);
  const publishedLabel = formatDate(published);
  const updatedLabel = formatDate(post.updatedAt);
  const wasUpdated = post.updatedAt > published && updatedLabel !== publishedLabel;

  const toc = getTableOfContents(post.content);
  const showToc = toc.length >= MIN_TOC_HEADINGS;
  const hasCover = isCloudinaryImage(post.coverUrl);

  return (
    <>
      <ReadingProgress targetId={ARTICLE_ID} />

      <article>
        <header className={`${container} pb-10 pt-16 md:pt-20`}>
          {post.tags.length > 0 && (
            <div className="rise flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          )}
          <h1
            className="rise mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--ink)] md:text-6xl"
            style={{ "--delay": "80ms" }}
          >
            {post.title}
          </h1>
          <p
            className={`${metaLine} rise mt-6 flex flex-wrap gap-x-2 gap-y-1`}
            style={{ "--delay": "160ms" }}
          >
            <time dateTime={published.toISOString()}>{publishedLabel}</time>
            {wasUpdated && (
              <>
                <span aria-hidden>·</span>
                <span>
                  Updated{" "}
                  <time dateTime={post.updatedAt.toISOString()}>
                    {updatedLabel}
                  </time>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{readingMinutes(post.content)} min read</span>
          </p>
        </header>

        {hasCover && (
          <div className={container}>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--line)]">
              <Image
                src={post.coverUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1152px) 1104px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div
          className={`${container} grid gap-12 py-12 md:py-16 ${
            showToc ? "lg:grid-cols-[minmax(0,1fr)_15rem]" : ""
          }`}
        >
          <div className="min-w-0">
            {showToc && (
              <details className="mb-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 lg:hidden">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
                  On this page
                </summary>
                <nav aria-label="On this page" className="mt-4">
                  <TableOfContents items={toc} />
                </nav>
              </details>
            )}

            <div id={ARTICLE_ID} className="article">
              <Markdown>{post.content}</Markdown>
            </div>

            <div className="mt-12 max-w-[70ch] border-t border-[var(--line)] pt-8">
              <ShareRow url={postUrl(post.slug)} />
            </div>
          </div>

          {showToc && (
            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
                  On this page
                </p>
                <TableOfContents items={toc} />
              </nav>
            </aside>
          )}
        </div>
      </article>

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
