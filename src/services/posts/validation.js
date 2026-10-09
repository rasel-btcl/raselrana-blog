import { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { SLUG_PATTERN } from "@/lib/posts";

export const MAX_TITLE_LENGTH = 200;
export const MAX_SLUG_LENGTH = 120;
export const MAX_EXCERPT_LENGTH = 300;
export const MAX_CONTENT_LENGTH = 200_000;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 40;

const CLOUDINARY_URL_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidPostId(id) {
  return typeof id === "string" && OBJECT_ID_PATTERN.test(id);
}

/** Trimmed, no duplicates (ignoring case), kept as typed. */
function parseTags(value) {
  if (value == null) return { tags: [] };
  if (!Array.isArray(value)) return { error: "Topics must be a list" };

  const tags = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string") return { error: "Topics must be text" };
    const tag = item.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > MAX_TAG_LENGTH || /[\/\\?#%]/.test(tag)) {
      return {
        error: `A topic can be at most ${MAX_TAG_LENGTH} characters and cannot contain / \\ ? # %`,
      };
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  if (tags.length > MAX_TAGS) {
    return { error: `A post can have at most ${MAX_TAGS} topics` };
  }
  return { tags };
}

/**
 * Validates a full post payload from the admin editor.
 * Returns `{ data }` ready for Prisma, or `{ error }` with a message for the user.
 */
export function parsePostInput(body) {
  if (
    typeof body?.title !== "string" ||
    typeof body?.slug !== "string" ||
    typeof body?.content !== "string"
  ) {
    return { error: "Missing required fields" };
  }

  const title = body.title.trim();
  const slug = body.slug.trim().toLowerCase();
  const content = body.content;

  if (!title || !slug || !content.trim()) {
    return { error: "Title, slug and content are required" };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  }
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return {
      error:
        "Slug may only contain lowercase letters, numbers and single hyphens",
    };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: "Content is too long" };
  }

  let excerpt = null;
  if (body.excerpt != null) {
    if (typeof body.excerpt !== "string") {
      return { error: "Excerpt must be text" };
    }
    excerpt = body.excerpt.trim().replace(/\s+/g, " ") || null;
    if (excerpt && excerpt.length > MAX_EXCERPT_LENGTH) {
      return {
        error: `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or fewer`,
      };
    }
  }

  const { tags, error: tagError } = parseTags(body.tags);
  if (tagError) return { error: tagError };

  // Only accept a cover that came from our own Cloudinary upload folder.
  let coverUrl = null;
  let coverPublicId = null;
  if (body.coverImage != null) {
    const { url, publicId } = body.coverImage;
    if (
      typeof url !== "string" ||
      typeof publicId !== "string" ||
      !url.startsWith(CLOUDINARY_URL_PREFIX) ||
      !publicId.startsWith(`${UPLOAD_FOLDER}/`)
    ) {
      return { error: "Invalid cover image" };
    }
    coverUrl = url;
    coverPublicId = publicId;
  }

  return {
    data: {
      title,
      slug,
      excerpt,
      content,
      tags,
      coverUrl,
      coverPublicId,
      published: body.published === true,
    },
  };
}
