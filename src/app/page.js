export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6">
      <div className="w-full max-w-xl space-y-8 text-center">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-sm text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          Under Development
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Rasel Rana — Blog
          </h1>

          <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
            A technical blog by Rasel Rana — Manager (Technical) at BTCL,
            Electrical &amp; Electronic Engineer. Currently being built.
            In-depth posts on engineering, technology, and systems are on the
            way.
          </p>
        </div>

        <div className="mx-auto h-px w-16 bg-slate-800" />

        {/* Links */}
        <div className="flex flex-col items-center justify-center gap-3 text-sm sm:flex-row">
          <a
            href="https://raselrana.com.bd"
            className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-slate-300"
          >
            Visit main site
          </a>

          <span className="hidden text-slate-700 sm:inline">•</span>

          <a
            href="mailto:contact@raselrana.com.bd"
            className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-slate-300"
          >
            contact@raselrana.com.bd
          </a>
        </div>

        <p className="pt-6 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Rasel Rana. All rights reserved.
        </p>
      </div>
    </main>
  );
}
