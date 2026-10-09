import { parsePage } from "@/components/blog/ListingHeader";
import PostListing from "@/components/blog/PostListing";
import BrandMark from "@/components/brand/BrandMark";
import MainSiteLink from "@/components/layout/MainSiteLink";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { authorPath, BLOG_URL } from "@/lib/posts";
import {
  buttonPrimary,
  buttonSecondary,
  container,
  pageHeading,
  pageLabel,
  sectionHeading,
} from "@/lib/ui";
import { getAuthorByUsername, getPublishedPosts } from "@/services/posts/queries";
import { notFound } from "next/navigation";

const SOCIAL_LABELS = {
  linkedin: "LinkedIn",
  github: "GitHub",
  facebook: "Facebook",
  x: "X",
};

export async function generateMetadata({ params }) {
  const author = await getAuthorByUsername((await params).username);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio ?? `Posts by ${author.name} on Rasel Rana's blog.`,
    alternates: { canonical: `${BLOG_URL}${authorPath(author.username)}` },
  };
}

export default async function AuthorPage({ params, searchParams }) {
  const { username } = await params;
  const page = parsePage((await searchParams).page);

  const author = await getAuthorByUsername(username);
  if (!author) notFound();

  const { posts, total, totalPages } = await getPublishedPosts({
    page,
    authorId: author.id,
  });

  // Only https links saved on the Profile page are shown.
  const links = [
    ...(author.website ? [{ label: "Website", href: author.website }] : []),
    ...Object.entries(SOCIAL_LABELS)
      .map(([key, label]) => ({ label, href: author.socialLinks?.[key] }))
      .filter((link) => typeof link.href === "string" && link.href.startsWith("https://")),
  ];
  const base = authorPath(author.username);

  return (
    <>
      <section className={`${container} py-16 md:py-20`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          Author
        </p>
        <div
          className="rise mt-6 flex flex-wrap items-center gap-6"
          style={{ "--delay": "80ms" }}
        >
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- fixed-size avatar; Cloudinary does the resizing
            <img
              src={cloudinaryUrl(author.avatarUrl, 240)}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border border-[var(--line)] object-cover"
            />
          ) : (
            <BrandMark size={96} />
          )}
          <h1 className={pageHeading}>{author.name}</h1>
        </div>
        {author.bio && (
          <p
            className="rise mt-8 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[var(--slate)]"
            style={{ "--delay": "160ms" }}
          >
            {author.bio}
          </p>
        )}

        <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--delay": "220ms" }}>
          <MainSiteLink href="/about" className={buttonPrimary}>
            More about me
          </MainSiteLink>
          <MainSiteLink href="/contact" className={buttonSecondary}>
            Get in touch
          </MainSiteLink>
        </div>

        {links.length > 0 && (
          <ul className="rise mt-6 flex flex-wrap gap-x-6 gap-y-2" style={{ "--delay": "260ms" }}>
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="text-sm text-[var(--signal)] underline underline-offset-4"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-[var(--line)]">
        <div className={`${container} py-16 md:py-20`}>
          <h2 className={`${sectionHeading} mb-8`}>
            {total} {total === 1 ? "post" : "posts"}
          </h2>
          <PostListing
            posts={posts}
            page={page}
            totalPages={totalPages}
            hrefFor={(n) => (n > 1 ? `${base}?page=${n}` : base)}
            empty="No posts yet."
          />
        </div>
      </section>
    </>
  );
}
