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
| Database            | MongoDB (Atlas) + Prisma 6                  |
| Image storage       | Cloudinary                                  |
| Auth                | Auth.js v5 (email + password, admin only)   |
| Content (planned)   | MDX (compiled from DB-stored Markdown/MDX)  |
| Hosting             | Vercel (Hobby)                              |

## Features

Built:

- Protected `/admin` area: dashboard and post creation (saved as drafts)
- Cloudinary cover image uploads (folder `raselrana-blog`, images up to 4 MB)
- Admin-only API routes with input validation

Planned:

- Public post pages rendered from the database, edit / publish / delete in the CMS
- MDX rendering with syntax-highlighted code blocks
- Tags, pagination, search, table of contents, reading time
- SEO: sitemap, robots.txt, RSS feed, Open Graph images, JSON-LD

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
prisma/schema.prisma  # Post and User models
src/
├── app/            # Routes: public pages, /login, /admin CMS, API routes
├── components/     # UI components: auth, blog, media
├── lib/            # Infra: prisma.js, auth.js, require-admin.js, cloudinary.js
├── providers/      # Client providers (Auth.js session)
├── scripts/        # create-admin.js
├── services/       # Domain logic per entity (placeholders, not built yet)
└── proxy.js        # Protects /admin routes via the Auth.js session (Next.js 16 proxy)
```

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Start local dev server  |
| `npm run build` | Production build        |
| `npm run start` | Start production server |
| `npm run lint`  | Run ESLint              |
