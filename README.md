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

| Layer               | Choice                                      |
| ------------------- | ------------------------------------------- |
| Framework           | Next.js (App Router)                        |
| Styling             | Tailwind CSS v4                             |
| Database            | MongoDB (Atlas) + Mongoose                  |
| Image storage       | Cloudinary                                  |
| Auth                | Auth.js (GitHub OAuth, restricted to owner) |
| Content             | MDX (compiled from DB-stored Markdown/MDX)  |
| Syntax highlighting | rehype-pretty-code (Shiki)                  |
| Hosting             | Vercel (Hobby)                              |

## Features

- MongoDB-backed posts with a protected `/admin` CMS (create, edit, publish, delete)
- Cloudinary-powered image uploads with automatic optimization
- MDX rendering with syntax-highlighted code blocks
- Tags, pagination, and client-side search (Fuse.js)
- Table of contents with scroll-spy
- Reading time estimates
- SEO: dynamic metadata, sitemap, robots.txt, RSS feed, Open Graph images, JSON-LD structured data
- Instant publish via `revalidatePath` — no redeploy needed for new/edited posts

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd raselrana-blog
npm install
```

> **Note:** Avoid placing this project in a path containing `&`, `%`, or other shell-special characters (e.g. `Website & Blog\`) — it breaks npm's `.bin` shims on Windows.

### 2. Environment variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Auth.js
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=https://raselrana.com.bd/blog
```

Add the same variables in the Vercel project dashboard for Production and Preview environments.

### 3. Run locally

```bash
npm run dev
```

The dev server runs at `http://localhost:3000` (note: `basePath` applies here too, so local routes are under `/blog`).

## Project Structure

```
src/
├── app/            # Routes: public pages, /admin CMS, API routes, sitemap/rss/robots
├── components/      # UI components: layout, blog, mdx, admin
├── lib/             # Infra clients: db.js, auth.js, cloudinary.js, mdx.js
├── services/        # Domain logic per entity (posts/, uploads/) — models, queries, actions
├── utils/           # Pure helper functions (formatDate, slugify, etc.)
├── assets/          # Fonts, icons, images imported directly into code
└── middleware.js     # Protects /admin routes via Auth.js session
```

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Start local dev server  |
| `npm run build` | Production build        |
| `npm run start` | Start production server |
