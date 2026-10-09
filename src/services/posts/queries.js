import { isCloudinaryImage } from "@/lib/cloudinary-loader";
import { excerptFor, postDate, readingMinutes } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const POSTS_PER_PAGE = 9;

const NEWEST_FIRST = [{ publishedAt: "desc" }, { createdAt: "desc" }];

const CARD_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverUrl: true,
  tags: true,
  publishedAt: true,
  createdAt: true,
};

/** What a post card (and the public API) needs. Never includes content or ids. */
function toCard(post) {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: excerptFor(post),
    coverUrl: isCloudinaryImage(post.coverUrl) ? post.coverUrl : null,
    tags: post.tags,
    publishedAt: postDate(post),
    readingMinutes: readingMinutes(post.content),
  };
}

// ---------- Public (published posts only) ----------

export async function getPublishedPosts({ page = 1, q, tag } = {}) {
  const where = { published: true };
  if (tag) where.tags = { has: tag };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
    // Lists cannot be searched ignoring case, so match topic names here first.
    const needle = q.toLowerCase();
    const topics = (await getTagCounts())
      .map(({ tag }) => tag)
      .filter((name) => name.toLowerCase().includes(needle));
    if (topics.length > 0) where.OR.push({ tags: { hasSome: topics } });
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: NEWEST_FIRST,
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      select: CARD_SELECT,
    }),
  ]);

  return {
    posts: posts.map(toCard),
    total,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export async function getLatestPosts(limit) {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: NEWEST_FIRST,
    take: limit,
    select: CARD_SELECT,
  });
  return posts.map(toCard);
}

// cache(): generateMetadata and the page both ask for the same post.
export const getPublishedPostBySlug = cache(async (slug) => {
  return prisma.post.findFirst({ where: { slug, published: true } });
});

/** `[{ tag, count }]`, most used first. */
export async function getTagCounts() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const counts = new Map();
  for (const { tags } of posts) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getAdjacentPosts(post) {
  const date = postDate(post);
  const select = { title: true, slug: true };
  const others = { published: true, slug: { not: post.slug } };

  const [newer, older] = await Promise.all([
    prisma.post.findFirst({
      where: { ...others, publishedAt: { gt: date } },
      orderBy: { publishedAt: "asc" },
      select,
    }),
    prisma.post.findFirst({
      where: { ...others, publishedAt: { lt: date } },
      orderBy: { publishedAt: "desc" },
      select,
    }),
  ]);

  return { newer, older };
}

/** Up to three posts sharing a topic; if there are none, the newest others. */
export async function getRelatedPosts(post, limit = 3) {
  const others = { published: true, slug: { not: post.slug } };
  const query = { orderBy: NEWEST_FIRST, take: limit, select: CARD_SELECT };

  let related = [];
  if (post.tags.length > 0) {
    related = await prisma.post.findMany({
      where: { ...others, tags: { hasSome: post.tags } },
      ...query,
    });
  }
  if (related.length === 0) {
    related = await prisma.post.findMany({ where: others, ...query });
  }

  return related.map(toCard);
}

// ---------- Admin (drafts included) ----------

export async function getAllPostsForAdmin() {
  return prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      tags: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function getPostById(id) {
  return prisma.post.findUnique({ where: { id } });
}

/** Every topic ever used, for suggestions in the editor. */
export async function getAllTagNames() {
  const posts = await prisma.post.findMany({ select: { tags: true } });
  return [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}
