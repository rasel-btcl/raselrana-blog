import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Every public page can show post data, so refresh them all after a change.
function refreshPublicPages() {
  revalidatePath("/", "layout");
}

export async function createPost(data) {
  const post = await prisma.post.create({
    data: { ...data, publishedAt: data.published ? new Date() : null },
  });
  refreshPublicPages();
  return post;
}

/** Returns the updated post, or `null` if it does not exist. */
export async function updatePost(id, data) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { publishedAt: true },
  });
  if (!existing) return null;

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...data,
      // publishedAt records the first publish only; unpublishing keeps it.
      publishedAt:
        existing.publishedAt ?? (data.published ? new Date() : null),
    },
  });
  refreshPublicPages();
  return post;
}

/** Returns `false` if the post does not exist. */
export async function deletePost(id) {
  const { count } = await prisma.post.deleteMany({ where: { id } });
  if (count === 0) return false;
  refreshPublicPages();
  return true;
}
