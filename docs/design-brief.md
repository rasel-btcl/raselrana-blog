# Blog front end — design brief

**For:** whoever builds the public side of the blog project (`raselrana-blog`).
**From:** the main site project (`raselrana-web`, live at raselrana.com.bd).
**Put this file in the blog project** (for example as `docs/design-brief.md`) and build from it.

## 1. The goal

A visitor reads raselrana.com.bd, clicks **Blog**, and lands on `/blog`. It must feel like walking into another room of the same house: same logo, colours, fonts and light/dark mode, with no jolt. The blog is a different app (a separate zone, served at `/blog` through a rewrite), so this continuity has to be built on purpose. Sections 3 and 4 give the exact values to copy.

Today the blog's public side is a "coming soon" page and stubs. Its login, post storage (Prisma + MongoDB), image upload and a basic "new post" form exist. Everything in this brief is still to be built.

## 2. Decisions already made by the owner

| Question | Decision |
| --- | --- |
| Look | **Same family, own layout.** Same logo, colours, fonts and theme as the main site, but the blog has its own simpler menu and one clear way back to the main site. It should read as a sister publication, not a copy of the main site's menu. |
| Writing | **Markdown with a live preview** in the admin editor. |
| Reader features | Reading time, table of contents that follows scrolling, reading progress bar; topics (tags) with a page per topic, and search; related posts, previous/next links and share buttons. |
| Not wanted now | RSS feed, comments, newsletter, visual (Word-style) editor. |
| Main site home page | Shows the three newest posts, fetched from the blog through the API in section 8. **The main site side is already built and waiting for that API.** |

## 3. Design tokens — copy exactly

The main site uses Tailwind CSS v4 with CSS variables. Use the same variables with the same names and values, so both sites can never drift apart by accident.

### Colours, fonts and base rules (`src/app/globals.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme static {
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}

:root {
  --ink: #0f2438;     /* primary text, solid buttons, logo badge */
  --slate: #5b6b7a;   /* secondary text, small labels */
  --paper: #f5f6f4;   /* page background */
  --surface: #ffffff; /* cards and panels */
  --signal: #0e7c86;  /* accent: links, active states */
  --pulse: #3fa796;   /* second accent, rare */
  --line: #d8dde1;    /* hairline borders */
  --danger: #b42318;  /* errors */
}

.dark {
  --ink: #eef1f0;
  --slate: #93a1ab;
  --paper: #0b1420;
  --surface: #111d2c;
  --signal: #2dd4c7;
  --pulse: #52c9a6;
  --line: #223244;
  --danger: #f97066;
}

html { scroll-behavior: smooth; }

body {
  background-color: var(--paper);
  color: var(--ink);
  transition: background-color 0.25s ease, color 0.25s ease;
}

h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }

:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 3px;
  border-radius: 2px;
}

::selection { background: var(--signal); color: var(--paper); }

/* Entrance motion: CSS only, so content never waits for JavaScript. */
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .rise {
    animation: rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: var(--delay, 0ms);
  }
  @supports (animation-timeline: view()) {
    .reveal {
      animation: rise linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 22%;
    }
  }
  /* Smooth fade when moving between the main site and the blog.
     The main site has the same rule; both pages must opt in. */
  @view-transition { navigation: auto; }
}
```

Use the variables as Tailwind arbitrary values: `text-[var(--ink)]`, `border-[var(--line)]`, `bg-[var(--surface)]`. **Do not** use Tailwind palette colours (`slate-950`, `gray-500`, `bg-white`) or `dark:` variants in public pages; the current placeholder pages do, and they must be replaced.

### Fonts (`src/app/fonts.js`, applied on `<html>`)

```js
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-space-grotesk" });
export const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });
```

```jsx
<html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}>
  <body className="bg-[var(--paper)] font-body text-[var(--ink)]">
```

| Utility | Font | Use |
| --- | --- | --- |
| `font-display` | Space Grotesk | Headings, post titles |
| `font-body` (default) | IBM Plex Sans | Paragraphs, article text |
| `font-mono` | IBM Plex Mono | Small labels, dates, tags, code |

### Logo (`BrandMark`) — copy as is

```jsx
export default function BrandMark({ className = "", size = 30 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label="Rasel Rana">
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <g fill="none" stroke="var(--paper)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 24V8h6.25a4.5 4.5 0 0 1 0 9H11" />
        <path d="M16 17l3.9 5" />
      </g>
      <circle cx="21.6" cy="24" r="2.3" fill="var(--paper)" />
    </svg>
  );
}
```

For the browser tab icon, use the same shape with fixed colours: badge `#0f2438`, letter and dot `#f5f6f4`.

### Light and dark mode — must carry over

