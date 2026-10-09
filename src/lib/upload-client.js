// Browser-side helper for the admin: sends an image to /api/upload.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Resolves to `{ url, publicId, width, height }`, or throws with a message for the user. */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${basePath}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Image upload failed");
  return data;
}
