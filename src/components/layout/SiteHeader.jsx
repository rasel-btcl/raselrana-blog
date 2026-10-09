import BrandMark from "@/components/brand/BrandMark";
import Link from "next/link";
import MainSiteLink from "./MainSiteLink";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Posts" },
  { href: "/tags", label: "Topics" },
  { href: "/about", label: "About the author" },
];

export default function SiteHeader() {
  return (
    // Same height and look as the main site's bar, so it does not jump between the two.
    <header className="sticky top-0 z-50 h-16 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <MainSiteLink
            href="/"
            title="Back to raselrana.com.bd"
            className="flex shrink-0 items-center gap-2.5 font-display text-base font-semibold tracking-tight text-[var(--ink)]"
          >
            <BrandMark />
            <span>Rasel Rana</span>
          </MainSiteLink>
          <span aria-hidden className="h-5 w-px bg-[var(--line)]" />
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--signal)]"
          >
            Blog
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-7">
          <nav aria-label="Blog" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--slate)] transition-colors hover:text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
          <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}
