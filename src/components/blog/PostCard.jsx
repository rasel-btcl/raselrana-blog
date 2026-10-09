import { formatDate } from "@/lib/posts";
import { metaLine } from "@/lib/ui";
import Image from "next/image";
import Link from "next/link";
import TagChip from "./TagChip";

function Meta({ post }) {
  return (
    <p className={metaLine}>
      <time dateTime={new Date(post.publishedAt).toISOString()}>
        {formatDate(post.publishedAt)}
      </time>
      {" · "}
      {post.readingMinutes} min read
    </p>
  );
}

function Tags({ tags }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag) => (
        <TagChip key={tag} tag={tag} linked={false} />
      ))}
    </div>
  );
}

/** The whole card is one link. */
export default function PostCard({ post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-colors hover:border-[var(--signal)]"
    >
      {post.coverUrl && (
        <div className="relative aspect-video overflow-hidden border-b border-[var(--line)]">
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-7">
        <Tags tags={post.tags} />
        <h3 className="font-display text-xl font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--signal)]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--slate)]">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-1">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

/** The newest post on the blog home: larger, cover beside the text on wide screens. */
export function FeatureCard({ post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-colors hover:border-[var(--signal)] md:grid-cols-2"
    >
      {post.coverUrl && (
        <div className="relative aspect-video overflow-hidden border-b border-[var(--line)] md:aspect-auto md:min-h-80 md:border-b-0 md:border-r">
          <Image
            src={post.coverUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 560px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div
        className={`flex flex-col justify-center gap-5 p-7 md:p-10 ${
          post.coverUrl ? "" : "md:col-span-2"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--signal)]">
          Latest post
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--signal)] md:text-4xl">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 max-w-2xl leading-relaxed text-[var(--slate)]">
            {post.excerpt}
          </p>
        )}
        <Tags tags={post.tags} />
        <Meta post={post} />
      </div>
    </Link>
  );
}
