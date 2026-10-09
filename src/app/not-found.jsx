import MainSiteLink from "@/components/layout/MainSiteLink";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  buttonPrimary,
  buttonSecondary,
  container,
  pageHeading,
  pageLabel,
} from "@/lib/ui";
import Link from "next/link";

export const metadata = { title: "Page not found" };

// Lives outside the (site) group, so it brings the menu and footer itself.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className={`${container} py-20 md:py-24`}>
          <p className={pageLabel}>
            <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
            Error 404
          </p>
          <h1 className={`${pageHeading} mt-6`}>Page not found</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--slate)]">
            The page you are looking for does not exist or may have been
            moved.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className={buttonPrimary}>
              Go to the blog
            </Link>
            <MainSiteLink href="/" className={buttonSecondary}>
              Visit the main site
            </MainSiteLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
