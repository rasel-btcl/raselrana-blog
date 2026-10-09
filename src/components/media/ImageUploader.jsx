"use client";

import { buttonSmall } from "@/lib/ui";
import { uploadImage } from "@/lib/upload-client";
import { ALLOWED_IMAGE_TYPES } from "@/lib/upload-rules";
import { useRef, useState } from "react";

/**
 * A button that picks an image, uploads it, and calls
 * `onUploaded({ url, publicId, width, height }, file)`.
 * With `multiple`, several images can be picked; they upload one after another and
 * `onUploaded` receives two lists instead: `(images, files)`.
 * `postId` files the images under that post in Cloudinary.
 */
export default function ImageUploader({
  onUploaded,
  label = "Upload image",
  multiple = false,
  disabled = false,
  postId = null,
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null); // e.g. "2/5" while uploading
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = ""; // allow picking the same file again
    if (files.length === 0) return;

    setError(null);
    const images = [];
    const uploaded = [];

    try {
      for (const [index, file] of files.entries()) {
        setProgress(files.length > 1 ? `${index + 1}/${files.length}` : "");
        images.push(await uploadImage(file, { postId }));
        uploaded.push(file);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setProgress(null);
    }

    // Keep whatever did upload, even if a later file failed.
    if (images.length === 0) return;
    if (multiple) onUploaded?.(images, uploaded);
    else onUploaded?.(images[0], uploaded[0]);
  };

  const uploading = progress !== null;

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple={multiple}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={buttonSmall}
      >
        {uploading ? `Uploading… ${progress}`.trim() : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