The main site uses `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and the default storage key (`theme`). Use **the same library and the same settings**. Because the blog is served from the same address (raselrana.com.bd), the browser shares that saved choice: a visitor who picked dark mode on the main site arrives on the blog in dark mode. A different storage key or a custom toggle would break this.

## 4. Layout rules and ready-made styles

- **One container everywhere:** `mx-auto max-w-6xl px-6`. The menu, content and footer share it, so every left edge lines up, and it matches the main site.
- **Section rhythm:** `py-16 md:py-20` or `py-20 md:py-24`; each section after the first starts with `border-t border-[var(--line)]`.
- **Sticky top bar:** `sticky top-0 z-50 h-16 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-sm` — the same height and look as the main site's, so the bar does not jump when moving between the two.
- **Mobile first.** Check phone width (around 400px), light and dark.

```jsx
{/* Small label above a heading */}
<p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--signal)]">Label</p>

{/* Page header label with a short accent line (top of a page) */}
<p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
  <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />Blog
</p>

{/* Page heading */}
<h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--ink)] md:text-6xl">…</h1>

{/* Section heading */}
<h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">…</h2>

{/* Card */}
<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 transition-colors hover:border-[var(--signal)]">…</div>

{/* Card heading / body text */}
<h3 className="font-display text-xl font-medium text-[var(--ink)]">…</h3>
<p className="text-sm leading-relaxed text-[var(--slate)]">…</p>

{/* Tag / chip */}
<span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--slate)]">telecom</span>

{/* Main button and second button (pills) */}
className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]"

{/* Form input */}
className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--slate)] outline-none transition-colors focus:border-[var(--signal)]"
```

Three rules learned the hard way on the main site:

1. **Never hide content until JavaScript runs.** No animation library with an "invisible at start" state for entrances; use the `rise` and `reveal` classes above. Pages must be readable in the HTML the server sends.
2. **Dialogs and overlays go into `document.body` with `createPortal`.** An element with `rise`/`reveal` is transformed, and a `position: fixed` child of a transformed element is positioned against that element, not the screen.
3. **Show Cloudinary images through Cloudinary's own resizing:** insert `f_auto,q_auto,c_limit,w_<width>` after `/image/upload/` in the address (a `next/image` custom loader does this neatly), so phones do not download full-size photos.

## 5. Structure of the blog

### Top bar (the blog's own menu)

Left: the logo and "Rasel Rana" linking to the **main site home** (`/`), then a thin divider and the word **Blog** linking to the blog home. Right: **Posts**, **Topics**, **About the author**, the theme toggle. On phones these collapse into a menu button.

One clearly visible way back is required: the logo/name is it. Do not copy the main site's full menu.

### Footer (slim)

Logo, name and one line of description; a "Blog" column (Posts, Topics); a "Rasel Rana" column linking to the main site (Home, About, Experience, Achievements, Contact); copyright line. Card-coloured background (`bg-[var(--surface)]`) with a top hairline, like the main site's footer.

### Links between the two sites

- Links **inside** the blog: `next/link`, written without `/blog` (the base path is added automatically).
- Links **to the main site**: plain `<a href="/about">`, never `next/link`. They are root-relative on purpose, so they stay on raselrana.com.bd. (`next/link` would add `/blog` in front.)

### Pages

| Address (under `/blog`) | What it shows |
| --- | --- |
| `/` | Blog home: page header, search box, topic chips, the newest post as a large feature card with its cover, the rest as a card grid, pagination |
| `/posts/[slug]` | One post (section 6) |
| `/tags` | All topics with the number of posts in each |
| `/tags/[tag]` | Posts for one topic |
| `/about` | Short "about the author" with links to the main site's About and Contact pages |
| not found | Styled like the rest, with links to the blog home and the main site |

Only **published** posts appear anywhere public. The site-wide `robots: noindex` in the root layout must be removed when the blog goes live; keep `noindex` on `/admin` and `/login`.

### Post card (used on home, topic pages, related posts)

Cover image (16:9, rounded, optional), topic chips, title, excerpt (two or three lines), then a mono line: `8 Oct 2026 · 6 min read`. The whole card is one link.

## 6. The post page (the most important page)

- **Header:** topic chips, title (`font-display`, large), a mono line with the date, "Updated …" if edited later, and the reading time.
- **Cover image** under the header, full content width, rounded.
- **Two columns on large screens:** the article (comfortable reading width, about 68–72 characters per line) and a sticky **table of contents** on the side. On small screens the table of contents folds into a "On this page" block above the article.
- **Reading progress bar:** a thin `--signal` line at the very top of the window that fills as the reader scrolls the article.
- **Table of contents:** built from the post's `##` and `###` headings; the heading currently on screen is highlighted; clicking scrolls to it. Hide it when a post has fewer than three headings.
- **Reading time:** words ÷ 200, rounded up, minimum 1.
- **Share row** at the end: Copy link (with a "Copied" confirmation), LinkedIn, Facebook. Use the public address, `https://raselrana.com.bd/blog/posts/<slug>`.
- **Previous / next** post links (older and newer).
- **Related posts:** up to three that share a topic; if none, the newest others.
- **Author card** at the bottom: logo, name, role, one or two lines, and two links to the main site: "More about me" (`/about`) and "Get in touch" (`/contact`). This is the natural route back to the main site.
- **Search-engine details:** title and description (the excerpt), Open Graph article data with the cover image.

### Article text styles

