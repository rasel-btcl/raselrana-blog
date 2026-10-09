import { readingMinutes } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { revalidatePosts } from "./revalidate";
import { isSlugTaken, nextPreviousSlugs } from "./slugs";

/** Thrown for problems the author can fix; `status` is the HTTP status to answer with. */
export class PostError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "PostError";
    this.status = status;
  }
}

// What revalidatePosts() needs to know about a post.
const PAGES_SELECT = {
  slug: true,
  contentType: true,
  category: { select: { slug: true } },
  tags: { select: { slug: true } },
};

/** Find or create each topic; returns their ids in the given order. */
async function resolveTagIds(tags) {
  const ids = [];
  for (const { name, slug } of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {}, // an existing topic keeps its spelling
      create: { name, slug },
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}

async function assertCategoryExists(categoryId) {
  if (!categoryId) return;
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new PostError(400, "Unknown category");
}

/** Fields stored as they come from validation, plus the derived ones. */
function storedFields(data) {
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    contentType: data.contentType,
    status: data.status,
    featuredImage: data.featuredImage,
    showOnMainSite: data.showOnMainSite,
    readingTime: readingMinutes(data.content),
  };
}

/** `data` comes from parsePostInput(); `author` is the signed-in user. */
export async function createPost(data, author) {
  if (await isSlugTaken(data.slug)) {
    throw new PostError(409, "A post with this slug already exists");
  }
  await assertCategoryExists(data.categoryId);
  const tagIds = await resolveTagIds(data.tags);

  const post = await prisma.post.create({
    data: {
      ...storedFields(data),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      author: { connect: { id: author.id } },
      ...(data.categoryId
        ? { category: { connect: { id: data.categoryId } } }
        : {}),
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
    include: { category: true, tags: true },
  });

  revalidatePosts(post);
  return post;
}

/** `existing` is the post as loaded for the permission check (with category and tags). */
export async function updatePost(existing, data) {
  if (await isSlugTaken(data.slug, existing.id)) {
    throw new PostError(409, "A post with this slug already exists");
  }
  await assertCategoryExists(data.categoryId);
  const tagIds = await resolveTagIds(data.tags);

  const post = await prisma.post.update({
    where: { id: existing.id },
    data: {
      ...storedFields(data),
      previousSlugs: nextPreviousSlugs(existing, data.slug),
      // publishedAt records the first publish only; unpublishing keeps it.
      publishedAt:
        existing.publishedAt ??
        (data.status === "PUBLISHED" ? new Date() : null),
      category: data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true },
      tags: { set: tagIds.map((id) => ({ id })) },
    },
    include: { category: true, tags: true },
  });

  revalidatePosts(existing, post);
  return post;
}

/** Returns `false` if the post does not exist. */
export async function deletePost(id) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, ...PAGES_SELECT },
  });
  if (!existing) return false;

  // Take the post off its topics first, so no topic keeps a dangling reference.
  await prisma.post.update({
    where: { id },
    data: { tags: { set: [] } },
  });
  await prisma.post.delete({ where: { id } });

  revalidatePosts(existing);
  return true;
}
