import { isCloudinaryImage } from "@/lib/cloudinary-loader";
import { contentTypeByValue } from "@/lib/content-types";
import { postDate, publicPostPath } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const POSTS_PER_PAGE = 9;

const NEWEST_FIRST = [{ publishedAt: "desc" }, { createdAt: "desc" }];

// ---------- What counts as public (docs/BLOG_ADMIN_SPEC.md §6.1) ----------

/** A post readers can open: published, or scheduled with its time passed. */
export function livePostWhere(now = new Date()) {
  return {
    OR: [
      { status: "PUBLISHED" },
      { status: "SCHEDULED", publishedAt: { lte: now } },
    ],
  };
}

/**
 * A post that may appear in listings, search, related posts and the sitemap:
 * live and not `noindex`. Extra conditions are ANDed on.
 */
export function listedPostWhere(...conditions) {
  return { AND: [livePostWhere(), { noindex: false }, ...conditions] };
}

// ---------- Cards ----------

const CARD_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  contentType: true,
  readingTime: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true } },
};

/** `{ url, alt }` of a post's featured image, or `null` if it has none we can show. */
export function coverOf(post) {
  const image = post.featuredImage;
  if (!image || !isCloudinaryImage(image.url)) return null;
  return { url: image.url, alt: image.alt ?? "" };
}

/** What a post card needs. Never includes content or ids. */
function toCard(post) {
  const cover = coverOf(post);
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverUrl: cover?.url ?? null,
    coverAlt: cover?.alt ?? "",
    tags: post.tags,
    category: post.category,
    contentType: contentTypeByValue(post.contentType),
    publishedAt: postDate(post),
    readingMinutes: post.readingTime,
  };
}

// ---------- Public ----------

export async function getPublishedPosts({ page = 1, q, tagSlug } = {}) {
  const conditions = [];
  if (tagSlug) conditions.push({ tags: { some: { slug: tagSlug } } });
  if (q) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
        { category: { is: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  const where = listedPostWhere(...conditions);

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

/**
 * Newest posts for the main site (docs/main-site-api.md): listed posts whose
 * "Show on main site" option is on. The shape is a contract with the main site.
 */
export async function getPostsForMainSite(limit) {
  const posts = await prisma.post.findMany({
    where: listedPostWhere({ showOnMainSite: true }),
    orderBy: NEWEST_FIRST,
    take: limit,
    select: CARD_SELECT,
  });

  return posts.map((post) => {
    const card = toCard(post);
    return {
      title: card.title,
      slug: card.slug,
      url: publicPostPath(card.slug),
      excerpt: card.excerpt,
      coverUrl: card.coverUrl,
      coverAlt: card.coverAlt,
      tags: card.tags.map((tag) => tag.name),
      category: card.category,
      contentType: card.contentType
        ? { label: card.contentType.label, slug: card.contentType.slug }
        : null,
      publishedAt: card.publishedAt,
      readingMinutes: card.readingMinutes,
    };
  });
}

// cache(): generateMetadata and the page both ask for the same post.
// A noindex post is still reachable by its address, so this uses livePostWhere.
export const getLivePostBySlug = cache(async (slug) => {
  return prisma.post.findFirst({
    where: { AND: [livePostWhere(), { slug }] },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
});

/** `[{ name, slug, count }]` for topics with at least one listed post, most used first. */
export async function getTagCounts() {
  const tags = await prisma.tag.findMany({
    select: {
      name: true,
      slug: true,
      posts: { where: listedPostWhere(), select: { id: true } },
    },
  });

  return tags
    .map(({ name, slug, posts }) => ({ name, slug, count: posts.length }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getTagBySlug(slug) {
  return prisma.tag.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
}

export async function getAdjacentPosts(post) {
  const date = postDate(post);
  const select = { title: true, slug: true };
  const notThis = { slug: { not: post.slug } };

  const [newer, older] = await Promise.all([
    prisma.post.findFirst({
      where: listedPostWhere(notThis, { publishedAt: { gt: date } }),
      orderBy: { publishedAt: "asc" },
      select,
    }),
    prisma.post.findFirst({
      where: listedPostWhere(notThis, { publishedAt: { lt: date } }),
      orderBy: { publishedAt: "desc" },
      select,
    }),
  ]);

  return { newer, older };
}

/** Up to three posts sharing a topic; if there are none, the newest others. */
export async function getRelatedPosts(post, limit = 3) {
  const notThis = { slug: { not: post.slug } };
  const query = { orderBy: NEWEST_FIRST, take: limit, select: CARD_SELECT };

  let related = [];
  if (post.tagIds.length > 0) {
    related = await prisma.post.findMany({
      where: listedPostWhere(notThis, { tagIds: { hasSome: post.tagIds } }),
      ...query,
    });
  }
  if (related.length === 0) {
    related = await prisma.post.findMany({
      where: listedPostWhere(notThis),
      ...query,
    });
  }

  return related.map(toCard);
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true },
  });
}

// ---------- Admin (every status) ----------

export async function getAllPostsForAdmin() {
  return prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      contentType: true,
      showOnMainSite: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });
}

/** With category and tags, as the editor and the permission checks need it. */
export async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
}

/** Every topic name, for suggestions in the editor. */
export async function getAllTagNames() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return tags.map((tag) => tag.name);
}
