"use client";

import { buildChecklist } from "@/components/admin/editor/checklist";
import MarkdownEditor from "@/components/admin/editor/MarkdownEditor";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUploader from "@/components/media/ImageUploader";
import Markdown from "@/components/mdx/Markdown";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { CONTENT_TYPES, DEFAULT_CONTENT_TYPE } from "@/lib/content-types";
import { slugify } from "@/lib/posts";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSmall,
  fieldLabel,
  input,
} from "@/lib/ui";
import { parseYouTubeUrl } from "@/lib/youtube";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const MAX_TAGS = 8;
const MAX_EXCERPT_LENGTH = 300;
const MAX_ALT_LENGTH = 200;
const MAX_SEO_TITLE = 60;
const MAX_SEO_DESCRIPTION = 160;
const MAX_RELATED = 4;
const AUTOSAVE_DELAY = 3000;

const toolButton =
  "rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]";

const altFromFile = (file) =>
  file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

// The publish date is shown and typed in Dhaka time (UTC+6, no daylight saving)
// and stored in UTC.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const toDhakaInput = (iso) =>
  iso
    ? new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 16)
    : "";
const fromDhakaInput = (value) => (value ? new Date(`${value}:00+06:00`) : null);

const clock = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dhaka",
  }).format(new Date());

const CALLOUT_TEXT = {
  NOTE: "Something worth knowing.",
  TIP: "A shortcut or good practice.",
  WARNING: "Something that can go wrong.",
};

function Counter({ value, max }) {
  return (
    <span className={value.length > max ? "text-[var(--danger)]" : ""}>
      {value.length}/{max}
    </span>
  );
}

/**
 * Create or edit a post (docs/BLOG_ADMIN_SPEC.md §7.4). Pass `post` to edit one.
 * `categories` fills the category select, `tagSuggestions` are topics already in
 * use, `postOptions` (`[{ id, title }]`) are the posts that can be picked as related.
 */
