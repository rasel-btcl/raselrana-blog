"use server";

import { runAdminAction } from "@/lib/admin-action";
import {
  deleteAllUnusedTags,
  deleteUnusedTag,
  mergeTags,
  renameTag,
} from "@/services/taxonomy/tags";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BACK = "/admin/tags";
const idSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Unknown topic");

/** Topics are shown on the home page, post cards, post pages and their own pages. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function renameTagAction(id, formData) {
  await runAdminAction({
    back: BACK,
    done: "Topic saved.",
    work: async () => {
      await renameTag(idSchema.parse(id), {
        name: formData.get("name") ?? "",
        slug: formData.get("slug") ?? "",
      });
      refresh();
    },
  });
}

/** Called from the confirmation step, which shows how many posts are affected. */
export async function mergeTagsAction(sourceId, targetId) {
  let summary = "Topics merged.";
  await runAdminAction({
    back: BACK,
    done: () => summary,
    work: async () => {
      const { source, target, moved } = await mergeTags(
        idSchema.parse(sourceId),
        idSchema.parse(targetId),
      );
      summary = `Merged “${source.name}” into “${target.name}” (${moved} post${moved === 1 ? "" : "s"} moved).`;
      refresh();
    },
  });
}

export async function deleteTagAction(id) {
  await runAdminAction({
    back: BACK,
    done: "Topic deleted.",
    work: async () => {
      await deleteUnusedTag(idSchema.parse(id));
      refresh();
    },
  });
}

export async function deleteUnusedTagsAction() {
  let summary = "Unused topics deleted.";
  await runAdminAction({
    back: BACK,
    done: () => summary,
    work: async () => {
      const count = await deleteAllUnusedTags();
      summary = `${count} unused topic${count === 1 ? "" : "s"} deleted.`;
      refresh();
    },
  });
}
