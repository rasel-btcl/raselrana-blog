import SignOutButton from "@/components/auth/sign-out-button";
import BrandMark from "@/components/brand/BrandMark";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { auth } from "@/lib/auth";
import AuthProvider from "@/providers/auth-provider";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: { default: "Admin", template: "%s — Blog admin" },
  robots: { index: false, follow: false },
};

const navLink =
  "text-sm font-medium text-[var(--slate)] transition-colors hover:text-[var(--ink)]";

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AuthProvider>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-[var(--ink)]"
          >
            <BrandMark />
            <span>Blog admin</span>
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-5">
            <Link href="/admin/dashboard" className={navLink}>
              Posts
            </Link>
            <Link href="/admin/new-post" className={navLink}>
              New post
            </Link>
            <Link href="/" className={navLink}>
              View blog
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </AuthProvider>
  );
}
