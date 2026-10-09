"use client";

import ImageUploader from "@/components/media/ImageUploader";
import Markdown from "@/components/mdx/Markdown";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { CONTENT_TYPES, DEFAULT_CONTENT_TYPE } from "@/lib/content-types";
import { slugify } from "@/lib/posts";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSmall,
  chip,
  fieldLabel,
  input,
} from "@/lib/ui";
import { parseYouTubeUrl } from "@/lib/youtube";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const MAX_TAGS = 8;
const MAX_EXCERPT_LENGTH = 300;
const MAX_ALT_LENGTH = 200;

const altFromFile = (file) =>
  file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

/**
 * Create or edit a post. Pass `post` to edit an existing one.
 * `categories` fills the category select; `tagSuggestions` are topics already in
 * use, offered so one topic is not spelled two ways.
 */
export default function PostEditor({
  post = null,
  categories = [],
  tagSuggestions = [],
}) {
  const router = useRouter();
  const contentRef = useRef(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // The slug follows the title until it is edited by hand (or the post already exists).
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [contentType, setContentType] = useState(
    post?.contentType ?? DEFAULT_CONTENT_TYPE,
  );
  const [tags, setTags] = useState(post?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  // { url, publicId, width, height, alt }
  const [featuredImage, setFeaturedImage] = useState(
    post?.featuredImage ?? null,
  );
  const [content, setContent] = useState(post?.content ?? "");
  const [showOnMainSite, setShowOnMainSite] = useState(
    post?.showOnMainSite ?? true,
  );
  const [status, setStatus] = useState(post?.status ?? "DRAFT");
  // Once published, a changed slug leaves the old address redirecting.
  const everPublished = Boolean(post?.everPublished) || status === "PUBLISHED";
  const [savedSlug, setSavedSlug] = useState(post?.slug ?? "");

  const [view, setView] = useState("write"); // phones show one pane at a time
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const published = status === "PUBLISHED";

  const handleTitleChange = (value) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const addTag = (raw) => {
    const tag = raw.trim().replace(/\s+/g, " ");
    setTagDraft("");
    if (!tag) return;
    if (tags.length >= MAX_TAGS) {
      setError(`A post can have at most ${MAX_TAGS} topics`);
      return;
    }
    // Reuse the existing spelling if this topic is already known.
    const known = tagSuggestions.find(
      (t) => t.toLowerCase() === tag.toLowerCase(),
    );
    const value = known ?? tag;
    if (tags.some((t) => slugify(t) === slugify(value))) return;
    setTags([...tags, value]);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  /** Put a block of Markdown at the cursor, on lines of its own. */
  const insertBlock = (block) => {
    const el = contentRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;

    const before = content.slice(0, start);
    const after = content.slice(end);
    const lead =
      !before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const tail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const text = `${lead}${block}${tail}`;

    setContent(before + text + after);

    const cursor = before.length + text.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  // Ask what the picture shows (alt text) and, optionally, for a caption.
  const insertImage = (image, file) => {
    // Characters that would break the Markdown image syntax are dropped.
    const clean = (text) => (text ?? "").replace(/[\[\]"\r\n]/g, " ").trim();
    const alt = clean(
      window.prompt(
        "Describe the image for readers who cannot see it (alt text)",
        altFromFile(file),
      ),
    );
    const caption = clean(
      window.prompt("Caption shown under the image (optional)", ""),
    );
    insertBlock(
      caption ? `![${alt}](${image.url} "${caption}")` : `![${alt}](${image.url})`,
    );
  };

  // Images on consecutive lines (no blank line between) render as one photo grid.
  const insertGallery = (images, files) => {
    insertBlock(
      images
        .map((image, i) => `![${altFromFile(files[i])}](${image.url})`)
        .join("\n"),
    );
  };

  // A YouTube address on a line of its own renders as a video.
  const insertVideo = () => {
    const link = window.prompt("Paste the YouTube link");
    if (!link) return;
    if (!parseYouTubeUrl(link.trim())) {
      setError("That does not look like a YouTube video link");
      return;
    }
    setError(null);
    insertBlock(link.trim());
  };

  const save = async (nextStatus) => {
    if (saving) return;

    // A topic typed but not yet confirmed with Enter still counts.
    const pending = tagDraft.trim();
    const allTags =
      pending && !tags.some((t) => slugify(t) === slugify(pending))
        ? [...tags, pending]
        : tags;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(
        post ? `${basePath}/api/posts/${post.id}` : `${basePath}/api/posts`,
        {
          method: post ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug,
            excerpt,
            categoryId: categoryId || null,
            contentType,
            tags: allTags,
            featuredImage,
            content,
            showOnMainSite,
            status: nextStatus,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the post");
        return;
      }

      if (!post) {
        // Continue on the edit page of the post that was just created.
        router.replace(`/admin/posts/${data.post.id}/edit`);
        router.refresh();
        return;
      }

      const wasPublished = published;
      const nowPublished = data.post.status === "PUBLISHED";

      setTags(data.post.tags.map((tag) => tag.name));
      setTagDraft("");
      setSlug(data.post.slug);
      setExcerpt(data.post.excerpt);
      setStatus(data.post.status);
      setSavedSlug(data.post.slug);
      setNotice(
        nowPublished
          ? wasPublished
            ? "Changes saved and live."
            : "Published."
          : wasPublished
            ? "Unpublished. The post is a draft again."
            : "Draft saved.",
      );
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tabButton = (name, text) => (
    <button
      type="button"
      onClick={() => setView(name)}
      aria-pressed={view === name}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        view === name
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "text-[var(--slate)] hover:text-[var(--ink)]"
      }`}
    >
      {text}
    </button>
  );

  const slugWillRedirect =
    post && everPublished && savedSlug && slug !== savedSlug;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(published ? "PUBLISHED" : "DRAFT");
      }}
      className="space-y-8"
    >
      {/* Status and publish controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3">
          <span
            className={`${chip} ${
              published ? "border-[var(--signal)] text-[var(--signal)]" : ""
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
          <p
            aria-live="polite"
            className={`text-sm ${
              error ? "text-[var(--danger)]" : "text-[var(--slate)]"
            }`}
          >
            {error ?? notice ?? ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {published ? (
            <>
              <button
                type="button"
                onClick={() => save("DRAFT")}
                disabled={saving}
                className={buttonSecondary}
              >
                Unpublish
              </button>
              <button type="submit" disabled={saving} className={buttonPrimary}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={saving}
                className={buttonSecondary}
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                onClick={() => save("PUBLISHED")}
                disabled={saving}
                className={buttonPrimary}
              >
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="post-title" className={fieldLabel}>
            Title
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={200}
            required
            className={`${input} font-display text-lg`}
          />
        </div>

        <div>
          <label htmlFor="post-slug" className={fieldLabel}>
            Slug (address)
          </label>
          <input
            id="post-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            onBlur={() => setSlug((s) => slugify(s))}
            maxLength={120}
            required
            spellCheck={false}
            className={`${input} font-mono`}
          />
          <p className="mt-1.5 break-all font-mono text-xs text-[var(--slate)]">
            /blog/posts/{slug || "…"}
          </p>
          {slugWillRedirect && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">
              This post has been published as “{savedSlug}”. Links to
              the old address will be redirected to the new one.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="post-tags" className={fieldLabel}>
            Topics ({tags.length}/{MAX_TAGS})
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 transition-colors focus-within:border-[var(--signal)]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] py-0.5 pl-3 pr-1.5 font-mono text-xs text-[var(--ink)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  aria-label={`Remove topic ${tag}`}
                  className="rounded-full px-1 text-[var(--slate)] hover:text-[var(--danger)]"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="post-tags"
              type="text"
              list="post-tag-suggestions"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag(tagDraft)}
              maxLength={40}
              placeholder={tags.length ? "" : "Type a topic, press Enter"}
              className="min-w-32 flex-1 bg-transparent py-0.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--slate)]"
            />
            <datalist id="post-tag-suggestions">
              {tagSuggestions
                .filter((t) => !tags.includes(t))
                .map((t) => (
                  <option key={t} value={t} />
                ))}
            </datalist>
          </div>
        </div>

        <div>
          <label htmlFor="post-category" className={fieldLabel}>
            Category
          </label>
          <select
            id="post-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={input}
          >
            <option value="">Choose a category…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="post-type" className={fieldLabel}>
            Content type
          </label>
          <select
            id="post-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className={input}
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="post-excerpt" className={fieldLabel}>
            Excerpt ({excerpt.length}/{MAX_EXCERPT_LENGTH})
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={MAX_EXCERPT_LENGTH}
            rows={2}
            placeholder="One or two sentences for post cards and search engines. Left empty, the start of the post is used."
            className={input}
          />
        </div>

        <div className="md:col-span-2">
          <p className={fieldLabel}>Featured image</p>
          <p className="mb-3 text-xs text-[var(--slate)]">
            Shown on the post card and at the top of the post, and used as the
            picture when the link is shared on social media.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            {featuredImage && (
              // eslint-disable-next-line @next/next/no-img-element -- small admin preview
              <img
                src={cloudinaryUrl(featuredImage.url, 480)}
                alt={featuredImage.alt || "Featured image preview"}
                className="aspect-video w-48 rounded-lg border border-[var(--line)] object-cover"
              />
            )}
            <div className="min-w-0 flex-1 basis-64 space-y-3">
              <div className="flex flex-wrap gap-3">
                <ImageUploader
                  postId={post?.id}
                  label={featuredImage ? "Replace image" : "Upload image"}
                  onUploaded={(image) =>
                    setFeaturedImage({
                      url: image.url,
                      publicId: image.publicId,
                      width: image.width,
                      height: image.height,
                      alt: featuredImage?.alt ?? "",
                    })
                  }
                />
                {featuredImage && (
                  <button
                    type="button"
                    onClick={() => setFeaturedImage(null)}
                    className={buttonSmall}
                  >
                    Remove image
                  </button>
                )}
              </div>
              {featuredImage && (
                <div>
                  <label htmlFor="post-cover-alt" className={fieldLabel}>
                    Image description (alt text, needed to publish)
                  </label>
                  <input
                    id="post-cover-alt"
                    type="text"
                    value={featuredImage.alt ?? ""}
                    onChange={(e) =>
                      setFeaturedImage({ ...featuredImage, alt: e.target.value })
                    }
                    maxLength={MAX_ALT_LENGTH}
                    placeholder="What the picture shows, for readers who cannot see it"
                    className={input}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={showOnMainSite}
              onChange={(e) => setShowOnMainSite(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--signal)]"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--ink)]">
                Show on main site
              </span>
              <span className="block text-xs text-[var(--slate)]">
                When on, this post can appear in “Latest writing” on
                raselrana.com.bd once it is published. It is on the blog
                either way.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Content: Markdown beside its live preview */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-[var(--line)] p-1 lg:hidden">
            {tabButton("write", "Write")}
            {tabButton("preview", "Preview")}
          </div>
          <p className={`${fieldLabel} mb-0 hidden lg:block`}>
            Content (Markdown) and live preview
          </p>
          <div className="flex flex-wrap gap-2">
            <ImageUploader
              postId={post?.id}
              label="Insert image"
              onUploaded={insertImage}
            />
            <ImageUploader
              postId={post?.id}
              label="Insert gallery"
              multiple
              onUploaded={insertGallery}
            />
            <button type="button" onClick={insertVideo} className={buttonSmall}>
              Insert video
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={view === "write" ? "" : "hidden lg:block"}>
            <label htmlFor="post-content" className="sr-only">
              Content (Markdown)
            </label>
            <textarea
              id="post-content"
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck
              placeholder={"## A heading\n\nWrite in Markdown…"}
              className={`${input} h-[70vh] min-h-96 resize-y bg-[var(--surface)] p-5 font-mono leading-relaxed`}
            />
          </div>

          <div
            className={`h-[70vh] min-h-96 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--paper)] p-6 ${
              view === "preview" ? "" : "hidden lg:block"
            }`}
          >
            {content.trim() ? (
              <div className="article">
                <Markdown>{content}</Markdown>
              </div>
            ) : (
              <p className="text-sm text-[var(--slate)]">
                The preview appears here as you write.
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--slate)]">
          Photos on lines directly under each other (no empty line between)
          show as a gallery. A YouTube link on a line of its own shows as a
          video.
        </p>
      </div>
    </form>
  );
}
