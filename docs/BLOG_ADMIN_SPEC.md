# Blog Admin & Categories — Implementation Spec

> **For Claude Code:** This is the build spec for the admin dashboard and category system of the technical blog at `raselrana.com.bd/blog`. The project already exists and some features are already built. **Do not rebuild or overwrite anything that already works.** Follow the workflow in section 1 before writing any code.

---

## 0. How the owner uses this file

1. Save this file as `docs/BLOG_ADMIN_SPEC.md` in the blog repo.
2. Add this line to `CLAUDE.md` (create it if missing):
   `Build spec for admin + categories: see docs/BLOG_ADMIN_SPEC.md. Always run the audit (section 1) first and keep the progress table (section 12) updated.`
3. Prompt Claude Code one step at a time, for example:
   - `Read docs/BLOG_ADMIN_SPEC.md and do the audit in section 1. Don't change code yet.`
   - `Implement the next unfinished item in the build order (section 11).`

---

## 1. Workflow for Claude Code (mandatory)

### Step 1: Audit before coding

Before implementing anything, inspect the codebase and fill in the progress table in **section 12**. Mark every item with one of these statuses:

- ✅ **Done**: exists and works as this spec describes. **Skip it.**
- 🟡 **Partial**: exists but is missing parts of this spec. Only add the missing parts and keep the existing code style.
- ❌ **Missing**: build it.
- ⚠️ **Conflict**: exists but works differently from this spec. **Do not change it. Ask the owner first** and explain the difference.

Check at least these locations:
- `prisma/schema.prisma`
- `src/lib/` (auth, prisma)
- `src/proxy.js`
- `src/app/` (all routes, especially `admin/`)
- `src/services/`
- `src/components/`
- `scripts/`
- `package.json`

### Step 2: Show the audit and wait

Show the owner the audit result as a short table. **Wait for approval before coding.**

### Step 3: Build in order

- Build in the order given in **section 11**, one item per session or commit.
- After each item, update section 12 and summarize what changed.

### Rules

- Extend existing files and models. Do not replace them.
- Never delete existing fields, models, routes or data without asking.
- Do not install a new library when an installed one already does the job. Check `package.json` first.
- The owner develops on **Windows with PowerShell**, so give PowerShell commands, not bash.
- Do not run destructive database commands. This includes `prisma db push --force-reset` and dropping collections.
- Keep secrets in `.env.local`. Never hard-code them. Update `.env.example` whenever you add a variable.

---

