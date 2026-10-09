"use client";

import { buttonSmall } from "@/lib/ui";
import { uploadImage } from "@/lib/upload-client";
import { useRef, useState } from "react";

/** A button that picks an image, uploads it, and hands `{ url, publicId, width, height }` to `onUploaded`. */
export default function ImageUploader({
  onUploaded,
  label = "Upload image",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      onUploaded?.(await uploadImage(file), file);
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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
        {uploading ? "Uploading…" : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
