import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareRow from "@/components/blog/ShareRow";
import TableOfContents from "@/components/blog/TableOfContents";
import TagChip from "@/components/blog/TagChip";
import Markdown from "@/components/mdx/Markdown";
import { contentTypeByValue } from "@/lib/content-types";
import { formatDate, postDate, postUrl } from "@/lib/posts";
import { getTableOfContents } from "@/lib/toc";
import { container, metaLine } from "@/lib/ui";
import { coverOf } from "@/services/posts/queries";
import Image from "next/image";

const MIN_TOC_HEADINGS = 3;
const ARTICLE_ID = "post-article";

/**
 * A post as readers see it: header, featured image, body with table of contents,
 * share row. Used by the public post page and by the draft preview, so both always
 * look the same. `post` needs `category` and `tags` loaded.
 */
export default function PostArticle({ post }) {
  const published = postDate(post);
  const type = contentTypeByValue(post.contentType);
  const cover = coverOf(post);

  const toc = getTableOfContents(post.content);
  const showToc = toc.length >= MIN_TOC_HEADINGS;

  return (
    <>
      <ReadingProgress targetId={ARTICLE_ID} />

      <article>
        <header className={`${container} pb-10 pt-16 md:pt-20`}>
          <p className="rise flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
            <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
            {post.category && <span>{post.category.name}</span>}
            {post.category && type && <span aria-hidden>·</span>}
            {type && <span className="text-[var(--signal)]">{type.label}</span>}
          </p>
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
            <time dateTime={published.toISOString()}>
              {formatDate(published)}
            </time>
            {/* Only a "significant update" sets contentUpdatedAt; ordinary edits do not. */}
            {post.contentUpdatedAt && (
              <>
                <span aria-hidden>·</span>
                <span>
                  Last updated{" "}
                  <time dateTime={post.contentUpdatedAt.toISOString()}>
                    {formatDate(post.contentUpdatedAt)}
                  </time>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{post.readingTime} min read</span>
          </p>
          {post.tags.length > 0 && (
            <div
              className="rise mt-6 flex flex-wrap gap-2"
              style={{ "--delay": "240ms" }}
            >
              {post.tags.map((tag) => (
                <TagChip key={tag.slug} tag={tag} />
              ))}
            </div>
          )}
        </header>

        {cover && (
          <div className={container}>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--line)]">
              <Image
                src={cover.url}
                alt={cover.alt}
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
    </>
  );
}
