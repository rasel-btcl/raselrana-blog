import { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { CONTENT_TYPE_VALUES, DEFAULT_CONTENT_TYPE } from "@/lib/content-types";
import { excerptFor, slugify, SLUG_PATTERN } from "@/lib/posts";
import { z } from "zod";
import { RESERVED_SLUGS } from "./slugs";

export const MAX_TITLE_LENGTH = 200;
export const MAX_SLUG_LENGTH = 120;
export const MAX_EXCERPT_LENGTH = 300;
export const MAX_CONTENT_LENGTH = 200_000;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 40;
export const MAX_ALT_LENGTH = 200;
export const MAX_SEO_TITLE_LENGTH = 60;
export const MAX_SEO_DESCRIPTION_LENGTH = 160;
export const MAX_RELATED_POSTS = 4;

const CLOUDINARY_URL_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidObjectId(id) {
  return typeof id === "string" && OBJECT_ID_PATTERN.test(id);
}

const oneLine = (text) => text.trim().replace(/\s+/g, " ");

// Only accept an image that came from our own Cloudinary upload folder.
const featuredImageSchema = z
  .object({
    url: z.string(),
    publicId: z.string(),
    width: z.number().int().positive().nullish(),
    height: z.number().int().positive().nullish(),
    alt: z
      .string()
      .max(MAX_ALT_LENGTH, `Alt text must be ${MAX_ALT_LENGTH} characters or fewer`)
      .default("")
      .transform(oneLine),
  })
  .refine(
    (image) =>
      image.url.startsWith(CLOUDINARY_URL_PREFIX) &&
      image.publicId.startsWith(`${UPLOAD_FOLDER}/`),
    "Invalid featured image",
  );

/** Trimmed, no duplicates (by slug), kept as typed. */
const tagsSchema = z
  .array(z.string("Topics must be text"), "Topics must be a list")
  .default([])
  .transform((names, ctx) => {
    const tags = [];
    const seen = new Set();

    for (const raw of names) {
      const name = oneLine(raw);
      if (!name) continue;

      const slug = slugify(name);
      if (name.length > MAX_TAG_LENGTH || !slug) {
        ctx.addIssue({
          code: "custom",
          message: `A topic needs letters or numbers and at most ${MAX_TAG_LENGTH} characters`,
        });
        return z.NEVER;
      }
      if (seen.has(slug)) continue;
      seen.add(slug);
      tags.push({ name, slug });
    }

    if (tags.length > MAX_TAGS) {
      ctx.addIssue({
        code: "custom",
        message: `A post can have at most ${MAX_TAGS} topics`,
      });
      return z.NEVER;
    }
    return tags;
  });

/** Optional one-line text: trimmed, `null` when empty, at most `max` characters. */
const optionalText = (max, label) =>
  z
    .string(`${label} must be text`)
    .nullish()
    .transform((text) => oneLine(text ?? ""))
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((text) => text || null);

/** Optional https address, `null` when empty. */
const optionalUrl = (label) =>
  z
    .string(`${label} must be text`)
    .nullish()
    .transform((text) => (text ?? "").trim())
    .refine(
      (text) => !text || (/^https:\/\/\S+$/.test(text) && URL.canParse(text)),
      `${label} must be a full https:// address`,
    )
    .transform((text) => text || null);

const postSchema = z.object({
  title: z
    .string("Title is required")
    .transform(oneLine)
    .pipe(
      z
        .string()
        .min(1, "Title is required")
        .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`),
    ),
  slug: z
    .string("Slug is required")
    .transform((slug) => slug.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1, "Slug is required")
        .max(MAX_SLUG_LENGTH, `Slug must be ${MAX_SLUG_LENGTH} characters or fewer`)
        .regex(
          SLUG_PATTERN,
          "Slug may only contain lowercase letters, numbers and single hyphens",
        )
        .refine((slug) => !RESERVED_SLUGS.has(slug), "That slug is reserved"),
    ),
  excerpt: z
    .string("Excerpt must be text")
    .nullish()
    .transform((text) => oneLine(text ?? ""))
    .pipe(
      z
        .string()
        .max(
          MAX_EXCERPT_LENGTH,
          `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or fewer`,
        ),
    ),
  content: z
    .string("Content must be text")
    .max(MAX_CONTENT_LENGTH, "Content is too long")
    .default(""),
  contentType: z
    .enum(CONTENT_TYPE_VALUES, "Unknown content type")
    .default(DEFAULT_CONTENT_TYPE),
  categoryId: z
    .string()
    .regex(OBJECT_ID_PATTERN, "Unknown category")
    .nullish()
    .transform((id) => id ?? null),
  tags: tagsSchema,
  featuredImage: featuredImageSchema.nullish().transform((image) => image ?? null),
  status: z
    .enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"], "Unknown status")
    .default("DRAFT"),
  // When a scheduled post goes live (an ISO date-time). Ignored for other statuses.
  publishedAt: z
    .string("Invalid publish date")
    .nullish()
    .transform((value, ctx) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Invalid publish date" });
        return z.NEVER;
      }
      return date;
    }),
  // Ticked on "Update" for a change readers should know about; sets "Last updated".
  significantUpdate: z.boolean("Invalid value").default(false),
  relatedPostIds: z
    .array(z.string().regex(OBJECT_ID_PATTERN, "Unknown related post"))
    .max(MAX_RELATED_POSTS, `Pick at most ${MAX_RELATED_POSTS} related posts`)
    .default([])
    .transform((ids) => [...new Set(ids)]),
  seoTitle: optionalText(MAX_SEO_TITLE_LENGTH, "SEO title"),
  seoDescription: optionalText(MAX_SEO_DESCRIPTION_LENGTH, "SEO description"),
  ogImageUrl: optionalUrl("Social image address"),
  canonicalUrl: optionalUrl("Canonical address"),
  noindex: z.boolean("Invalid value").default(false),
  showOnMainSite: z.boolean("Invalid value").default(true),
});

/** What a post needs before it may go public (docs/BLOG_ADMIN_SPEC.md §6.4). */
function publishProblem(post) {
  if (post.status === "SCHEDULED") {
    if (!post.publishedAt || post.publishedAt <= new Date()) {
      return "Choose a publish date in the future to schedule this post";
    }
  }
  if (!post.content.trim()) return "Content is required to publish";
  if (!post.excerpt) return "An excerpt is required to publish";
  if (!post.categoryId) return "Choose a category before publishing";
  if (!post.featuredImage) return "Add a featured image before publishing";
  if (!post.featuredImage.alt) {
    return "Describe the featured image (alt text) before publishing";
  }
  return null;
}

/**
 * Validates the editor payload. Drafts may be incomplete; publishing may not.
 * Returns `{ data }` (with `tags` as `[{ name, slug }]`), or `{ error }` with a
 * message for the user.
 */
export function parsePostInput(body) {
  const result = postSchema.safeParse(body ?? {});
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid post" };
  }

  const data = result.data;
  // Left empty, the excerpt comes from the start of the content.
  if (!data.excerpt) data.excerpt = excerptFor({ content: data.content });

  // Drafts and archived posts may be incomplete.
  if (data.status === "PUBLISHED" || data.status === "SCHEDULED") {
    const problem = publishProblem(data);
    if (problem) return { error: problem };
  }

  return { data };
}
