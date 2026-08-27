"use client";

import { useState } from "react";

export default function ImageUploader({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${basePath}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUploaded?.(data); // { url, publicId, width, height }
    } catch (err) {
      console.error(err);
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
      />
      {uploading && <p className="text-sm text-gray-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
