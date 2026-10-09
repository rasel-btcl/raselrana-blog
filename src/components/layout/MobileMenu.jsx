"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Phone menu. A <details> element, so it opens without JavaScript;
 * the script part only closes it again after a link is followed.
 */
export default function MobileMenu({ links }) {
  const ref = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details ref={ref} className="group md:hidden">
      <summary
        aria-label="Menu"
        className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)] [&::-webkit-details-marker]:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </summary>

      <nav
        aria-label="Blog"
        className="absolute inset-x-0 top-16 border-b border-[var(--line)] bg-[var(--paper)]"
      >
        <ul className="mx-auto max-w-6xl px-6 py-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => {
                  if (ref.current) ref.current.open = false;
                }}
                className="block py-3 text-base font-medium text-[var(--ink)] transition-colors hover:text-[var(--signal)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
