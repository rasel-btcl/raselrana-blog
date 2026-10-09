// Pure helpers shared by server and client code.

export const SITE_URL = "https://raselrana.com.bd";
export const BLOG_URL = `${SITE_URL}/blog`;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Addresses inside the blog, written without the /blog base path (next/link adds it).
// Articles are flat: /blog/<slug>, never with the category in the address.
// (The older /posts/<slug> and /tags/<slug> redirect here; see next.config.mjs.)
export function postPath(slug) {
  return `/${slug}`;
}

export function tagPath(slug) {
  return `/tag/${slug}`;
}

export function categoryPath(slug) {
  return `/category/${slug}`;
}

/** `typeSlug` is the address slug from src/lib/content-types.js, e.g. "how-to". */
export function typePath(typeSlug) {
  return `/type/${typeSlug}`;
}

export function authorPath(username) {
  return `/author/${username}`;
}

/** Root-relative address on raselrana.com.bd, e.g. for the main site to link to. */
export function publicPostPath(slug) {
  return `/blog${postPath(slug)}`;
}

/** Full public address, for canonical / Open Graph / sharing. */
export function postUrl(slug) {
  return `${SITE_URL}${publicPostPath(slug)}`;
}

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // accents left over from NFKD
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

/** The first block of a post that is ordinary text (not a heading, image, code, table, quote or list). */
function firstParagraph(markdown) {
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
  const notProse = /^(#{1,6}\s|>|[-*+]\s|\d+\.\s|\||!\[|https?:\/\/\S+$)/;

  for (const block of withoutCode.split(/\r?\n\s*\r?\n/)) {
    const trimmed = block.trim();
    if (!trimmed || notProse.test(trimmed)) continue;
    const text = plainText(trimmed);
    if (text) return text;
  }
  return "";
}

/** The post's own excerpt, or about 160 characters from its first paragraph. */
export function excerptFor(post, maxLength = 160) {
  const own = post.excerpt?.trim();
  if (own) return own;

  const content = post.content ?? "";
  const text = firstParagraph(content) || plainText(content);
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

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Dhaka",
});

/** "8 Oct 2026, 18:42" in Dhaka time (used in the admin). */
export function formatDateTime(date) {
  return dateTimeFormat.format(new Date(date));
}

/** "8 Oct 2026" */
export function formatDate(date) {
  return dateFormat.format(new Date(date));
}
