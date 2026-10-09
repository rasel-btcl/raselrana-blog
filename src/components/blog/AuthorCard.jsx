import BrandMark from "@/components/brand/BrandMark";
import MainSiteLink from "@/components/layout/MainSiteLink";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { authorPath } from "@/lib/posts";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";
import Link from "next/link";

const DEFAULT_BIO =
  "Electrical and electronic engineer. I plan, build and keep telecommunications networks running, and write here about what that work teaches me.";

/**
 * The author box under a post. `author` is `{ name, username, bio, avatarUrl }`
 * (edited on the admin Profile page); without one it falls back to the site owner.
 * The two buttons are the natural way back to the main site.
 */
export default function AuthorCard({ author = null }) {
  const name = author?.name ?? "Rasel Rana";

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 md:flex-row md:items-center md:justify-between md:p-9">
      <div className="flex gap-5">
        {author?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- small fixed-size avatar; Cloudinary does the resizing
          <img
            src={cloudinaryUrl(author.avatarUrl, 160)}
            alt=""
            width={52}
            height={52}
            loading="lazy"
            className="h-[52px] w-[52px] shrink-0 rounded-full border border-[var(--line)] object-cover"
          />
        ) : (
          <BrandMark size={52} className="shrink-0" />
        )}
        <div>
          <p className="font-display text-xl font-medium text-[var(--ink)]">
            {author?.username ? (
              <Link
                href={authorPath(author.username)}
                className="transition-colors hover:text-[var(--signal)]"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-[var(--signal)]">
            Manager (Technical), BTCL
          </p>
          <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-relaxed text-[var(--slate)]">
            {author?.bio || DEFAULT_BIO}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <MainSiteLink href="/about" className={buttonPrimary}>
          More about me
        </MainSiteLink>
        <MainSiteLink href="/contact" className={buttonSecondary}>
          Get in touch
        </MainSiteLink>
      </div>
    </div>
  );
}
