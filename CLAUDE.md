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
```

There is no test suite or test runner configured.

The `dev` script launches Next through `node --dns-result-order=ipv4first` on purpose (slow IPv6 resolution against MongoDB Atlas) — keep that when editing scripts.

The project must not live in a path containing `&`, `%` or other shell-special characters; it breaks npm's `.bin` shims on Windows.

## Stack

Next.js 16 (App Router) + React 19, plain JavaScript (`.js`/`.jsx`, no TypeScript), Tailwind CSS v4, Prisma 6 on MongoDB, Auth.js v5 beta (`next-auth`), Cloudinary, `next-themes`, `react-markdown`. Import alias `@/*` → `src/*`.

Do not upgrade Prisma past 6.x: Prisma 7 has no MongoDB support and Prisma 8's is early access. `next-auth` stays on the v5 beta line (npm's `latest` tag is the older v4).

Next 16 conventions apply: the request interceptor is `src/proxy.js` (not `middleware.js`), and `params` / `searchParams` in pages are Promises that must be awaited.

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

Prisma only: `src/lib/prisma.js` exports a singleton client, schema in `prisma/schema.prisma` (`Post` mapped to the `posts` collection, and `User`). Prisma reads `DATABASE_URL`; the Prisma CLI gets it from `.env` via `prisma.config.ts` (`dotenv/config`), not from `.env.local`.

All post access goes through `src/services/posts/`:

- `queries.js` — reads. Public functions always filter `published: true` and return card objects without content or ids; admin functions are named `…ForAdmin` / `getPostById`.
- `actions.js` — create / update / delete. Each calls `revalidatePath("/", "layout")`, which is what refreshes statically rendered pages such as `/tags`; any new write path must do the same.
- `validation.js` — `parsePostInput()` for the editor payload (slug pattern, lengths, max 8 topics, cover must come from our Cloudinary folder).

`publishedAt` records the first publish only (unpublishing keeps it). Public ordering is `publishedAt` desc; display falls back to `createdAt` via `postDate()`.

Topics are stored as typed. Prisma cannot search a list ignoring case on MongoDB, so search first matches topic names in JavaScript and then uses `hasSome`.

### Markdown

`src/components/mdx/Markdown.jsx` is the single renderer (GFM, heading ids, syntax highlighting, raw HTML dropped, external links in a new tab, Cloudinary-resized images). It has no `"use client"` so the post page renders it on the server and `PostEditor` reuses it for the live preview; keep it free of server-only imports. Its output must sit inside an element with class `article` (styles in `globals.css`).

`src/lib/toc.js` builds the table of contents with the same slugger order as `rehype-slug`, so ids match the rendered headings.

### Images

`next.config.mjs` sets a global `next/image` loader, `src/lib/cloudinary-loader.js`, which inserts `f_auto,q_auto,c_limit,w_<width>` into Cloudinary addresses. That file is imported by client code too, so it must not import the Cloudinary SDK (`src/lib/cloudinary.js` is server only).

### Auth

Credentials provider only (email + bcrypt hash on `User.passwordHash`), JWT sessions, `role` copied onto the token and session in the callbacks. Emails are looked up lower-cased. There is no sign-up flow — the admin user is created by `src/scripts/create-admin.js`. The login page is `/login`.

`/admin/*` is guarded twice: `src/proxy.js` (matcher `/admin/:path*`) and `src/app/admin/layout.js` (`auth()` + redirect). The API route handlers are outside that matcher, so each mutating handler must start with `requireAdmin()` from `src/lib/require-admin.js` (401 without a session, 403 for a non-admin role). There is no login rate limiting yet.

### API

- `GET /api/posts?limit=` — **public, and a contract with the main site** (its home page shows the newest posts). Shape, caching header and rules are in `docs/design-brief.md` §8; do not add fields such as content or ids, and coordinate any change with the main site.
- `POST /api/posts`, `PATCH` / `DELETE /api/posts/[id]` — admin. The editor always sends the full post, including `published`.
- `POST /api/upload` — admin; JPEG/PNG/WebP/GIF/AVIF, max 4 MB (Vercel's request body limit), stored in `UPLOAD_FOLDER`.

## Not built / leftovers

- Out of scope by decision: RSS, comments, newsletter, visual editor, several authors, scheduled publishing.
- Deleting a post does not delete its images from Cloudinary.
- `src/lib/mdx.js`, `src/services/posts/model.js` and `src/services/uploads/actions.js` are empty leftover files.

## Environment variables

`.env` (Prisma CLI): `DATABASE_URL`

`.env.local`: `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` (optional, defaults to `raselrana-blog`), `NEXT_PUBLIC_BASE_PATH` (`/blog`), `AUTH_SECRET`, `AUTH_URL`, `BLOG_INDEXABLE`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` for the admin script only. `.env.example` lists them all.

`BLOG_INDEXABLE=true` lets search engines index the public pages; anything else keeps the whole site `noindex`. It is off until launch.

`BLOG_LAUNCHED`: until it is `true`, the production deployment (`VERCEL_ENV=production`) answers every public address with the "coming soon" page (`src/lib/coming-soon.js`, the rewrite in `src/proxy.js`, page in `src/app/coming-soon/`) and `GET /api/posts` returns no posts. `/admin` and the sign-in page stay open. Local runs and preview deployments are not affected; to see the page locally, start the server with `VERCEL_ENV=production`.

These belong to the blog's own Vercel project, not the main site's.

## Git workflow

Work happens on `feature/*` branches merged into `develop` through pull requests; `main` is the release branch.
