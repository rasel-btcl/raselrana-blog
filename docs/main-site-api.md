# Latest posts API — for the main site

**For:** the main site project (`raselrana-web`, raselrana.com.bd).
**From:** the blog project (`raselrana-blog`, served at raselrana.com.bd/blog).

The blog offers one public, read-only endpoint so the main site can show its newest posts (for example a "Latest writing" section on the home page). It replaces section 8 of `docs/design-brief.md`; everything that section promised still holds, and a few fields were added.

## Request

```
GET https://raselrana.com.bd/blog/api/posts?limit=3
```

- No login, no key, no cookies. Call it from the server (a Server Component or route handler).
- `limit`: whole number from 1 to 12. Default 6. Anything else is treated as 6.

## Which posts are returned

A post is included only when **all** of these are true:

1. It is live: published, or scheduled and its time has passed.
2. Its **"Show on main site"** option is on. The author sets this per post in the blog editor; it is on by default. Turning it off keeps the post on the blog but out of this API.
3. It is not marked `noindex`.

Newest first, by first-publish time. Drafts and archived posts never appear.

## Response — `200`, JSON

```json
{
  "posts": [
    {
      "title": "Why backup power decides telecom uptime",
      "slug": "why-backup-power-decides-telecom-uptime",
      "url": "/blog/why-backup-power-decides-telecom-uptime",
      "excerpt": "One or two sentences that summarise the post.",
      "coverUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1/raselrana-blog/abc.jpg",
      "coverAlt": "Battery bank in a telecom shelter",
      "tags": ["ONT", "dBm"],
      "category": { "name": "GPON & Fiber Optics", "slug": "gpon-fiber-optics" },
      "contentType": { "label": "Troubleshooting", "slug": "troubleshooting" },
      "publishedAt": "2026-10-08T09:30:00.000Z",
      "readingMinutes": 6
    }
  ]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `title` | text | Always present. |
| `slug` | text | Lower-case letters, numbers and single hyphens. |
| `url` | text | **Use this for the link.** Root-relative address of the post on raselrana.com.bd, currently `/blog/<slug>`. The older `/blog/posts/<slug>` form still works: it redirects here. |
| `excerpt` | text | The author's summary, or about 160 characters from the first paragraph. May be empty. |
| `coverUrl` | text or `null` | The post's featured image: a `https://res.cloudinary.com/…/image/upload/…` address. To get a smaller copy, insert `f_auto,q_auto,c_limit,w_<width>/` right after `/image/upload/`. |
| `coverAlt` | text | Description of the image for the `alt` attribute. May be empty. |
| `tags` | list of text | Topic names. May be empty. |
| `category` | object or `null` | `{ name, slug }`. |
| `contentType` | object or `null` | `{ label, slug }`: Explainer, How-to, Troubleshooting or Comparison. |
| `publishedAt` | ISO date-time | When the post was first published. |
| `readingMinutes` | whole number | At least 1. |

New in this version: `url`, `coverAlt`, `category`, `contentType`. The response never contains the post content, database ids, or anything about the author's account. More fields may be added later; ignore the ones you do not use.

## Caching and errors

- The response carries `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`, so a new post can take about 5 minutes to appear here, plus whatever the main site caches on its side.
- On an internal error the status is `5xx` with `{ "error": "…" }`. Treat any non-`200` answer, a network failure, or a body without a `posts` list as "nothing to show" and hide the section.
- An empty blog answers `200` with `{ "posts": [] }`.

## Example (Next.js, main site)

```js
async function getLatestPosts() {
  try {
    const res = await fetch("https://raselrana.com.bd/blog/api/posts?limit=3", {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch {
    return [];
  }
}
```

Link each post with a plain `<a href={post.url}>`, not `next/link`: the blog is a different app behind a rewrite.

While the main site is not live on raselrana.com.bd, point the request at the blog's own deployment instead (its Vercel address followed by `/blog/api/posts`).
