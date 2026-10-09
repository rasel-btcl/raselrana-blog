// Safe to import from client code: no Cloudinary SDK or secrets here.
const HOST = "https://res.cloudinary.com/";
const MARKER = "/image/upload/";

export function isCloudinaryImage(src) {
  return (
    typeof src === "string" && src.startsWith(HOST) && src.includes(MARKER)
  );
}

/** Ask Cloudinary for a resized, auto-format copy. Other addresses pass through unchanged. */
export function cloudinaryUrl(src, width) {
  if (!isCloudinaryImage(src)) return src;

  const at = src.indexOf(MARKER) + MARKER.length;
  const rest = src.slice(at);
  if (rest.startsWith("f_auto,")) return src; // already transformed

  return `${src.slice(0, at)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

export function cloudinarySrcSet(src, widths) {
  if (!isCloudinaryImage(src)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(src, w)} ${w}w`).join(", ");
}

// next/image custom loader (next.config.mjs → images.loaderFile)
export default function cloudinaryLoader({ src, width }) {
  return cloudinaryUrl(src, width);
}
