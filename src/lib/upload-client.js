// Browser-side helper for the admin: uploads an image straight to Cloudinary.

import { signImageUpload } from "@/services/uploads/actions";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./upload-rules";

/**
 * Asks the server to sign the upload, then sends the file directly to Cloudinary
 * (it never passes through our server). `postId` puts it in that post's folder;
 * `kind: "avatar"` puts it with the profile pictures instead.
 * Resolves to `{ url, publicId, width, height }`, or throws with a message for the user.
 */
export async function uploadImage(file, { postId = null, kind = "post" } = {}) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, GIF and AVIF images are allowed");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is larger than 5 MB`);
  }

  const signed = await signImageUpload({ postId, kind });
  if (!signed.ok) throw new Error(signed.error);

  const body = new FormData();
  body.append("file", file);
  for (const [name, value] of Object.entries(signed.fields)) {
    body.append(name, String(value));
  }

  let res;
  try {
    res = await fetch(signed.uploadUrl, { method: "POST", body });
  } catch {
    throw new Error("Could not reach the image service. Check your connection.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    console.error("Cloudinary upload error:", data?.error?.message);
    throw new Error("Image upload failed. Please try again.");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}
