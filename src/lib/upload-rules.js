// Image upload rules shared by the browser (early, friendly errors) and the server
// (the signed Cloudinary parameters). No secrets here.

// SVG is left out on purpose: it can carry scripts.
export const ALLOWED_IMAGE_FORMATS = ["jpg", "png", "webp", "gif", "avif"];

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
