// Pure helpers for YouTube links. Safe to import from client code.

const ID = /^[\w-]{11}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function seconds(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  // 1h2m3s style
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0)
  );
}

/**
 * `{ id, start }` for a YouTube video link (watch, youtu.be, shorts, live, embed),
 * or `null` for anything else.
 */
export function parseYouTubeUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  let id = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (HOSTS.has(url.hostname)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (["shorts", "live", "embed"].includes(first)) id = second;
  }

  if (!id || !ID.test(id)) return null;

  return {
    id,
    start: seconds(url.searchParams.get("t") ?? url.searchParams.get("start")),
  };
}

export function youTubeThumbnail(id) {
  // hqdefault exists for every video (maxresdefault does not).
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youTubeWatchUrl({ id, start }) {
  return `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
}
