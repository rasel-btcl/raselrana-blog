import { plainText } from "@/lib/posts";

const MIN_WORDS = 300;
const MIN_TAGS = 3;

/** Markdown without its code blocks, so a "##" inside code is not taken for a heading. */
function withoutCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "").replace(/~~~[\s\S]*?~~~/g, "");
}

/**
 * The pre-publish checklist (docs/BLOG_ADMIN_SPEC.md §7.4).
 * `errors` block publishing; `warnings` may be ignored.
 * `target` is the status being asked for; `scheduleDate` a Date or null.
 */
export function buildChecklist({
  title,
  slug,
  content,
  categoryId,
  featuredImage,
  tags,
  seoDescription,
  target,
  scheduleDate,
  now,
}) {
  const errors = [];
  const warnings = [];
  const body = withoutCode(content);

  if (!title.trim()) errors.push("Add a title.");
  if (!slug.trim()) errors.push("Add a slug.");
  if (!content.trim()) errors.push("The post has no content.");
  if (!categoryId) errors.push("Choose a category.");
  if (!featuredImage) {
    errors.push("Add a featured image.");
  } else if (!featuredImage.alt?.trim()) {
    errors.push("Describe the featured image (alt text).");
  }
  if (target === "SCHEDULED" && (!scheduleDate || scheduleDate <= now)) {
    errors.push("Choose a publish date in the future.");
  }

  if (!seoDescription.trim()) {
    warnings.push("No SEO description. The excerpt will be used instead.");
  }
  if (!/^##\s+\S/m.test(body)) {
    warnings.push("The post has no H2 heading (## Heading).");
  }
  if (tags.length < MIN_TAGS) {
    warnings.push(`Fewer than ${MIN_TAGS} topics (${tags.length}).`);
  }
  if (/!\[\s*\]\(/.test(body)) {
    warnings.push("An image in the post has no description: ![](…).");
  }
  const text = plainText(content);
  const words = text ? text.split(" ").length : 0;
  if (words < MIN_WORDS) {
    warnings.push(`Only about ${words} words (fewer than ${MIN_WORDS}).`);
  }

  return { errors, warnings };
}
