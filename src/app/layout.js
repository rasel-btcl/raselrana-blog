import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata = {
  title: "Rasel Rana — Blog",
  description:
    "Notes on telecommunications, electrical and electronic engineering, and professional insights by Rasel Rana.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <header className="max-w-2xl mx-auto px-4 py-8 border-b border-gray-200">
          <a
            href="https://raselrana.com.bd"
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Rasel Rana
          </a>
          <h1 className="text-2xl font-semibold mt-2">Blog</h1>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>

        <footer className="max-w-2xl mx-auto px-4 py-8 border-t border-gray-200 text-sm text-gray-500">
          <p>Dhaka, Bangladesh</p>
        </footer>
        <Analytics /* this is for Vercel Analytics, you can remove it if you don&apos;t
        want analytics */
        />
      </body>
    </html>
  );
}
