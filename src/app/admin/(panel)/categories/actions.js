"use server";

import { ActionError, runAdminAction } from "@/lib/admin-action";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
} from "@/services/taxonomy/categories";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BACK = "/admin/categories";
const idSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Unknown category");

/** Categories appear in the navigation of every public page. */
function refresh(...slugs) {
  revalidatePath("/", "layout");
  for (const slug of slugs) if (slug) revalidatePath(`/category/${slug}`);
}

const fields = (formData) => ({
  name: formData.get("name") ?? "",
  slug: formData.get("slug") ?? "",
  description: formData.get("description") ?? "",
  sortOrder: formData.get("sortOrder") || undefined,
});

export async function createCategoryAction(formData) {
  await runAdminAction({
    back: BACK,
    done: "Category created.",
    work: async () => {
      const category = await createCategory(fields(formData));
      refresh(category.slug);
    },
  });
}

export async function updateCategoryAction(id, formData) {
  await runAdminAction({
    back: BACK,
    done: "Category saved.",
    work: async () => {
      const { before, after } = await updateCategory(idSchema.parse(id), fields(formData));
      refresh(before.slug, after.slug);
    },
  });
}

export async function moveCategoryAction(id, direction) {
  await runAdminAction({
    back: BACK,
    done: "Order changed.",
    work: async () => {
      if (direction !== "up" && direction !== "down") {
        throw new ActionError("Unknown direction.");
      }
      await moveCategory(idSchema.parse(id), direction);
      refresh();
    },
  });
}

export async function deleteCategoryAction(id) {
  await runAdminAction({
    back: BACK,
    done: "Category deleted.",
    work: async () => {
      const category = await deleteCategory(idSchema.parse(id));
      refresh(category.slug);
    },
  });
}
