"use client";

import ImageUploader from "@/components/media/ImageUploader";
import { useState } from "react";

export default function PostEditor() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(null); // { url, publicId }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return; // prevent double-submit
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${basePath}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          coverImage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to create post:", errData);
        setError(errData.error || "Failed to create post");
        return;
      }

      // reset form after success
      setTitle("");
      setSlug("");
      setContent("");
      setCoverImage(null);
      setSuccess(true);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        type="text"
        placeholder="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />

      <ImageUploader onUploaded={(data) => setCoverImage(data)} />

      {coverImage?.url && (
        <img
          src={coverImage.url}
          alt="Cover preview"
          className="rounded-md max-h-64"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-700">Post saved as a draft.</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Publishing..." : "Publish Post"}
      </button>
    </form>
  );
}
