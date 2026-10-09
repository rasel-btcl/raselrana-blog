import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/auth/sign-out-button";
import BrandMark from "@/components/brand/BrandMark";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { getCurrentUser } from "@/lib/authz";
import Link from "next/link";
import { redirect } from "next/navigation";

// Signed-in pages are personal and must never be served from a cache.
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }) {
  // Reads the user from the database, so a disabled account is locked out at once.
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)] lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col lg:overflow-y-auto">
          <div className="flex h-16 items-center justify-between gap-3 px-6">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-[var(--ink)]"
            >
              <BrandMark />
              <span>Blog admin</span>
            </Link>
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
          </div>

          <AdminNav />

          <div className="mt-auto hidden space-y-4 border-t border-[var(--line)] p-6 lg:block">
            <p className="break-words text-xs text-[var(--slate)]">
              Signed in as
              <span className="block font-medium text-[var(--ink)]">
                {user.name}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <SignOutButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-6 py-10 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
