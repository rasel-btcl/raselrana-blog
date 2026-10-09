"use client";

import { buttonSmall } from "@/lib/ui";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function DeletePostButton({ id, title, className }) {
  const router = useRouter();
  // A native <dialog> opened with showModal() sits in the browser's top layer,
  // so it is not affected by transformed or clipped parents.
  const dialogRef = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`${basePath}/api/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not delete the post");
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className={`${className ?? buttonSmall} hover:border-[var(--danger)] hover:text-[var(--danger)]`}
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-${id}`}
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 text-[var(--ink)]"
      >
        <h2 id={`delete-${id}`} className="font-display text-xl font-medium">
          Delete this post?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--slate)]">
          “{title}” will be removed for good. This cannot be undone.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={deleting}
            className={buttonSmall}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-full bg-[var(--danger)] px-4 py-2 text-sm font-medium text-[var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete post"}
          </button>
        </div>
      </dialog>
    </>
  );
}
