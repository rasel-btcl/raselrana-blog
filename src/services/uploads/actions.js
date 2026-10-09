"use server";

import { AuthzError, requireUser } from "@/lib/authz";
import cloudinary, { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { ALLOWED_IMAGE_FORMATS } from "@/lib/upload-rules";
import { z } from "zod";

const inputSchema = z.object({
  // The post the image belongs to; a post that is not saved yet has none.
  postId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .nullish(),
  // "avatar" files the image under avatars/ instead of a post.
  kind: z.enum(["post", "avatar"]).default("post"),
});

/**
 * Signs one direct browser → Cloudinary upload (docs/BLOG_ADMIN_SPEC.md §7.4.1).
 * The file never passes through this server, and the API secret never leaves it:
 * the browser only receives a signature that is valid for these exact parameters
 * for about an hour.
 *
 * Returns `{ ok: true, uploadUrl, fields }` or `{ ok: false, error }`.
 */
export async function signImageUpload(input) {
  try {
    await requireUser();
  } catch (error) {
    if (error instanceof AuthzError) {
      return { ok: false, error: "Please sign in again." };
    }
    throw error;
  }

  const parsed = inputSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid upload request" };

  // Everything Cloudinary should enforce has to be part of the signature.
  const params = {
    folder:
      parsed.data.kind === "avatar"
        ? `${UPLOAD_FOLDER}/avatars`
        : `${UPLOAD_FOLDER}/posts/${parsed.data.postId ?? "unassigned"}`,
    allowed_formats: ALLOWED_IMAGE_FORMATS.join(","),
    timestamp: Math.round(Date.now() / 1000),
  };

  const { cloud_name, api_key, api_secret } = cloudinary.config();
  const signature = cloudinary.utils.api_sign_request(params, api_secret);

  return {
    ok: true,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    fields: { ...params, api_key, signature },
  };
}