## 2. Known stack (verify during the audit)

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Mounting | Multi-Zones; `basePath: '/blog'`; served at `raselrana.com.bd/blog` |
| Request interception | `src/proxy.js` (Next 16's replacement for `middleware.js`) protects `/admin` |
| Database | MongoDB Atlas |
| Data layer | **Prisma 6** with the MongoDB connector (the decided data layer) |
| Auth | Auth.js (next-auth v5 beta), **Credentials** (email + bcrypt), sign-in page `/admin/login`, `scripts/create-admin.js` exists |
| Content | Markdown stored in the DB and rendered as MDX; `rehype-pretty-code` (Shiki) |
| Images | Cloudinary |
| Styling | Tailwind CSS v4 |
| Search | Fuse.js (planned) |
| Hosting | Vercel Hobby |

### Notes

- **Mongoose is also installed.** Prisma is the chosen data layer. If any code still uses Mongoose, report it in the audit. **Do not remove Mongoose without asking.**
- **Prisma and MongoDB:**
  - Stay on Prisma 6.x. Check MongoDB support before any major Prisma upgrade.
  - MongoDB uses `prisma db push`, not migrations.
- **`basePath` is `/blog`.**
  - Route files live at `src/app/admin/...` but are served at `/blog/admin/...`.
  - Use `next/link` and `useRouter` normally, since they add the basePath automatically.
  - Check how `revalidatePath()` and `redirect()` handle basePath in Next 16 before relying on them.

### Audit corrections and owner decisions (2026-10-09)

What the audit found to differ from the table above, and what the owner decided. **These override the rest of this file where they disagree.**

| Topic | Decision |
|---|---|
| Mongoose | Already removed (with the owner's approval, before this spec). Nothing uses it. |
| Scripts folder | Scripts live in `src/scripts/`, not `scripts/`. New scripts go there too. |
| Sign-in page | `/admin/login` (moved in step 6; `/login` redirects). |
| Content rendering | **Stays Markdown** (`react-markdown`, GFM, `rehype-highlight`), not MDX/Shiki. Posts cannot contain raw HTML or JavaScript, so section 7.4.2 is already satisfied. Callouts are added with the editor work. |
| Live preview | The editor keeps its instant in-browser preview, which uses the same renderer component as the public page. `/preview/[id]` is still built, for the Preview button. |
| Image upload | Signed direct uploads as in 7.4.1, but stored under `<CLOUDINARY_UPLOAD_FOLDER>/posts/<post-id>/` (default `raselrana-blog/posts/<post-id>/`). SVG is rejected. |
| Public addresses | Follow section 4.4 (`/blog/<slug>`, `/blog/tag/<slug>`). The current `/blog/posts/<slug>` and `/blog/tags/<tag>` must permanently redirect, because the main site links to `/blog/posts/<slug>` (see `docs/design-brief.md`). Done in steps 15–16. |
| Navigation | The top bar stays as `docs/design-brief.md` describes (Posts, Topics, About the author). The six categories and the Troubleshooting hub go in a row under it. |
| RSS | Not built (declined in `docs/design-brief.md`). Sitemap and JSON-LD are. |
| Search | Server-side search already exists; Fuse.js is not needed. |
| `Post.categoryId` | Optional in the database, required to publish. (Drafts may be incomplete and are autosaved, so it cannot be required at the database level.) |
| `Post.excerpt` | Defaults to empty and is filled from the content on save. |
| `Post.showOnMainSite` | Added at the owner's request: when off, the post is left out of the main-site API (`docs/main-site-api.md`) but stays on the blog. Default on. |
| Galleries and video | Added at the owner's request: images placed together render as a grid; a YouTube link on its own line renders as a click-to-play video block. |

---

## 3. Product decisions (already made by the owner)

| Decision | Choice |
|---|---|
| Editor | **Markdown with live preview** (no rich-text/WYSIWYG editor) |
| Comments | **Not at launch.** Do not build a comments model, a counter or UI. |
| Troubleshooting | A **content type**, not a category |
| Authors | Only the owner writes for now. **Guest authors may come later.** Add roles to the data model and the permission checks now, but build no author-management UI yet. |
| Language | English only |

---

## 4. Taxonomy

Every post has **exactly one category**, **exactly one content type** and **3–6 tags**.

### 4.1 Categories (seed data)

| Order | Name | Slug | Description (shown on the category page) |
|---|---|---|---|
| 1 | Telecommunications | `telecommunications` | PSTN, E1, PRI, telephone exchanges, MDF, call routing and numbering systems. |
| 2 | Networking | `networking` | TCP/IP, routing, switching, VLANs, OSPF, DHCP, DNS, NAT and network troubleshooting. |
| 3 | GPON & Fiber Optics | `gpon-fiber-optics` | GPON architecture, OLT/ONT/ONU, splitters, optical power, link loss and SFP modules. |
| 4 | VoIP & IP-PBX | `voip-ip-pbx` | SIP, IP-PBX, extensions, SIP trunking, softphones and voice troubleshooting. |
| 5 | MikroTik | `mikrotik` | RouterOS configuration, firewall, NAT, bandwidth management and routing on MikroTik. |
| 6 | IT & Technology | `it-technology` | Linux, servers, hosting, cloud, security fundamentals and developer tools. |

Create `scripts/seed-categories.js`. It must be **idempotent**: upsert by slug, so running it twice creates no duplicates and does not overwrite descriptions edited in the admin. Add an npm script: `"seed:categories": "node scripts/seed-categories.js"`.

### 4.2 Content types (enum, not a DB collection)

| Enum value | Label | Hub URL | Example |
|---|---|---|---|
| `EXPLAINER` | Explainer | `/blog/type/explainer` | What Is GPON? |
| `HOWTO` | How-to | `/blog/type/how-to` | MikroTik DHCP Server Configuration |
| `TROUBLESHOOTING` | Troubleshooting | `/blog/type/troubleshooting` | SIP Registration Failed: Causes and Fixes |
| `COMPARISON` | Comparison | `/blog/type/comparison` | E1 vs. SIP Trunk |

Keep the label/slug mapping in one file, e.g. `src/lib/content-types.js`.

### 4.3 Tags

Tags are free-form, created inline in the editor, and their slugs are unique. Examples: `ont`, `ospf`, `dbm`, `sip-trunk`, `routeros`, `asterisk`.

### 4.4 Public URLs

| Page | URL | Notes |
|---|---|---|
| Article | `/blog/[slug]` | **Flat. Never put the category in the article URL.** |
| Category | `/blog/category/[slug]` | Paginated. Show the description. Filter by content type via `?type=`. |
| Content-type hub | `/blog/type/[type]` | Paginated, across all categories |
| Tag | `/blog/tag/[slug]` | Paginated |
| Author | `/blog/author/[username]` | Bio, links to raselrana.com.bd, the author's posts |
| Draft preview | `/blog/preview/[id]` | Logged-in users only, `noindex` |

---

## 5. Data model (Prisma, MongoDB)

**Merge this into the existing `schema.prisma`.** If a model already exists (especially `User`), keep its current fields and add only what is missing. Report any conflicts.

```prisma
enum Role {
  ADMIN
  AUTHOR
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum ContentType {
  EXPLAINER
  HOWTO
  TROUBLESHOOTING
  COMPARISON
}

model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  name         String
  username     String   @unique
  email        String   @unique
  passwordHash String
  role         Role     @default(ADMIN)
  isActive     Boolean  @default(true)
  avatarUrl    String?
  bio          String?
  website      String?  // e.g. https://raselrana.com.bd
  socialLinks  Json?    // { linkedin, github, facebook, x }
  posts        Post[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Category {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0)
  posts       Post[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  slug      String   @unique
  postIds   String[] @db.ObjectId
  posts     Post[]   @relation(fields: [postIds], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id               String      @id @default(auto()) @map("_id") @db.ObjectId
  title            String
  slug             String      @unique
  previousSlugs    String[]    // old slugs; 301-redirect to the current slug
  excerpt          String
  content          String      // Markdown/MDX source
  contentType      ContentType @default(EXPLAINER)
  status           PostStatus  @default(DRAFT)

  // Images
  featuredImage    Json?       // { url, publicId, width, height, alt }

  // Relations
  authorId         String      @db.ObjectId
  author           User        @relation(fields: [authorId], references: [id])
  categoryId       String      @db.ObjectId
  category         Category    @relation(fields: [categoryId], references: [id])
  tagIds           String[]    @db.ObjectId
  tags             Tag[]       @relation(fields: [tagIds], references: [id])
  relatedPostIds   String[]    @db.ObjectId // manual picks; no Prisma relation

  // Dates
  publishedAt      DateTime?   // set on publish; future date + SCHEDULED = scheduled
  contentUpdatedAt DateTime?   // "Last updated" shown to readers; set only on a significant update

  // Derived
  readingTime      Int         @default(1) // minutes, computed on save

  // SEO
  seoTitle         String?
  seoDescription   String?
  ogImageUrl       String?
  canonicalUrl     String?
  noindex          Boolean     @default(false)

  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt // technical edit time; NOT shown to readers

  @@index([status, publishedAt])
  @@index([categoryId, status, publishedAt])
  @@index([contentType, status, publishedAt])
  @@index([previousSlugs])
}

model LoginAttempt {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  key       String   // email + ":" + ip
  success   Boolean
  createdAt DateTime @default(now())

  @@index([key, createdAt])
}
```

### Notes

- **Not included on purpose:** comments, reactions, newsletter, views and media collections. Add these only when their features are built (section 10).
- **Large images** go to Cloudinary. Store only the URL, `publicId`, dimensions and alt text.
- **Two update dates:** `updatedAt` changes on every save. `contentUpdatedAt` changes only when the author ticks "Significant update", and only that one is shown to readers and used in JSON-LD `dateModified`.

---

## 6. Shared business rules

### 6.1 What counts as "live"

A post is publicly visible when **both** of these are true:
- `status` is `PUBLISHED`, or it is `SCHEDULED` with `publishedAt <= now`.
- `noindex` does not hide it from listings. (Noindex posts are reachable by URL, but excluded from listings, the sitemap and search.)

Put this rule in **one helper**, e.g. `src/services/posts/queries.js` → `livePostWhere()`, and use it in every public query, the sitemap, RSS and search.

**Scheduling needs no cron job.** Public listing pages use time-based revalidation (e.g. `export const revalidate = 300`), so scheduled posts appear within minutes of their publish time. Publish and update actions also call on-demand revalidation for the affected pages.

### 6.2 Slugs

- Auto-generate the slug from the title (lowercase, hyphens, ASCII only). It stays editable.
- The slug must be unique. Validate on save and show an inline error.
- **When a published post's slug changes:**
  - Push the old slug into `previousSlugs`.
  - Warn the author in the UI.
- **Article page lookup:**
  - Find the post by `slug`.
  - If not found, find it by `previousSlugs` and `permanentRedirect` to the current slug.
  - Otherwise return `notFound()`.

### 6.3 Derived fields (computed on every save, server-side)

- `readingTime`: word count of the content without code blocks, divided by 200, rounded up, minimum 1.
- `excerpt`: if left empty, fill it from the first paragraph (about 160 characters).
- **Publishing:**
  - Moving to `PUBLISHED` with no `publishedAt` sets it to `now`.
  - `SCHEDULED` requires a future `publishedAt`.

### 6.4 Validation

- Validate every server action with **zod**. Install it only if it is not already present.
- Required to **publish or schedule** (drafts may be incomplete):
  - title
  - slug
  - excerpt
  - category
  - content type
  - content
  - featured image **with alt text**
- Length limits:
  - `seoTitle` ≤ 60 characters
  - `seoDescription` ≤ 160 characters
  - excerpt ≤ 300 characters

### 6.5 Permissions (prepared for guest authors)

Create `src/lib/authz.js` with these helpers:
- `requireUser()`: logged in and `isActive`.
- `requireRole('ADMIN')`
- `canEditPost(user, post)`: `ADMIN` can edit any post. `AUTHOR` can edit only their own posts, and only when the post is not `PUBLISHED`.

**Every admin server action and route handler must call these.** `proxy.js` protecting `/admin` is not enough on its own, because server actions can be called directly.

Rules:
- Only `ADMIN` may publish, schedule, archive, or manage categories and tags.
- Nothing in the UI needs to handle `AUTHOR` yet. The checks just need to exist.

### 6.6 Login rate limiting

- In the Credentials `authorize` step, record a `LoginAttempt`.
- Block after **5 failed attempts in 15 minutes** for the same email + IP. Return a generic error that does not reveal whether the email exists.
- Delete attempts older than 24 hours, opportunistically on each login.

### 6.7 Revalidation after admin writes

When a post is saved, published, archived or deleted, revalidate:
- the article page
- the blog home page
- its category page
- its content-type hub
- its tag pages
- the sitemap

If the slug changed, also revalidate the old slug's page.

---

## 7. Admin dashboard: launch scope

All admin routes are under `src/app/admin/` (served at `/blog/admin`).

**Layout:**
- Sidebar: Overview, Posts, New post, Categories, Tags, Profile, View site, Log out.
- Mobile-friendly with a collapsible sidebar.
- Every admin page sets `robots: noindex, nofollow`.

### 7.1 Login (`/admin/login`)

**Probably exists; check it first.** It needs:
- an email/password form
- error states
- the rate limiting from 6.6
- a redirect to `/admin` after login

### 7.2 Overview (`/admin`)

- **Count cards:** Drafts, Scheduled, Published, Archived.
- **Recently edited:** the last 5 posts by `updatedAt`, each with status and an edit link.
- **Upcoming scheduled:** the next 5 scheduled posts.
- **Needs review:** published posts whose `contentUpdatedAt ?? publishedAt` is more than 12 months old, oldest first. This is important for keeping technical content accurate.

### 7.3 Posts list (`/admin/posts`)

- **Table columns:** title, category, content type, status badge, published/scheduled date, last edited.
- **Filters:** status, category, content type. **Search:** by title.
- **Pagination:** 20 per page.
- **Row actions:**
  - Edit
  - Preview
  - View live (published posts only)
  - Duplicate (creates a draft titled "Copy of …" with a new slug)
  - Archive / Unarchive
  - Delete (**only for drafts that were never published**, with a confirmation dialog)

### 7.4 Post editor (`/admin/posts/new`, `/admin/posts/[id]/edit`)

This is the most important screen.

**Layout:**
- Desktop: Markdown editor on the left, preview on the right, metadata in a collapsible sidebar or drawer.
- Mobile: tabs for Write / Preview / Settings.

**Editor:**
- A code-style Markdown editor with syntax highlighting, line wrapping and a monospace font. CodeMirror 6 via `@uiw/react-codemirror` with the markdown language is a good fit. Use an installed editor if one already exists.
- Toolbar buttons that insert Markdown/MDX snippets:
  - H2, H3, bold, italic, link
  - Code block (with a language prompt)
  - Table template
  - Callout (note/tip/warning, using whatever callout component the renderer supports)
  - Image upload (see 7.4.1)
- Keyboard shortcuts: Ctrl+S to save, Ctrl+B for bold, Ctrl+I for italic.

**Live preview:**
- The preview **must use the same rendering pipeline as the public article page**: the same MDX components, `rehype-pretty-code` and heading IDs. This way code blocks, tables and callouts look exactly as readers will see them.
- Recommended approach:
  - The preview panel is an iframe of `/blog/preview/[id]`.
  - It reloads after each autosave, keeping the scroll position if practical.
  - This guarantees the same rendering with no duplicate renderer.
- For a new, never-saved post, the first autosave creates the draft so the preview has an `id`.

**Autosave:**
- Debounce: save 3 seconds after the last keystroke, drafts only.
- Show "Saving… / Saved at 18:42 / Save failed".
- Autosave **never publishes**. For published posts, autosave is disabled and the author saves explicitly with "Update".
- Warn before leaving the page with unsaved changes.

**Settings sidebar fields:**

| Field | Behavior |
|---|---|
| Title | Required |
| Slug | Auto from title until manually edited. Uniqueness check. Shows the warning from 6.2 when published. |
| Excerpt | Character counter |
| Category | Select, required |
| Content type | Select, required |
| Tags | Multi-select with search. Typing a new name and pressing Enter creates the tag. |
| Featured image | Upload or replace, preview, **alt text required** |
| Status | Draft / Scheduled / Published / Archived |
| Publish date | Date-time picker; required and in the future for Scheduled. Display in Asia/Dhaka time, store in UTC. |
| Significant update | Checkbox, shown only for published posts. When ticked on Update, sets `contentUpdatedAt = now`. |
| Related posts | Optional search-and-pick, up to 4 |
| SEO title / description | Counters (60 / 160). Placeholders show the fallback (title / excerpt). |
| OG image URL | Optional override. Default is the featured image. |
| Canonical URL | Optional. Default is the article's own URL. |
| Noindex | Checkbox |

**Action buttons:** Save draft · Preview (opens a new tab) · Publish / Schedule / Update (label depends on state) · Archive.

**Pre-publish checklist.** This runs when you click Publish/Schedule/Update and shows a panel.
- **Blocking errors:**
  - missing required fields (6.4)
  - featured image without alt text
  - slug already taken
- **Warnings** (allowed to continue):
  - no meta description
  - content has no H2 heading
  - fewer than 3 tags
  - any inline image without alt text (`![](...)`)
  - fewer than ~300 words

#### 7.4.1 Image upload (Cloudinary)

- Use **signed direct uploads**:
  - A server action, protected by `requireUser()`, returns a signature.
  - The browser uploads straight to Cloudinary.
  - Do not stream files through Vercel functions.
- Allowed formats: jpg, png, webp, gif, svg. **Sanitize SVG or reject it** if the renderer inlines it. Maximum size 5 MB.
- Folder: `blog/posts/<post-id>/`.
- For inline images:
  - After upload, prompt for alt text and an optional caption.
  - Insert `![alt](url)` at the cursor, or the image/figure MDX component if one exists.
- Featured images store `{ url, publicId, width, height, alt }`.

#### 7.4.2 MDX safety note

MDX can execute JavaScript expressions. This is acceptable while only the owner writes. **Before guest authors are enabled:**
- render with JS expressions disabled (e.g. `next-mdx-remote` with `blockJS`/`blockDangerousJS`, or the equivalent in the current renderer), and
- allow only a fixed list of MDX components.

Note this in the code with a `TODO(guest-authors)` comment.

### 7.5 Draft preview route (`/preview/[id]`)

- Accessible only to logged-in users who can edit the post. Everyone else gets `notFound()`.
- Renders any status with the public article component.
- Shows a "Preview — not published" banner.
- Sets `noindex` and is never cached: `dynamic = 'force-dynamic'`.

### 7.6 Categories (`/admin/categories`)

- **List:** name, slug, post count, sort order.
- **Create/edit form:** name, slug (auto-generated, editable), description, sort order.
- **Reorder:** up/down buttons are enough. No drag-and-drop needed.
- **Delete:** only allowed when the category has 0 posts. Otherwise show "Move posts first".
- After a change, revalidate the category page and the navigation.

### 7.7 Tags (`/admin/tags`)

- **List:** name, slug, post count. Searchable and paginated.
- **Rename:** name and slug.
- **Merge:**
  - Pick a source tag and a target tag.
  - Every post with the source tag gets the target tag instead, with no duplicates.
  - Delete the source tag.
  - Show a confirmation with the number of affected posts.
- **Delete unused tags:** delete one, or bulk-delete all tags with 0 posts.

### 7.8 Profile (`/admin/profile`)

- **Edit:** name, username, avatar (Cloudinary upload), bio, website, social links.
- **Change password:** current password, new password and confirmation. Minimum 12 characters, bcrypt.
- These fields feed the author box on articles and the `/author/[username]` page.

---

## 8. Public side: what categories and types need

**Check what exists first.** Build only what is missing.

### Article page

- Shows its category as a link and its content type as a badge.
- Shows tags as links.
- Shows "Published …" and, if `contentUpdatedAt` is set, "Last updated …".
- Shows the reading time and the author box.

### Listing pages

Applies to `/category/[slug]`, `/type/[type]`, `/tag/[slug]` and `/author/[username]`:
- Use `livePostWhere()`.
- Paginate.
- Each has its own `<title>`, meta description and canonical URL.
- A category page can be filtered by content type with chips, e.g. `?type=troubleshooting`.

### Navigation

- The main blog nav lists the 6 categories in `sortOrder`.
- Show a "Troubleshooting" hub link prominently, since it is a high-intent search topic.

### Related posts

1. Show manual `relatedPostIds` first.
2. Fill the rest with posts that share tags (more shared tags ranks higher).
3. Then fill with posts from the same category.
4. Live posts only, up to 4 in total.

### Sitemap and RSS

- Include live, indexable articles, category pages, type hubs and tag pages that have at least 2 posts.
- `lastModified` = `contentUpdatedAt ?? publishedAt`.

### JSON-LD

Articles use `TechArticle` (or `BlogPosting`) with:
- `datePublished` = `publishedAt`
- `dateModified` = `contentUpdatedAt ?? publishedAt`
- the author, linked to raselrana.com.bd

---

## 9. Security checklist (applies to everything above)

- Every admin server action calls `requireUser()` or `requireRole()` (6.5) and validates input with zod.
- Admin pages and the preview route are `noindex` and never statically cached.
- No secrets in client components. Use `NEXT_PUBLIC_` only for values that are truly public.
- Cloudinary signing happens server-side. The API secret never reaches the browser.
- Error messages shown to users never leak stack traces or DB details.
- `.env.example` lists every variable without its value.

---

## 10. Out of scope for now (do NOT build)

These are planned for later phases. Don't create models, fields, counters or UI for them yet.

- Comments and moderation queue
- Helpful / Not-helpful feedback and likes
- Newsletter and subscribers
- View counts and the analytics dashboard (use Vercel Analytics and Search Console for now)
- Media library page (inline upload is enough at launch)
- Author management UI, invitations and the "In review" workflow
- Bookmarks, user accounts for readers
- Technical tools/calculators (they will be built as code pages, not in the CMS)
- Bengali translations

---

## 11. Build order

Each step should be one working, testable unit. **Skip steps the audit marks ✅.**

| # | Item | Depends on |
|---|---|---|
| 1 | Audit and report (section 1) | none |
| 2 | Prisma schema merge + `prisma generate` + `prisma db push` (non-destructive) | 1 |
| 3 | `content-types.js`, `seed-categories.js`, run the seed | 2 |
| 4 | `authz.js` helpers + login rate limiting | 2 |
| 5 | Post query helpers: `livePostWhere`, slug utilities, readingTime, revalidation helper | 2 |
| 6 | Admin layout + sidebar + Overview page | 4, 5 |
| 7 | Posts list page | 6 |
| 8 | Cloudinary signed upload action + upload component | 4 |
| 9 | Post editor: fields, validation, save draft, slug logic | 7, 8 |
| 10 | Preview route + live preview iframe + autosave | 9 |
| 11 | Publish / schedule / update / archive + pre-publish checklist + revalidation | 10 |
| 12 | Categories admin page | 6 |
| 13 | Tags admin page (incl. merge) | 6 |
| 14 | Profile page | 6, 8 |
| 15 | Public: category / type / tag / author pages + nav + related posts | 5 |
| 16 | Public: old-slug redirects, sitemap/RSS/JSON-LD updates | 5, 15 |
| 17 | Final pass: security checklist (section 9) + acceptance tests (section 13) | all |

---

## 12. Progress table (Claude Code keeps this updated)

Statuses below are from the audit of 2026-10-09 and are updated as steps are built.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Audit | ✅ | Done 2026-10-09. Conflicts and decisions are recorded in section 2. |
| 2 | Prisma schema | ✅ | Merged and pushed 2026-10-09. The one existing post and the admin user were converted in place (old fields left on the documents). `categoryId` optional, `excerpt` defaults to empty, `showOnMainSite` added (section 2). |
| 3 | Content types + category seed | ✅ | `src/lib/content-types.js`, `src/scripts/seed-categories.js`, `npm run seed:categories`. Seed run; six categories exist. |
| 4 | Authz + rate limiting | ✅ | `src/lib/authz.js`, `src/lib/login-rate-limit.js`; every write handler goes through `src/lib/require-admin.js`. Tested: 6th attempt blocked, inactive user locked out. |
| 5 | Query helpers | ✅ | `livePostWhere` / `listedPostWhere` in `queries.js`, `slugs.js`, `revalidate.js`, zod validation, stored `readingTime`. The old-slug redirect itself is step 16. |
| 6 | Admin layout + Overview | ✅ | Sidebar (collapsible on phones), Overview with counts, recently edited, upcoming scheduled and needs review. Login moved to `/admin/login`; old admin addresses redirect. Categories / Tags / Profile links are added to the sidebar with steps 12–14. |
| 7 | Posts list | ✅ | `/admin/posts`: table, filters, title search, 20 per page, Edit, Preview, View live, Duplicate, Archive / Unarchive, Delete (never-published drafts only). |
| 8 | Cloudinary upload | ✅ | Signed direct uploads: `signImageUpload` server action (`src/services/uploads/actions.js`) + `src/lib/upload-client.js`. Folder `<UPLOAD_FOLDER>/posts/<post-id>/` (`unassigned` before the first save), 5 MB, SVG rejected. Inline images ask for alt text and an optional caption. `/api/upload` is removed. |
| 9 | Post editor (save) | ✅ | CodeMirror editor with toolbar (H2, H3, bold, italic, link, code, table, callout, image, gallery, video) and Ctrl+S / B / I. All settings fields incl. SEO, related posts (a pick list, not a search box), publish date in Dhaka time, noindex, "Show on main site". zod validation on the server. |
| 10 | Preview + autosave | ✅ | `/preview/[id]` (editors only, noindex, never cached) shares `PostArticle` with the public page. Drafts autosave 3 s after the last change; the first autosave creates the draft. The in-editor preview stays instant (same renderer) instead of an iframe, by decision. Leaving with unsaved changes warns. |
| 11 | Publish flow + checklist | ✅ | Publish / Schedule / Update / Unpublish / Archive, significant update, pre-publish checklist with blocking errors (incl. slug taken) and warnings, targeted revalidation. |
| 12 | Categories admin | ✅ | `/admin/categories`: list with post counts, add / edit, up / down, delete only when empty ("Move posts first"). |
| 13 | Tags admin | ✅ | `/admin/tags`: search, paging, rename, merge with a confirmation step, delete one or all unused. |
| 14 | Profile | ✅ | `/admin/profile`: name, username, avatar, bio, website, social links; change password (12+ characters, bcrypt). |
| 15 | Public taxonomy pages | ✅ | `/category/[slug]` (with `?type=` chips), `/type/[type]`, `/tag/[slug]`, `/author/[username]`; articles at `/blog/<slug>`. Category row with a Troubleshooting link under the top bar. Related posts: manual picks, shared topics, same category (up to 4). `/tags` stays as the list of all topics. |
| 16 | Redirects + sitemap/RSS/JSON-LD | ✅ | Old slugs, `/posts/<slug>` and `/tags/<slug>` redirect permanently (308). `/blog/sitemap.xml` and `TechArticle` JSON-LD built. RSS is not built, by decision. |
| 17 | Final security + acceptance pass | ✅ | Section 9 checked: every write handler and server action checks the user and validates input; admin and preview are noindex and uncached; no server module is imported by client code; only `NEXT_PUBLIC_BASE_PATH` is public; `.env.example` lists every variable. Section 13 tested against a local production build, see the notes below the table. |

Notes on the acceptance tests (section 13), run 2026-10-09 against a local production build with a headless browser:

- All items passed, with these differences in wording: redirects are `308` (permanent, what Next.js sends) rather than `301`; a server action called while signed out answers with a redirect to the sign-in page and changes nothing.
- "A post scheduled 10 minutes ahead appears within ~5 minutes" was tested by moving a scheduled post's time into the past, not by waiting: it became public at once on the pages rendered per request (home, category, type, tag, article) and the API. The two cached pages, `/tags` and the sitemap, refresh at most every 5 minutes.
- Not testable locally: anything that needs both sites on one domain (see `docs/design-brief.md` section 10), and social networks fetching the share image.

---

## 13. Acceptance tests (check manually before marking 17 done)

### Access and security

- [ ] A logged-out visitor opening `/blog/admin` is redirected to `/blog/admin/login`.
- [ ] Calling an admin server action while logged out fails.
- [ ] The 6th wrong password within 15 minutes is blocked with a generic message.

### Editor and publishing

- [ ] A new post autosaves as a draft, and the preview shows highlighted code blocks identical to the live page.
- [ ] Publishing without featured-image alt text is blocked. Publishing without a meta description only warns.
- [ ] A post scheduled 10 minutes ahead is not public now, and appears in listings within ~5 minutes after its time with no manual action.

### Slugs and categories

- [ ] Changing a published post's slug makes the old URL 301-redirect to the new one.
- [ ] A category with posts can't be deleted. An empty one can.
- [ ] Merging tag `olt` into `gpon-olt` moves all posts, leaves no duplicates and removes `olt`.

### Public pages

- [ ] `/blog/type/troubleshooting` lists troubleshooting posts from every category.
- [ ] `/blog/category/gpon-fiber-optics?type=troubleshooting` filters correctly.
- [ ] "Last updated" appears only after a significant update, not after a typo fix.
- [ ] Admin and preview pages contain `noindex`. The sitemap contains no drafts, scheduled-future posts or noindex posts.
