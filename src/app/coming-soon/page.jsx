import MainSiteLink from "@/components/layout/MainSiteLink";
import {
  buttonPrimary,
  buttonSecondary,
  container,
  pageHeading,
  pageLabel,
} from "@/lib/ui";

export const metadata = {
  title: "Coming soon",
  description:
    "The blog of Rasel Rana is being prepared. Writing on telecommunications and electrical engineering will appear here soon.",
  robots: { index: false, follow: false },
};

// Shown for every public address while COMING_SOON is on (see src/proxy.js).
// No menu or footer on purpose: their links lead to pages that are not open yet.
export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center">
      <section className={`${container} w-full py-20 md:py-24`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          Blog
          <span aria-hidden>·</span>
          <span className="flex items-center gap-2 text-[var(--signal)]">
            <span
              aria-hidden
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--pulse)]"
            />
            In preparation
          </span>
        </p>
        <h1
          className={`${pageHeading} rise mt-6`}
          style={{ "--delay": "80ms" }}
        >
          Coming soon
        </h1>
        <p
          className="rise mt-6 max-w-xl text-lg leading-relaxed text-[var(--slate)]"
          style={{ "--delay": "160ms" }}
        >
          I am preparing this blog. Explainers, how-to guides and
          troubleshooting notes on telecommunications, fiber networks and
          electrical engineering will be published here soon.
        </p>
        <div
          className="rise mt-9 flex flex-wrap gap-3"
          style={{ "--delay": "240ms" }}
        >
          <MainSiteLink href="/" className={buttonPrimary}>
            Visit the main site
          </MainSiteLink>
          <MainSiteLink href="/contact" className={buttonSecondary}>
            Contact
          </MainSiteLink>
        </div>
        <p
          className="rise mt-16 font-mono text-xs text-[var(--slate)]"
          style={{ "--delay": "320ms" }}
        >
          Rasel Rana · raselrana.com.bd/blog
        </p>
      </section>
    </main>
  );
}
