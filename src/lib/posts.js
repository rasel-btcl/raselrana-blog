// Pure helpers shared by server and client code.

export const SITE_URL = "https://raselrana.com.bd";
export const BLOG_URL = `${SITE_URL}/blog`;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function postUrl(slug) {
  return `${BLOG_URL}/posts/${slug}`;
}

export function tagPath(tag) {
  return `/tags/${encodeURIComponent(tag)}`;
}

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Markdown → readable plain text (for excerpts and word counts). */
export function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ")
    .replace(/[*_~`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words ÷ 200, rounded up, minimum 1. */
export function readingMinutes(markdown) {
  const text = plainText(markdown);
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function excerptFor(post, maxLength = 160) {
  const own = post.excerpt?.trim();
  if (own) return own;

  const text = plainText(post.content ?? "");
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : maxLength).trimEnd()}…`;
}

export function postDate(post) {
  return post.publishedAt ?? post.createdAt;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

/** "8 Oct 2026" */
export function formatDate(date) {
  return dateFormat.format(new Date(date));
}
