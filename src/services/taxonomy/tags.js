import { ActionError } from "@/lib/admin-action";
import { slugify, SLUG_PATTERN } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const TAGS_PER_PAGE = 20;

const oneLine = (text) => text.trim().replace(/\s+/g, " ");

export const tagSchema = z
  .object({
    name: z
      .string("Name is required")
      .transform(oneLine)
      .pipe(z.string().min(1, "Name is required").max(40, "Name is too long")),
    slug: z.string().default("").transform((slug) => slug.trim().toLowerCase()),
  })
  .transform((tag) => ({ ...tag, slug: tag.slug || slugify(tag.name) }))
  .refine(
    (tag) => SLUG_PATTERN.test(tag.slug) && tag.slug.length <= 60,
    "Slug may only contain lowercase letters, numbers and single hyphens",
  );

const withCount = ({ postIds, ...tag }) => ({ ...tag, postCount: postIds.length });

/** One page of topics (optionally filtered by name), with post counts (any status). */
export async function getTagsForAdmin({ page = 1, q } = {}) {
  const where = q ? { name: { contains: q, mode: "insensitive" } } : {};
  const [total, tags, unused] = await Promise.all([
    prisma.tag.count({ where }),
    prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * TAGS_PER_PAGE,
      take: TAGS_PER_PAGE,
      select: { id: true, name: true, slug: true, postIds: true },
    }),
    getUnusedTagIds(),
  ]);
  return {
    tags: tags.map(withCount),
    total,
    totalPages: Math.max(1, Math.ceil(total / TAGS_PER_PAGE)),
    unusedCount: unused.length,
  };
}

/**
 * Ids of topics no post uses. Counted here rather than with an `isEmpty` filter:
 * a topic that was never attached to a post has no `postIds` field at all in
 * MongoDB, and that filter does not match a missing field.
 */
async function getUnusedTagIds() {
  const tags = await prisma.tag.findMany({ select: { id: true, postIds: true } });
  return tags.filter((tag) => tag.postIds.length === 0).map((tag) => tag.id);
}

/** Every topic, for the merge selects. */
export async function getAllTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, postIds: true },
  });
  return tags.map(withCount);
}

export async function getTagById(id) {
  const tag = await prisma.tag.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, postIds: true },
  });
  return tag ? withCount(tag) : null;
}

/** Returns `{ before, after }`. */
export async function renameTag(id, input) {
  const data = tagSchema.parse(input);
  const before = await prisma.tag.findUnique({ where: { id } });
  if (!before) throw new ActionError("That topic no longer exists.");
  const after = await prisma.tag.update({ where: { id }, data });
  return { before, after };
}

/**
 * Every post with the source topic gets the target topic instead (never twice),
 * then the source topic is deleted. Returns `{ source, target, moved }`.
 */
export async function mergeTags(sourceId, targetId) {
  if (sourceId === targetId) {
    throw new ActionError("Choose two different topics to merge.");
  }
  const [source, target] = await Promise.all([
    prisma.tag.findUnique({ where: { id: sourceId } }),
    prisma.tag.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) throw new ActionError("One of the topics no longer exists.");

  const posts = await prisma.post.findMany({
    where: { tagIds: { has: sourceId } },
    select: { id: true, tagIds: true },
  });

  for (const post of posts) {
    // Replace the source in place (keeping the order), dropping it if the target is already there.
    const ids = [];
    for (const id of post.tagIds) {
      const next = id === sourceId ? targetId : id;
      if (!ids.includes(next)) ids.push(next);
    }
    await prisma.post.update({
      where: { id: post.id },
      data: { tags: { set: ids.map((id) => ({ id })) } },
    });
  }

  await prisma.tag.delete({ where: { id: sourceId } });
  return { source, target, moved: posts.length };
}

/** Only a topic that no post uses may be deleted. */
export async function deleteUnusedTag(id) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new ActionError("That topic no longer exists.");
  if (tag.postIds.length > 0) {
    throw new ActionError(
      `“${tag.name}” is used by ${tag.postIds.length} post(s). Merge it into another topic instead.`,
    );
  }
  await prisma.tag.delete({ where: { id } });
  return tag;
}

/** Deletes every topic no post uses; returns how many. */
export async function deleteAllUnusedTags() {
  const ids = await getUnusedTagIds();
  if (ids.length === 0) return 0;
  const { count } = await prisma.tag.deleteMany({ where: { id: { in: ids } } });
  return count;
}
