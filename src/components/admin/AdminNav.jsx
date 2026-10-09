"use client";

import SignOutButton from "@/components/auth/sign-out-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Categories, Tags and Profile are added here as their pages are built
// (docs/BLOG_ADMIN_SPEC.md steps 12–14).
const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/posts", label: "Posts", exact: true },
  { href: "/admin/posts/new", label: "New post" },
  { href: "/", label: "View site", external: true },
];

function isActive(link, pathname) {
  if (link.external) return false;
  // "Posts" also covers a post being edited, but not "New post".
  if (link.href === "/admin/posts") {
    return (
      pathname === "/admin/posts" ||
      (pathname.startsWith("/admin/posts/") && pathname !== "/admin/posts/new")
    );
  }
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function NavList({ pathname, onNavigate }) {
  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const active = isActive(link, pathname);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--paper)] text-[var(--signal)]"
                  : "text-[var(--slate)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              {link.label}
              {link.external && <span aria-hidden> ↗</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Sidebar links: always open on wide screens, a collapsible menu on phones. */
export default function AdminNav() {
  const pathname = usePathname();
  const menuRef = useRef(null);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  useEffect(closeMenu, [pathname]);

  return (
    <>
      <nav aria-label="Admin" className="hidden px-3 py-2 lg:block">
        <NavList pathname={pathname} />
      </nav>

      <details
        ref={menuRef}
        className="border-t border-[var(--line)] lg:hidden"
      >
        <summary className="cursor-pointer px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
          Menu
        </summary>
        <nav aria-label="Admin" className="space-y-4 px-3 pb-4">
          <NavList pathname={pathname} onNavigate={closeMenu} />
          <div className="px-3">
            <SignOutButton />
          </div>
        </nav>
      </details>
    </>
  );
}
