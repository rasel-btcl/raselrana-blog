import { ActionError } from "@/lib/admin-action";
import { slugify, SLUG_PATTERN } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const oneLine = (text) => text.trim().replace(/\s+/g, " ");

export const categorySchema = z
  .object({
    name: z
      .string("Name is required")
      .transform(oneLine)
      .pipe(z.string().min(1, "Name is required").max(60, "Name is too long")),
    // Left empty, the slug is made from the name.
    slug: z.string().default("").transform((slug) => slug.trim().toLowerCase()),
    description: z
      .string()
      .default("")
      .transform(oneLine)
      .pipe(z.string().max(300, "Description must be 300 characters or fewer")),
    sortOrder: z.coerce
      .number("Order must be a number")
      .int("Order must be a whole number")
      .min(0)
      .max(9999)
      .optional(),
  })
  .transform((category) => ({
    ...category,
    slug: category.slug || slugify(category.name),
    description: category.description || null,
  }))
  .refine(
    (category) => SLUG_PATTERN.test(category.slug) && category.slug.length <= 60,
    "Slug may only contain lowercase letters, numbers and single hyphens",
  );

/** Every category in display order, with how many posts it holds (any status). */
export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
  return categories.map(({ _count, ...category }) => ({
    ...category,
    postCount: _count.posts,
  }));
}

export async function createCategory(input) {
  const data = categorySchema.parse(input);
  if (data.sortOrder === undefined) {
    const last = await prisma.category.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    data.sortOrder = (last?.sortOrder ?? 0) + 1;
  }
  return prisma.category.create({ data });
}

/** Returns `{ before, after }` so the caller can refresh both addresses. */
export async function updateCategory(id, input) {
  const data = categorySchema.parse(input);
  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) throw new ActionError("That category no longer exists.");

  if (data.sortOrder === undefined) delete data.sortOrder;
  const after = await prisma.category.update({ where: { id }, data });
  return { before, after };
}

/** Move one place up or down by swapping places with its neighbour. */
export async function moveCategory(id, direction) {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const index = categories.findIndex((category) => category.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= categories.length) return;

  [categories[index], categories[target]] = [categories[target], categories[index]];

  // Renumber everything, so equal or gapped numbers left by manual edits are repaired.
  await prisma.$transaction(
    categories.map((category, position) =>
      prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: position + 1 },
      }),
    ),
  );
}

/** Only an empty category may be deleted. Returns the deleted category. */
export async function deleteCategory(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  if (!category) throw new ActionError("That category no longer exists.");
  if (category._count.posts > 0) {
    throw new ActionError(
      `“${category.name}” still has ${category._count.posts} post(s). Move posts first.`,
    );
  }
  await prisma.category.delete({ where: { id } });
  return category;
}
