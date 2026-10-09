import { SITE_URL } from "@/lib/posts";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { plexMono, plexSans, spaceGrotesk } from "./fonts";
import "./globals.css";

const description =
  "Writing by Rasel Rana, Manager (Technical) at BTCL, on telecommunications, electrical engineering and the systems behind them.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Blog — Rasel Rana",
    template: "%s — Rasel Rana",
  },
  description,
  openGraph: {
    title: "Blog — Rasel Rana",
    description,
    url: "/blog",
    siteName: "Rasel Rana",
    type: "website",
  },
  // Hidden from search engines until BLOG_INDEXABLE=true is set at launch.
  robots:
    process.env.BLOG_INDEXABLE === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="bg-[var(--paper)] font-body text-[var(--ink)]">
        {/* Same settings and storage key as the main site, so the chosen theme carries over. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
