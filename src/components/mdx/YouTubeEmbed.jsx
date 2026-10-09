"use client";

import { youTubeThumbnail, youTubeWatchUrl } from "@/lib/youtube";
import { useState } from "react";

/**
 * A YouTube video shown as its thumbnail with a play button. Nothing is loaded from
 * YouTube's player until the reader clicks; then it plays in place in privacy mode.
 * Without JavaScript it is a plain link to the video.
 */
export default function YouTubeEmbed({ id, start = 0 }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0" });
    if (start) params.set("start", String(start));

    return (
      <div className="video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className="video">
      <a
        href={youTubeWatchUrl({ id, start })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Play video"
        onClick={(event) => {
          // Let Ctrl/Cmd/middle click open YouTube in a new tab as usual.
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          setPlaying(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail served by YouTube */}
        <img
          src={youTubeThumbnail(id)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="video-play" aria-hidden>
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
            <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5z" />
          </svg>
        </span>
      </a>
    </div>
  );
}
