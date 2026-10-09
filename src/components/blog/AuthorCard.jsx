import BrandMark from "@/components/brand/BrandMark";
import MainSiteLink from "@/components/layout/MainSiteLink";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

export default function AuthorCard() {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 md:flex-row md:items-center md:justify-between md:p-9">
      <div className="flex gap-5">
        <BrandMark size={52} className="shrink-0" />
        <div>
          <p className="font-display text-xl font-medium text-[var(--ink)]">
            Rasel Rana
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-[var(--signal)]">
            Manager (Technical), BTCL
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--slate)]">
            Electrical and electronic engineer. I plan, build and keep
            telecommunications networks running, and write here about what
            that work teaches me.
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
