import SignOutButton from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const [totalPosts, publishedPosts, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, published: true, createdAt: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Blog Admin</h1>
            <p className="text-sm text-gray-500">
              Signed in as {session?.user?.name ?? session?.user?.email}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total posts</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {totalPosts}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Published</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {publishedPosts}
            </p>
          </div>
          <Link
            href="/admin/new-post"
            className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900"
          >
            + New post
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-gray-700">
            Recent posts
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {recentPosts.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No posts yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentPosts.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {post.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.published
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
