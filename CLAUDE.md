# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000/blog (basePath applies locally too)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint (flat config, eslint-config-next/core-web-vitals)

npx prisma db push                  # sync prisma/schema.prisma to MongoDB (no migrations with the MongoDB provider)
npx prisma generate                 # regenerate the client (also runs on postinstall)
node src/scripts/create-admin.js    # upsert the admin user from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env.local
npm run seed:categories             # create the launch categories; safe to run again
```

There is no test suite or test runner configured.

On Windows, `prisma generate` (and `prisma db push`, which runs it) fails with `EPERM … query_engine-windows.dll.node` while a dev server is running, because the server holds that file open. Stop the dev server first. Never use `prisma db push --force-reset`.

The `dev` script launches Next through `node --dns-result-order=ipv4first` on purpose (slow IPv6 resolution against MongoDB Atlas) — keep that when editing scripts.

The project must not live in a path containing `&`, `%` or other shell-special characters; it breaks npm's `.bin` shims on Windows.

## Stack

Next.js 16 (App Router) + React 19, plain JavaScript (`.js`/`.jsx`, no TypeScript), Tailwind CSS v4, Prisma 6 on MongoDB, Auth.js v5 beta (`next-auth`), Cloudinary, `next-themes`, `react-markdown`. Import alias `@/*` → `src/*`.

Do not upgrade Prisma past 6.x: Prisma 7 has no MongoDB support and Prisma 8's is early access. `next-auth` stays on the v5 beta line (npm's `latest` tag is the older v4).

Next 16 conventions apply: the request interceptor is `src/proxy.js` (not `middleware.js`), and `params` / `searchParams` in pages are Promises that must be awaited.

## Build spec

Build spec for admin + categories: see docs/BLOG_ADMIN_SPEC.md. Always run the audit (section 1) first and keep the progress table (section 12) updated.

Where the spec and the code disagree, the "Audit corrections and owner decisions" table in its section 2 wins.

## Design: shared with the main site

`docs/design-brief.md` is the specification from the main site project (`raselrana-web`) and the source of truth for look, structure and the public API. Read it before changing anything visual.

- **Tokens only.** Colours are the CSS variables in `src/app/globals.css` (`--ink`, `--slate`, `--paper`, `--surface`, `--signal`, `--pulse`, `--line`, `--danger`), used as `text-[var(--ink)]` etc. No Tailwind palette colours (`gray-500`, `bg-white`) and no `dark:` variants. Token names and values must stay identical to the main site's. Keep the `[var(--x)]` spelling the brief uses, even though the Tailwind IDE plugin suggests `text-(--x)`.
- Ready-made class strings (container, headings, card, chip, buttons, input) live in `src/lib/ui.js`; use those instead of retyping them.
- Theme: `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem` and the default storage key. Both sites share one origin, so this is what carries the visitor's theme across; do not change the settings or add a custom toggle.
- Entrance motion is CSS only (`rise`, `reveal`). Never hide content until JavaScript runs; every public page must be readable from the server HTML. That is why search is a GET form, the phone menu is a `<details>`, and the table of contents is plain anchors that a client component only enhances.
- `rise`/`reveal` elements are transformed, so nothing `position: fixed` may live inside them (`ReadingProgress` is rendered outside; the delete confirmation uses a native `<dialog>`).

## Architecture

### Multi-Zone deployment

This app is one zone of `raselrana.com.bd`. It is deployed as its own Vercel project (internal domain `blog-zone.raselrana.com.bd`, never linked publicly) and the main site rewrites `/blog` and `/blog/:path+` to it. Hence `basePath: "/blog"` in `next.config.mjs`.

The basePath is the main source of subtle bugs here:

- `next/link`, `next/navigation` `redirect()` and `router.push()` add it automatically — write paths without `/blog`.
- Client-side `fetch` calls, native `<form action>` and `signOut({ callbackUrl })` do not get it; they prefix `process.env.NEXT_PUBLIC_BASE_PATH` (`src/lib/upload-client.js`, `PostEditor`, `SearchForm`, `SignOutButton`).
- Auth.js needs it stated explicitly: the server config uses `basePath: "/api/auth"` (`src/lib/auth.js`), while the client `SessionProvider` uses `${NEXT_PUBLIC_BASE_PATH}/api/auth` (`src/providers/auth-provider.js`). The `pages` paths in the Auth.js config are used verbatim, so they include the prefix. `AUTH_URL` must match the deployed origin.
- In `src/proxy.js` the request passed by the `auth()` wrapper has lost the basePath (`req.nextUrl.clone()` does not restore it), so the login redirect is built from `NEXT_PUBLIC_BASE_PATH`.
- Metadata URLs (canonical, Open Graph) are written in full via `postUrl()` / `BLOG_URL` in `src/lib/posts.js`.

Links to the main site go through `components/layout/MainSiteLink.jsx`: a plain root-relative `<a>` (`/about`, `/contact`), never `next/link`. Locally those addresses 404 because the main site is a different app.

### Route layout

- `src/app/layout.js` — fonts, theme provider, default metadata. No menu.
- `src/app/(site)/` — public pages; its layout adds `SiteHeader` and `SiteFooter`. `src/app/not-found.jsx` sits outside the group and includes them itself.
- `src/app/admin/` and `src/app/login/` — their layouts add the Auth.js `SessionProvider` (kept off public pages so they make no session request) and `robots: noindex`.

### Data layer

Prisma only: `src/lib/prisma.js` exports a singleton client, schema in `prisma/schema.prisma` (`Post` → `posts` collection, `User`, `Category`, `Tag`, `LoginAttempt`). Prisma reads `DATABASE_URL`; the Prisma CLI gets it from `.env` via `prisma.config.ts` (`dotenv/config`), not from `.env.local`.

Every post has a `status` (`DRAFT` / `SCHEDULED` / `PUBLISHED` / `ARCHIVED`), one content type (enum; labels and address slugs in `src/lib/content-types.js`), at most one category, and topics (`Tag` records, many-to-many). The featured image is one JSON field `{ url, publicId, width, height, alt }`.

All post access goes through `src/services/posts/`:

- `queries.js` — reads. **`livePostWhere()`** (published, or scheduled with its time passed) decides what a reader may open; **`listedPostWhere(...extra)`** adds "not `noindex`" and is what every listing, search, related-posts query and the main-site API use. Never write a status filter by hand in a public query. Public functions return card objects without content or ids.
- `actions.js` — create / update / delete. They compute `readingTime`, keep `previousSlugs`, find-or-create topics, and call `revalidatePosts()`.
- `validation.js` — `parsePostInput()` (zod). Drafts may be incomplete; publishing requires content, excerpt, category, and a featured image with alt text.
- `slugs.js` — a slug is taken if any post uses it now **or used it before** (`previousSlugs`), and `RESERVED_SLUGS` blocks names of top-level routes, because articles will live at `/blog/<slug>`.
- `revalidate.js` — `revalidatePosts(before, after)` refreshes the pages a post is on. Any new write path must call it, or statically rendered pages such as `/tags` go stale.

`publishedAt` records the first publish only (unpublishing keeps it). `updatedAt` changes on every save and is never shown to readers; `contentUpdatedAt` ("Last updated") is set only by a deliberate significant update. `showOnMainSite` only affects the main-site API.

Old documents may still carry the pre-spec fields (`published`, `coverUrl`, `coverPublicId`, a `tags` text list). Prisma ignores them; do not rely on them.

Addresses are built by `postPath()` / `tagPath()` in `src/lib/posts.js`. They currently return `/posts/<slug>` and `/tags/<slug>`; spec step 15 moves them to `/<slug>` and `/tag/<slug>` with redirects from the old ones.

### Markdown

`src/components/mdx/Markdown.jsx` is the single renderer (GFM, heading ids, syntax highlighting, raw HTML dropped, external links in a new tab, Cloudinary-resized images). It has no `"use client"` so the post page renders it on the server and `PostEditor` reuses it for the live preview; keep it free of server-only imports. Its output must sit inside an element with class `article` (styles in `globals.css`).

Two conventions go beyond plain Markdown, both decided by looking at a paragraph's contents:

- two or more images with nothing else in the paragraph (image lines directly under each other) render as a photo grid (`.gallery`), each linking to the full-size image;
- a bare YouTube address alone in a paragraph renders as `YouTubeEmbed` (thumbnail and play button; the player loads from `youtube-nocookie.com` only on click, and without JavaScript it is a plain link). A YouTube link inside a sentence stays a link. Parsing is in `src/lib/youtube.js`.

`src/lib/toc.js` builds the table of contents with the same slugger order as `rehype-slug`, so ids match the rendered headings.

### Images

`next.config.mjs` sets a global `next/image` loader, `src/lib/cloudinary-loader.js`, which inserts `f_auto,q_auto,c_limit,w_<width>` into Cloudinary addresses. That file is imported by client code too, so it must not import the Cloudinary SDK (`src/lib/cloudinary.js` is server only).

### Auth and permissions

Credentials provider only (email + bcrypt hash on `User.passwordHash`), JWT sessions. Emails are looked up lower-cased. There is no sign-up flow — the admin user is created by `src/scripts/create-admin.js`. The login page is `/login` (moves to `/admin/login` in spec step 6).

Permission checks live in `src/lib/authz.js` and read the user **from the database**, not from the session cookie, so a role change or `isActive: false` takes effect at once: `getCurrentUser()`, `requireUser()`, `requireRole("ADMIN")`, `canEditPost(user, post)`, `canSetStatus(user, status)`. The role on the session is only a hint for the UI.

`/admin/*` is guarded twice: `src/proxy.js` (matcher `/admin/:path*`) and `src/app/admin/layout.js` (`getCurrentUser()` + redirect). API route handlers and server actions are outside that matcher, so each one that changes data must start with `requireApiUser()` or `requireAdmin()` from `src/lib/require-admin.js` (wrappers that turn an `AuthzError` into a 401/403 response). Roles are `ADMIN` and `AUTHOR`; only `ADMIN` may publish or delete. Nothing in the UI creates an `AUTHOR` yet.

Login rate limiting (`src/lib/login-rate-limit.js`): every attempt is stored as a `LoginAttempt` keyed by email + IP; after 5 failures in 15 minutes the next attempts are refused with the code `rate_limited`, whether or not the email exists. A successful sign-in resets the count; attempts older than 24 hours are deleted on each login. To unblock yourself locally, delete the `LoginAttempt` documents.

### API

- `GET /api/posts?limit=` — **public, and a contract with the main site** (its home page shows the newest posts). Only listed posts with `showOnMainSite` on. The shape, caching header and rules are in `docs/main-site-api.md`; fields may be added but not removed or renamed, and never content or ids.
- `POST /api/posts`, `PATCH /api/posts/[id]` — any signed-in user who may edit the post; setting a status other than `DRAFT` needs `ADMIN`. The editor always sends the full post, including `status`.
- `DELETE /api/posts/[id]` — `ADMIN`.
- `POST /api/upload` — signed-in users; JPEG/PNG/WebP/GIF/AVIF, max 4 MB (Vercel's request body limit), stored in `UPLOAD_FOLDER`. To be replaced by signed direct uploads in spec step 8.

## Not built / leftovers

- `docs/BLOG_ADMIN_SPEC.md` section 12 lists what is built. Scheduling and archiving exist in the data model and the public queries but have no controls in the admin yet.
- Out of scope by decision: RSS, comments, newsletter, visual editor.
- Deleting a post does not delete its images from Cloudinary.
- `src/lib/mdx.js`, `src/services/posts/model.js` and `src/services/uploads/actions.js` are empty leftover files.

## Environment variables

`.env` (Prisma CLI): `DATABASE_URL`

`.env.local`: `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` (optional, defaults to `raselrana-blog`), `NEXT_PUBLIC_BASE_PATH` (`/blog`), `AUTH_SECRET`, `AUTH_URL`, `BLOG_INDEXABLE`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_USERNAME` for the admin script only. `.env.example` lists them all.

`BLOG_INDEXABLE=true` lets search engines index the public pages; anything else keeps the whole site `noindex`. It is off until launch.

These belong to the blog's own Vercel project, not the main site's.

## Git workflow

Work happens on `feature/*` branches merged into `develop` through pull requests; `main` is the release branch.
