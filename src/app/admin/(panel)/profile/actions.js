"use server";

import { runAdminAction } from "@/lib/admin-action";
import { changePassword, updateProfile } from "@/services/users/profile";
import { revalidatePath } from "next/cache";

const BACK = "/admin/profile";

// Both actions change only the signed-in user's own account, so any active user
// may call them (`admin: false`); the id always comes from the session, never the form.

export async function updateProfileAction(formData) {
  await runAdminAction({
    back: BACK,
    admin: false,
    done: "Profile saved.",
    work: async (user) => {
      const text = (name) => formData.get(name) ?? "";
      const { before, after } = await updateProfile(user.id, {
        name: text("name"),
        username: text("username"),
        bio: text("bio"),
        website: text("website"),
        avatarUrl: text("avatarUrl"),
        socialLinks: {
          linkedin: text("linkedin"),
          github: text("github"),
          facebook: text("facebook"),
          x: text("x"),
        },
      });
      // The author box is on every post, and the author page has its own address.
      revalidatePath("/", "layout");
      revalidatePath(`/author/${before}`);
      revalidatePath(`/author/${after}`);
    },
  });
}

export async function changePasswordAction(formData) {
  await runAdminAction({
    back: BACK,
    admin: false,
    done: "Password changed.",
    work: async (user) => {
      await changePassword(user.id, {
        current: formData.get("current") ?? "",
        next: formData.get("next") ?? "",
        confirm: formData.get("confirm") ?? "",
      });
    },
  });
}
