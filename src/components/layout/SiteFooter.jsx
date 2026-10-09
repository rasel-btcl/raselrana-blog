import BrandMark from "@/components/brand/BrandMark";
import Link from "next/link";
import MainSiteLink from "./MainSiteLink";

const blogLinks = [
  { href: "/", label: "Posts" },
  { href: "/tags", label: "Topics" },
];

const mainSiteLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/achievements", label: "Achievements" },
  { href: "/contact", label: "Contact" },
];

const heading =
  "font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]";
const link =
  "text-sm text-[var(--ink)] transition-colors hover:text-[var(--signal)]";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <MainSiteLink
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-[var(--ink)]"
            >
              <BrandMark />
              <span>Rasel Rana</span>
            </MainSiteLink>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--slate)]">
              Manager (Technical), BTCL — writing and building at the
              intersection of telecommunications and electrical engineering.
            </p>
          </div>

          <nav aria-label="Blog pages">
            <p className={heading}>Blog</p>
            <ul className="mt-4 space-y-2.5">
              {blogLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Main site">
            <p className={heading}>Rasel Rana</p>
            <ul className="mt-4 space-y-2.5">
              {mainSiteLinks.map((item) => (
                <li key={item.href}>
                  <MainSiteLink href={item.href} className={link}>
                    {item.label}
                  </MainSiteLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-[var(--line)] pt-6 font-mono text-xs text-[var(--slate)]">
          © {new Date().getFullYear()} Rasel Rana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
