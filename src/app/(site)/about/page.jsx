import BrandMark from "@/components/brand/BrandMark";
import MainSiteLink from "@/components/layout/MainSiteLink";
import {
  buttonPrimary,
  buttonSecondary,
  container,
  pageHeading,
  pageLabel,
} from "@/lib/ui";
import Link from "next/link";

export const metadata = {
  title: "About the author",
  description:
    "Rasel Rana is an electrical and electronic engineer and Manager (Technical) at BTCL.",
};

export default function AboutPage() {
  return (
    <>
      <section className={`${container} py-16 md:py-20`}>
        <p className={`${pageLabel} rise`}>
          <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
          About the author
        </p>
        <h1
          className={`${pageHeading} rise mt-6`}
          style={{ "--delay": "80ms" }}
        >
          Rasel Rana
        </h1>
        <p
          className="rise mt-5 font-mono text-xs uppercase tracking-[0.2em] text-[var(--signal)]"
          style={{ "--delay": "160ms" }}
        >
          Manager (Technical), BTCL
        </p>
      </section>

      <section className="border-t border-[var(--line)]">
        <div
          className={`${container} grid gap-10 py-16 md:grid-cols-[auto_1fr] md:gap-14 md:py-20`}
        >
          <BrandMark size={88} />
          <div className="max-w-2xl">
            <div className="space-y-5 text-lg leading-relaxed text-[var(--ink)]">
              <p>
                I am an electrical and electronic engineer working at
                Bangladesh Telecommunications Company Limited (BTCL), where I
                plan, build and keep telecommunications networks running.
              </p>
              <p className="text-[var(--slate)]">
                This blog is where I write down what that work teaches me:
                telecom infrastructure, power systems, networking, software
                and the engineering decisions that connect them.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <MainSiteLink href="/about" className={buttonPrimary}>
                More about me
              </MainSiteLink>
              <MainSiteLink href="/contact" className={buttonSecondary}>
                Get in touch
              </MainSiteLink>
            </div>

            <p className="mt-9 text-sm text-[var(--slate)]">
              Or start with the{" "}
              <Link
                href="/"
                className="text-[var(--signal)] underline underline-offset-4"
              >
                latest posts
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
