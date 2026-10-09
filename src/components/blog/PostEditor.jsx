"use client";

import ImageUploader from "@/components/media/ImageUploader";
import Markdown from "@/components/mdx/Markdown";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { slugify } from "@/lib/posts";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSmall,
  chip,
  fieldLabel,
  input,
} from "@/lib/ui";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const MAX_TAGS = 8;
const MAX_EXCERPT_LENGTH = 300;

/**
 * Create or edit a post. Pass `post` to edit an existing one.
 * `tagSuggestions` are topics already in use, offered so one topic is not spelled two ways.
 */
export default function PostEditor({ post = null, tagSuggestions = [] }) {
  const router = useRouter();
  const contentRef = useRef(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // The slug follows the title until it is edited by hand (or the post already exists).
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState(post?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [coverImage, setCoverImage] = useState(
    post?.coverUrl && post?.coverPublicId
      ? { url: post.coverUrl, publicId: post.coverPublicId }
      : null,
  );
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  const [view, setView] = useState("write"); // phones show one pane at a time
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

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
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
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

  const insertImage = (image, file) => {
    const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const el = contentRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;

    const before = content.slice(0, start);
    const after = content.slice(end);
    const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const tail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const line = `${lead}![${alt}](${image.url})${tail}`;

    setContent(before + line + after);

    const cursor = before.length + line.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  const save = async (publish) => {
    if (saving) return;

    // A topic typed but not yet confirmed with Enter still counts.
    const pending = tagDraft.trim();
    const allTags =
      pending && !tags.some((t) => t.toLowerCase() === pending.toLowerCase())
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
            tags: allTags,
            coverImage,
            content,
            published: publish,
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
        router.replace(`/admin/${data.post.id}/edit`);
        router.refresh();
        return;
      }

      setTags(data.post.tags);
      setTagDraft("");
      setSlug(data.post.slug);
      setPublished(data.post.published);
      setNotice(
        publish
          ? published
            ? "Changes saved and live."
            : "Published."
          : published
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(published);
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
                onClick={() => save(false)}
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
                onClick={() => save(true)}
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
          <p className={fieldLabel}>Cover image</p>
          <div className="flex flex-wrap items-center gap-4">
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element -- small admin preview
              <img
                src={cloudinaryUrl(coverImage.url, 480)}
                alt="Cover preview"
                className="aspect-video w-48 rounded-lg border border-[var(--line)] object-cover"
              />
            )}
            <ImageUploader
              label={coverImage ? "Replace cover" : "Upload cover"}
              onUploaded={(image) =>
                setCoverImage({ url: image.url, publicId: image.publicId })
              }
            />
            {coverImage && (
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className={buttonSmall}
              >
                Remove cover
              </button>
            )}
          </div>
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
          <ImageUploader label="Insert image" onUploaded={insertImage} />
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
              required
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
      </div>
    </form>
  );
}
