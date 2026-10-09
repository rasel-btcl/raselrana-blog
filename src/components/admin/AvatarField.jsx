"use client";

import ImageUploader from "@/components/media/ImageUploader";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { buttonSmall } from "@/lib/ui";
import { useState } from "react";

/** Profile picture: upload, preview and remove. The address travels in a hidden form field. */
export default function AvatarField({ name = "avatarUrl", initialUrl = "" }) {
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input type="hidden" name={name} value={url} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small admin preview
        <img
          src={cloudinaryUrl(url, 160)}
          alt="Profile picture"
          className="h-20 w-20 rounded-full border border-[var(--line)] object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[var(--line)] font-mono text-xs text-[var(--slate)]">
          None
        </div>
      )}
      <ImageUploader
        kind="avatar"
        label={url ? "Replace picture" : "Upload picture"}
        onUploaded={(image) => setUrl(image.url)}
      />
      {url && (
        <button type="button" onClick={() => setUrl("")} className={buttonSmall}>
          Remove
        </button>
      )}
    </div>
  );
}
