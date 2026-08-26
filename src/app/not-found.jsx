"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-xl space-y-8 text-center">
        {/* Error Code */}
        <div>
          <p className="text-7xl font-bold tracking-tight text-slate-700">
            404
          </p>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Page Not Found
          </h1>

          <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
            Sorry, the page you are looking for does not exist or may have been
            moved.
          </p>
        </div>

        <div className="mx-auto h-px w-16 bg-slate-800" />

        {/* Navigation */}
        <div className="flex flex-col items-center justify-center gap-3 text-sm sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-slate-100 px-5 py-2.5 font-medium text-slate-900 transition-colors hover:bg-white"
          >
            Go to Homepage
          </Link>

          <button
            type="button"
            onClick={() => {
              window.location.href = "https://raselrana.com.bd";
            }}
            className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-slate-300"
          >
            Visit main site
          </button>
        </div>

        {/* Footer */}
        <p className="pt-6 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Rasel Rana. All rights reserved.
        </p>
      </div>
    </main>
  );
}