export default function PostEditor({
  post = null,
  categories = [],
  tagSuggestions = [],
  postOptions = [],
}) {
  const editorRef = useRef(null);
  const checklistRef = useRef(null);

  // A new post gets its id on the first save; the page is not reloaded for that.
  const [postId, setPostId] = useState(post?.id ?? null);
  const [status, setStatus] = useState(post?.status ?? "DRAFT");
  const [everPublic, setEverPublic] = useState(Boolean(post?.everPublic));
  const [savedSlug, setSavedSlug] = useState(post?.slug ?? "");

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
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? null);
  const [content, setContent] = useState(post?.content ?? "");
  const [scheduleAt, setScheduleAt] = useState(
    post?.status === "SCHEDULED" ? toDhakaInput(post.publishedAt) : "",
  );
  const [significantUpdate, setSignificantUpdate] = useState(false);
  const [relatedPostIds, setRelatedPostIds] = useState(post?.relatedPostIds ?? []);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(post?.ogImageUrl ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [noindex, setNoindex] = useState(post?.noindex ?? false);
  const [showOnMainSite, setShowOnMainSite] = useState(post?.showOnMainSite ?? true);

  const [view, setView] = useState("write"); // phones: write | preview | settings
  const [settingsOpen, setSettingsOpen] = useState(true); // wide screens
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState(""); // "Saved at 18:42" etc.
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState(null); // { errors, warnings, target }

  // Everything that is stored, except the status (that is chosen by the button).
  const fields = useMemo(
    () => ({
      title,
      slug,
      excerpt,
      categoryId: categoryId || null,
      contentType,
      tags,
      featuredImage,
      content,
      relatedPostIds,
      seoTitle,
      seoDescription,
      ogImageUrl,
      canonicalUrl,
      noindex,
      showOnMainSite,
    }),
    [
      title, slug, excerpt, categoryId, contentType, tags, featuredImage, content,
      relatedPostIds, seoTitle, seoDescription, ogImageUrl, canonicalUrl, noindex,
      showOnMainSite,
    ],
  );
  const fieldsJson = useMemo(() => JSON.stringify(fields), [fields]);
  const [savedJson, setSavedJson] = useState(post ? fieldsJson : null);
  const dirty = fieldsJson !== savedJson && (postId !== null || title.trim() !== "");

  const isDraft = status === "DRAFT";
  const isPublished = status === "PUBLISHED";

  // ---- Saving ----

  const save = async (targetStatus, { auto = false } = {}) => {
    if (saving) return false;

    // A topic typed but not yet confirmed with Enter still counts on a manual save.
    const pending = auto ? "" : tagDraft.trim();
    const allTags =
      pending && !tags.some((t) => slugify(t) === slugify(pending))
        ? [...tags, pending]
        : tags;
    const sent = { ...fields, tags: allTags };
    const sentJson = JSON.stringify(sent);

    setSaving(true);
    setSaveState("Saving…");
    if (!auto) setError(null);

    try {
      const res = await fetch(
        postId ? `${basePath}/api/posts/${postId}` : `${basePath}/api/posts`,
        {
          method: postId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sent,
            status: targetStatus,
            publishedAt:
              targetStatus === "SCHEDULED"
                ? (fromDhakaInput(scheduleAt)?.toISOString() ?? null)
                : null,
            significantUpdate: targetStatus === "PUBLISHED" && significantUpdate,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveState("Save failed");
        if (!auto) setError(data.error || "Could not save the post");
        return false;
      }

      const saved = data.post;
      if (!postId) {
        setPostId(saved.id);
        // Show the edit address without reloading, so typing is not interrupted.
        window.history.replaceState(
          null,
          "",
          `${basePath}/admin/posts/${saved.id}/edit`,
        );
      }
      setStatus(saved.status);
      setSavedSlug(saved.slug);
      setSavedJson(sentJson);
      if (saved.status === "PUBLISHED") setEverPublic(true);

      if (!auto) {
        // Take over what the server normalised (topic spellings, slug, excerpt).
        setTags(saved.tags.map((tag) => tag.name));
        setTagDraft("");
        setSlug(saved.slug);
        setSignificantUpdate(false);
        const synced = {
          ...sent,
          tags: saved.tags.map((tag) => tag.name),
          slug: saved.slug,
        };
        setSavedJson(JSON.stringify(synced));
      }
      setSaveState(`Saved at ${clock()}`);
      return true;
    } catch (err) {
      console.error("Save error:", err);
      setSaveState("Save failed");
      if (!auto) setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Autosave: drafts only, 3 seconds after the last change. It never publishes.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  const canAutosave =
    isDraft && dirty && !saving && title.trim() !== "" && slug.trim() !== "";
  useEffect(() => {
    if (!canAutosave) return;
    const timer = setTimeout(
      () => saveRef.current("DRAFT", { auto: true }),
      AUTOSAVE_DELAY,
    );
    return () => clearTimeout(timer);
  }, [canAutosave, fieldsJson]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ---- Going public: run the checklist first ----

  const goPublic = async (target) => {
    setError(null);
    const now = new Date();
    const result = buildChecklist({
      ...fields,
      categoryId,
      target,
      scheduleDate: fromDhakaInput(scheduleAt),
      now,
    });

    // The slug has to be free; only the server knows.
    if (slug.trim()) {
      try {
        const query = new URLSearchParams({ slug: slugify(slug) });
        if (postId) query.set("except", postId);
        const res = await fetch(`${basePath}/api/posts/slug-check?${query}`);
        const check = await res.json();
        if (res.ok && !check.available) {
          result.errors.push(`Slug: ${check.reason}.`);
        }
      } catch {
        // The save itself checks again.
      }
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      await save(target);
      return;
    }
    setChecklist({ ...result, target });
    checklistRef.current?.showModal();
  };

  const closeChecklist = () => checklistRef.current?.close();

  const continueAnyway = async () => {
    const target = checklist?.target;
    closeChecklist();
    if (target) await save(target);
  };

  const publicTarget = isPublished ? "PUBLISHED" : scheduleAt ? "SCHEDULED" : "PUBLISHED";
  const publicLabel = isPublished
    ? "Update"
    : status === "SCHEDULED"
      ? scheduleAt
        ? "Update schedule"
        : "Publish now"
      : scheduleAt
        ? "Schedule"
        : "Publish";

  // ---- Field helpers ----

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
    const known = tagSuggestions.find((t) => t.toLowerCase() === tag.toLowerCase());
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

  // ---- Toolbar ----

  const insertBlock = (block) => editorRef.current?.insertBlock(block);

  const insertLink = () => {
    const url = window.prompt("Link address", "https://");
    if (!url) return;
    editorRef.current?.wrap("[", "link text", `](${url.trim()})`);
  };

  const insertCode = () => {
    const language = window.prompt(
      "Language for highlighting (for example bash, js, python). Leave empty for none.",
      "",
    );
    if (language === null) return;
    insertBlock(`\`\`\`${language.trim().toLowerCase()}\n\n\`\`\``);
  };

  const insertTable = () =>
    insertBlock(
      "| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |",
    );

  const insertCallout = (kind) =>
    insertBlock(`> [!${kind}]\n> ${CALLOUT_TEXT[kind]}`);

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
  const insertGallery = (images, files) =>
    insertBlock(
      images.map((image, i) => `![${altFromFile(files[i])}](${image.url})`).join("\n"),
    );

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

  const slugWillRedirect = everPublic && savedSlug && slugify(slug) !== savedSlug;
  const relatedChoices = postOptions.filter(
    (option) => option.id !== postId && !relatedPostIds.includes(option.id),
  );
  const titleOf = (id) =>
    postOptions.find((option) => option.id === id)?.title ?? "Unknown post";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Enter in a field saves without changing the status.
        if (isPublished || status === "SCHEDULED") goPublic(status);
        else save(status);
      }}
      className="space-y-6"
    >
      {/* Status and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 lg:sticky lg:top-0 lg:z-30">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <p
            aria-live="polite"
            className={`text-sm ${error ? "text-[var(--danger)]" : "text-[var(--slate)]"}`}
          >
            {error ??
              (dirty && !saving
                ? isDraft
                  ? "Unsaved changes…"
                  : "Unsaved changes. Use the button to save them."
                : saveState)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {postId && (
            <Link
              href={`/preview/${postId}`}
              target="_blank"
              title="Opens the last saved version in a new tab"
              className={buttonSmall}
            >
              Preview
            </Link>
          )}
          {isDraft && (
            <button
              type="button"
              onClick={() => save("DRAFT")}
              disabled={saving}
              className={buttonSmall}
            >
              Save draft
            </button>
          )}
          {(isPublished || status === "SCHEDULED") && (
            <button
              type="button"
              onClick={() => save("DRAFT")}
              disabled={saving}
              className={buttonSmall}
            >
              {isPublished ? "Unpublish" : "Back to draft"}
            </button>
          )}
          {status === "ARCHIVED" ? (
            <>
              <button
                type="button"
                onClick={() => save("ARCHIVED")}
                disabled={saving}
                className={buttonSmall}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => save("DRAFT")}
                disabled={saving}
                className={buttonSmall}
              >
                Unarchive
              </button>
            </>
          ) : (
            postId && (
              <button
                type="button"
                onClick={() => save("ARCHIVED")}
                disabled={saving}
                className={buttonSmall}
              >
                Archive
              </button>
            )
          )}
          {status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => goPublic(publicTarget)}
              disabled={saving}
              className={`${buttonPrimary} px-5 py-2`}
            >
              {saving ? "Saving…" : publicLabel}
            </button>
          )}
        </div>
      </div>

      {/* Phones show one pane at a time; wide screens show the editor beside the preview. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[var(--line)] p-1 lg:hidden">
          {tabButton("write", "Write")}
          {tabButton("preview", "Preview")}
          {tabButton("settings", "Settings")}
        </div>
        <div className="hidden lg:block">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-expanded={settingsOpen}
            className={buttonSmall}
          >
            {settingsOpen ? "Hide settings" : "Show settings"}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div
        className={`${view === "settings" ? "grid" : "hidden"} ${
          settingsOpen ? "lg:grid" : "lg:hidden"
        } gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-2`}
      >
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
              This post has been published as “{savedSlug}”. Links to the old
              address will be redirected to the new one.
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
            Excerpt (<Counter value={excerpt} max={MAX_EXCERPT_LENGTH} />)
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={MAX_EXCERPT_LENGTH}
            rows={2}
            placeholder="One or two sentences for post cards and search engines. Left empty, the first paragraph is used."
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
                  postId={postId}
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

        <div>
          <label htmlFor="post-schedule" className={fieldLabel}>
            Publish date (Dhaka time)
          </label>
          <input
            id="post-schedule"
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            disabled={isPublished}
            className={input}
          />
          <p className="mt-1.5 text-xs text-[var(--slate)]">
            {isPublished
              ? "This post is already published."
              : "Leave empty to publish at once. With a future date, the post is scheduled and goes live by itself."}
          </p>
        </div>

        <div>
          <p className={fieldLabel}>
            Related posts ({relatedPostIds.length}/{MAX_RELATED})
          </p>
          <ul className="space-y-1.5">
            {relatedPostIds.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm"
              >
                <span className="min-w-0 truncate">{titleOf(id)}</span>
                <button
                  type="button"
                  onClick={() =>
                    setRelatedPostIds(relatedPostIds.filter((x) => x !== id))
                  }
                  aria-label={`Remove related post ${titleOf(id)}`}
                  className="px-1 text-[var(--slate)] hover:text-[var(--danger)]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {relatedPostIds.length < MAX_RELATED && relatedChoices.length > 0 && (
            <select
              aria-label="Add a related post"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setRelatedPostIds([...relatedPostIds, e.target.value]);
                }
              }}
              className={`${input} mt-2`}
            >
              <option value="">Add a related post…</option>
              {relatedChoices.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1.5 text-xs text-[var(--slate)]">
            Optional. Shown first under the post; the rest is filled in
            automatically.
          </p>
        </div>

        <div>
          <label htmlFor="post-seo-title" className={fieldLabel}>
            SEO title (<Counter value={seoTitle} max={MAX_SEO_TITLE} />)
          </label>
          <input
            id="post-seo-title"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={MAX_SEO_TITLE}
            placeholder={title || "Defaults to the title"}
            className={input}
          />
        </div>

        <div>
          <label htmlFor="post-seo-description" className={fieldLabel}>
            SEO description (
            <Counter value={seoDescription} max={MAX_SEO_DESCRIPTION} />)
          </label>
          <textarea
            id="post-seo-description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={MAX_SEO_DESCRIPTION}
            rows={2}
            placeholder={excerpt || "Defaults to the excerpt"}
            className={input}
          />
        </div>

        <div>
          <label htmlFor="post-og-image" className={fieldLabel}>
            Social image address (optional)
          </label>
          <input
            id="post-og-image"
            type="url"
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
            placeholder="Defaults to the featured image"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="post-canonical" className={fieldLabel}>
            Canonical address (optional)
          </label>
          <input
            id="post-canonical"
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="Defaults to this post's own address"
            className={input}
          />
        </div>

        <div className="space-y-4 md:col-span-2">
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

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noindex}
              onChange={(e) => setNoindex(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--signal)]"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--ink)]">
                Hide from search engines and listings (noindex)
              </span>
              <span className="block text-xs text-[var(--slate)]">
                The post can still be opened by its address, but is left out
                of the blog lists, search, the sitemap and the main site.
              </span>
            </span>
          </label>

          {isPublished && (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={significantUpdate}
                onChange={(e) => setSignificantUpdate(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--signal)]"
              />
              <span>
                <span className="block text-sm font-medium text-[var(--ink)]">
                  Significant update
                </span>
                <span className="block text-xs text-[var(--slate)]">
                  Tick when the content really changed. “Update” then shows
                  readers a new “Last updated” date. Leave off for typo fixes.
                </span>
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Content: Markdown beside its live preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={view === "write" ? "" : "hidden lg:block"}>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <button type="button" className={toolButton} onClick={() => editorRef.current?.heading(2)}>
              H2
            </button>
            <button type="button" className={toolButton} onClick={() => editorRef.current?.heading(3)}>
              H3
            </button>
            <button type="button" className={`${toolButton} font-bold`} title="Bold (Ctrl+B)" onClick={() => editorRef.current?.wrap("**", "bold text")}>
              B
            </button>
            <button type="button" className={`${toolButton} italic`} title="Italic (Ctrl+I)" onClick={() => editorRef.current?.wrap("_", "italic text")}>
              I
            </button>
            <button type="button" className={toolButton} onClick={insertLink}>
              Link
            </button>
            <button type="button" className={toolButton} onClick={insertCode}>
              Code
            </button>
            <button type="button" className={toolButton} onClick={insertTable}>
              Table
            </button>
            <select
              aria-label="Insert a callout"
              value=""
              onChange={(e) => e.target.value && insertCallout(e.target.value)}
              className={`${toolButton} cursor-pointer`}
            >
              <option value="">Callout…</option>
              <option value="NOTE">Note</option>
              <option value="TIP">Tip</option>
              <option value="WARNING">Warning</option>
            </select>
            <ImageUploader
              postId={postId}
              label="Image"
              className={toolButton}
              onUploaded={insertImage}
            />
            <ImageUploader
              postId={postId}
              label="Gallery"
              className={toolButton}
              multiple
              onUploaded={insertGallery}
            />
            <button type="button" className={toolButton} onClick={insertVideo}>
              Video
            </button>
          </div>
          <MarkdownEditor
            ref={editorRef}
            value={content}
            onChange={setContent}
            onSave={() =>
              isPublished || status === "SCHEDULED" ? goPublic(status) : save(status)
            }
          />
          <p className="mt-2 text-xs text-[var(--slate)]">
            Ctrl+S saves. Photos on lines directly under each other show as a
            gallery; a YouTube link on a line of its own shows as a video.
          </p>
        </div>

        <div
          className={`h-[calc(70vh+2.5rem)] min-h-96 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--paper)] p-6 ${
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

      {/* Pre-publish checklist */}
      <dialog
        ref={checklistRef}
        aria-labelledby="checklist-title"
        onClose={() => setChecklist(null)}
        className="m-auto w-[min(92vw,34rem)] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 text-[var(--ink)]"
      >
        <h2 id="checklist-title" className="font-display text-xl font-medium">
          Before this goes public
        </h2>
        {checklist?.errors.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--danger)]">
              Must be fixed
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {checklist.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {checklist?.warnings.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--slate)]">
              Worth a look
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--slate)]">
              {checklist.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={closeChecklist} className={buttonSecondary}>
            Go back and fix
          </button>
          {checklist?.errors.length === 0 && (
            <button type="button" onClick={continueAnyway} className={buttonPrimary}>
              Continue anyway
            </button>
          )}
        </div>
      </dialog>
    </form>
  );
}
