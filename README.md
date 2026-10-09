# Rasel Rana — Blog

Personal technical blog by **Rasel Rana**, Manager (Technical) at BTCL, Electrical & Electronic Engineer.

This is a standalone Next.js (App Router) application, integrated into the main site [raselrana.com.bd](https://raselrana.com.bd) via **Next.js Multi-Zones**, served publicly at `raselrana.com.bd/blog`.

## Architecture

- **Standalone repo**, deployed as its own Vercel project.
- `basePath: '/blog'` set in `next.config.mjs`.
- Internal deployment domain: `blog-zone.raselrana.com.bd` (never linked publicly).
- Proxied into the main site via `rewrites()` in the main site's `next.config.mjs`, mapping `/blog` and `/blog/:path+` → `BLOG_DOMAIN`.
- **Public URL:** `raselrana.com.bd/blog`

## Tech Stack

| Layer               | Choice                                              |
| ------------------- | --------------------------------------------------- |
| Framework           | Next.js (App Router)                                |
| Styling             | Tailwind CSS v4, design tokens shared with the main site |
| Theme               | next-themes (light / dark, shared with the main site) |
| Database            | MongoDB (Atlas) + Prisma 6                          |
| Image storage       | Cloudinary                                          |
| Auth                | Auth.js v5 (email + password, admin only)           |
| Content             | Markdown (react-markdown, GFM, syntax highlighting) |
| Hosting             | Vercel (Hobby)                                      |

The look, structure and public API follow [docs/design-brief.md](docs/design-brief.md), written by the main site project.

## Features

- Blog home with search, topic chips, a feature card for the newest post, and pagination
- Post page: table of contents that follows scrolling, reading progress bar, reading time, share row, previous / next, related posts, author card
- Topics: a page listing all topics and a page per topic
- Admin CMS at `/admin`: Markdown editor with live preview, cover and inline image upload, topics with suggestions, save draft / publish / unpublish, edit and delete
- Public API for the main site's "Latest writing" section: `GET /blog/api/posts?limit=3`
- Light and dark mode that carries over from the main site
- Edits appear on the public pages at once (`revalidatePath`), no redeploy

Not included by decision: RSS feed, comments, newsletter, visual editor.

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd raselrana-blog
npm install
```

> **Note:** Avoid placing this project in a path containing `&`, `%`, or other shell-special characters (e.g. `Website & Blog\`) — it breaks npm's `.bin` shims on Windows.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in. The Prisma CLI does not read `.env.local`, so also put `DATABASE_URL` in `.env`.

Add the same variables (except the `ADMIN_*` ones) in the blog's Vercel project for Production and Preview.

### 3. Database and admin user

```bash
npx prisma db push                  # create collections and indexes
node src/scripts/create-admin.js    # create/update the admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

Re-run the script any time to change the admin password.

### 4. Run locally

```bash
npm run dev
```

The dev server runs at `http://localhost:3000/blog` (`basePath` applies locally too). Sign in at `/blog/login`.

## Project Structure

```
docs/design-brief.md  # Design and API specification shared with the main site
prisma/schema.prisma  # Post and User models
src/
├── app/
│   ├── (site)/     # Public pages (home, posts, tags, about) with menu and footer
│   ├── admin/      # CMS: post list, new post, edit
│   ├── login/
│   └── api/        # posts (public GET, admin writes), upload, auth
├── components/     # layout, blog, mdx (Markdown renderer), admin, auth, media, brand
├── lib/            # prisma, auth, require-admin, cloudinary, posts helpers, toc, ui classes
├── providers/      # Auth.js session provider (admin and login only)
├── scripts/        # create-admin.js
├── services/posts/ # queries, actions and validation for posts
└── proxy.js        # Protects /admin routes via the Auth.js session (Next.js 16 proxy)
```

## Going live

The site tells search engines not to index it until `BLOG_INDEXABLE=true` is set in the blog's Vercel project (then redeploy). `/admin` and `/login` always stay hidden.

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Start local dev server  |
| `npm run build` | Production build        |
| `npm run start` | Start production server |
| `npm run lint`  | Run ESLint              |
