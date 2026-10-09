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

Next.js 16 (App Router) + React 19, plain JavaScript (`.js`/`.jsx`, no TypeScript), Tailwind CSS v4, Prisma 6 on MongoDB, Auth.js v5 beta (`next-auth`), Cloudinary. Import alias `@/*` → `src/*`.

Do not upgrade Prisma past 6.x: Prisma 7 has no MongoDB support and Prisma 8's is early access. `next-auth` stays on the v5 beta line (npm's `latest` tag is the older v4).

Next 16 conventions apply: the request interceptor is `src/proxy.js` (not `middleware.js`), and `params` / `searchParams` in pages are Promises that must be awaited.

## Architecture

### Multi-Zone deployment

This app is one zone of `raselrana.com.bd`. It is deployed as its own Vercel project (internal domain `blog-zone.raselrana.com.bd`, never linked publicly) and the main site rewrites `/blog` and `/blog/:path+` to it. Hence `basePath: "/blog"` in `next.config.mjs`.

The basePath is the main source of subtle bugs here. It is handled in three different ways:

- `next/link`, `next/navigation` `redirect()` and `router.push()` add it automatically — write paths without `/blog`.
- Client-side `fetch` calls do not get it. `PostEditor` and `ImageUploader` prefix with `process.env.NEXT_PUBLIC_BASE_PATH`.
- Client-side `signOut({ callbackUrl })` does not get it either (`SignOutButton` prefixes it).
- Auth.js needs it stated explicitly: the server config uses `basePath: "/api/auth"` (`src/lib/auth.js`), while the client `SessionProvider` uses `${NEXT_PUBLIC_BASE_PATH}/api/auth` (`src/providers/auth-provider.js`). The `pages` paths in the Auth.js config are used verbatim, so they include the prefix. `AUTH_URL` must match the deployed origin.
- In `src/proxy.js` the request passed by the `auth()` wrapper has lost the basePath (`req.nextUrl.clone()` does not restore it), so the login redirect is built from `NEXT_PUBLIC_BASE_PATH`.

Links to the main site (outside the zone) must be plain `<a>` / full URLs, not `next/link`.

### Data layer

Prisma is the data layer in use: `src/lib/prisma.js` exports a singleton client, schema in `prisma/schema.prisma` (`Post` mapped to the `posts` collection, and `User`). Prisma reads `DATABASE_URL`; the Prisma CLI gets it from `.env` via `prisma.config.ts` (`dotenv/config`), not from `.env.local`.

Prisma is the only data layer; an earlier Mongoose implementation was removed. `Post` stores the cover as flat `coverUrl` / `coverPublicId` fields.

### Auth

Credentials provider only (email + bcrypt hash on `User.passwordHash`), JWT sessions, `role` copied onto the token and session in the callbacks. Emails are looked up lower-cased. There is no sign-up flow — the admin user is created by `src/scripts/create-admin.js`. The login page is `/login`.

`/admin/*` is guarded twice: `src/proxy.js` (matcher `/admin/:path*`) and `src/app/admin/layout.js` (`auth()` + redirect). The API route handlers are outside that matcher, so each mutating handler must start with `requireAdmin()` from `src/lib/require-admin.js` (401 without a session, 403 for a non-admin role). There is no login rate limiting yet.

### Post creation flow

`/admin/new-post` → `PostEditor` (client) → `ImageUploader` posts the file to `POST /api/upload`, which validates it (JPEG/PNG/WebP/GIF/AVIF, max 4 MB because of Vercel's request body limit), streams it to Cloudinary (folder `UPLOAD_FOLDER` from `src/lib/cloudinary.js`) and returns `{ url, publicId, width, height }` → on submit, `POST /api/posts` validates the fields (slug pattern, lengths, cover must come from our Cloudinary folder; duplicate slug → 409) and writes the post via Prisma with `published: false`. `res.cloudinary.com` is whitelisted for `next/image`.

## Current state

Much of the blog is not built yet (the README lists what is planned):

- The home page is an "Under Development" placeholder and the root layout sets `robots: noindex`.
- `src/lib/mdx.js` and everything under `src/services/` are empty placeholder files.
- `posts/[slug]` renders a hard-coded object; `tags/[tag]` and `admin/[id]/edit` are stubs. No public page reads from the database yet.

## Environment variables

`.env` (Prisma CLI): `DATABASE_URL`

`.env.local`: `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_BASE_PATH` (`/blog`), `AUTH_SECRET`, `AUTH_URL`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` for the admin script only. `.env.example` lists them all.

These belong to the blog's own Vercel project, not the main site's.

## Git workflow

Work happens on `feature/*` branches merged into `develop` through pull requests; `main` is the release branch.