Markdown output needs its own styles (Tailwind's reset removes the defaults). Style, with the tokens: headings (h2/h3/h4 in `font-display`, with `scroll-margin-top` so the sticky bar does not cover them), paragraphs (`leading-relaxed`, body size around 17–18px), links (`--signal`, underlined), lists, blockquotes (left border in `--signal`), horizontal rules (`--line`), images (rounded, full width, lazy), tables (hairline borders, scroll sideways on phones), inline code (mono, slight `--line` background) and code blocks (mono, `--surface` background, hairline border, rounded, scroll sideways) with syntax colours that work in both themes.

### Markdown

Render with GitHub-flavoured Markdown (tables, task lists, strikethrough), heading ids (for the table of contents), and syntax highlighting. **Do not allow raw HTML in posts.** Links to other sites open in a new tab with `rel="noopener noreferrer"`.

## 7. Admin side needed for this to work

The current editor can only save a draft with a title, slug and content. To run the blog it needs:

- **Fields:** title; slug (filled in from the title until edited by hand); excerpt (short summary, used on cards and for search engines); topics (tags); cover image (existing uploader); content (Markdown).
- **Live preview:** the Markdown on one side and the rendered result on the other, using the same renderer and styles as the public post page, so what the owner sees is what readers get. On phones, switch between "Write" and "Preview".
- **Insert image:** upload through the existing uploader and insert the Markdown image line at the cursor.
- **Publish controls:** Save draft, Publish, Unpublish. Record the first publish time (add `publishedAt DateTime?` to the `Post` model; show and sort by it, falling back to `createdAt`).
- **Manage posts:** a list of all posts (drafts and published) with Edit and Delete (with a confirmation). The edit page is a stub today.
- **Topics:** store them as typed (trimmed, no duplicates, at most 8 per post). Offer existing topics as suggestions so the same topic is not spelled two ways.
- Restyle the admin and login pages with the same tokens. They do not need the public menu and footer.
- After any change, refresh the public pages so edits show at once.

Keep the blog project's own rules (its `CLAUDE.md`): base path handling, `requireAdmin()` at the start of every changing API handler, Prisma 6, Auth.js v5.

## 8. The API the main site depends on

The main site's home page shows a "Latest writing" section with the three newest posts. It is already built. It asks the blog for them, server to server, and **hides the section if the answer is missing or wrong**, so nothing breaks before this exists.

### Request

```
GET /blog/api/posts?limit=3
```

In the blog project this is a public `GET` handler in `src/app/api/posts/route.js` (the same file as the existing admin-only `POST`). No login. `limit`: whole number from 1 to 12, default 6.

### Response — `200`, JSON

```json
{
  "posts": [
    {
      "title": "Why backup power decides telecom uptime",
      "slug": "why-backup-power-decides-telecom-uptime",
      "excerpt": "One or two sentences that summarise the post.",
      "coverUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1/raselrana-blog/abc.jpg",
      "tags": ["Telecom", "Power systems"],
      "publishedAt": "2026-10-08T09:30:00.000Z",
      "readingMinutes": 6
    }
  ]
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `title` | text | Required |
| `slug` | text | Required. Lower-case letters, numbers and single hyphens. The main site links to `/blog/posts/<slug>` |
| `excerpt` | text | May be empty. If the post has none, send the first ~160 characters of the content with Markdown marks removed |
| `coverUrl` | text or `null` | A `https://res.cloudinary.com/…/image/upload/…` address, or `null`. Anything else is ignored by the main site |
| `tags` | list of text | May be empty. The main site shows the first three |
| `publishedAt` | ISO date-time | When the post was first published (fall back to its creation time) |
| `readingMinutes` | whole number | Optional. Shown as "6 min read" when present |

### Rules

- **Published posts only**, newest first. Never drafts.
- **Never include the post content**, ids or anything about the author account.
- Send `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
- On an internal error answer with a `5xx` status; the main site then simply hides its section.
- The main site keeps its own copy for up to 10 minutes, so a new post appears on the main home page within about 10 minutes of publishing.

## 9. Out of scope

RSS feed, comments, newsletter sign-up, a visual editor, several authors, and scheduled publishing.

## 10. Checklist before calling it done

- [ ] Open the main site, click Blog, come back with the logo. The top bar does not jump, the colours and fonts match, and the theme stays the same in both directions.
- [ ] Choose dark mode on the main site, open the blog: it is dark. And the reverse.
- [ ] No Tailwind palette colours or `dark:` classes remain in public pages.
- [ ] Every public page is readable with JavaScript turned off (content is in the HTML).
- [ ] Phone width, light and dark: home, a post, a topic page, the menu.
- [ ] A draft is not visible on the home page, by its address, in search, on topic pages or in the API.
- [ ] A long post: table of contents highlights the right heading, the progress bar reaches the end, headings are not hidden under the sticky bar.
- [ ] A post with a table, a code block and an image looks right in both themes and does not make the page scroll sideways on a phone.
- [ ] `GET /blog/api/posts?limit=3` returns the shape in section 8, and the main site's home page shows the three posts.
- [ ] `npm run lint` and `npm run build` pass.
