import { container, pageHeading, pageLabel } from "@/lib/ui";

/** The top of a listing page: small label, big title, optional description and extras. */
export default function ListingHeader({ label, title, description, count, children }) {
  return (
    <section className={`${container} py-16 md:py-20`}>
      <p className={`${pageLabel} rise`}>
        <span aria-hidden className="h-px w-10 bg-[var(--signal)]" />
        {label}
      </p>
      <h1 className={`${pageHeading} rise mt-6`} style={{ "--delay": "80ms" }}>
        {title}
      </h1>
      {description && (
        <p
          className="rise mt-6 max-w-2xl text-lg leading-relaxed text-[var(--slate)]"
          style={{ "--delay": "160ms" }}
        >
          {description}
        </p>
      )}
      {count != null && (
        <p
          className="rise mt-5 font-mono text-xs text-[var(--slate)]"
          style={{ "--delay": "200ms" }}
        >
          {count} {count === 1 ? "post" : "posts"}
        </p>
      )}
      {children}
    </section>
  );
}

export function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
