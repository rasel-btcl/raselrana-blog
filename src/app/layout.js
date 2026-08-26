import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://raselrana.com.bd"),
  title: "Rasel Rana — Blog (Coming Soon)",
  description:
    "The technical blog of Rasel Rana, Manager (Technical) at BTCL and Electrical & Electronic Engineer. Currently under development.",
  openGraph: {
    title: "Rasel Rana — Blog",
    description: "Currently under development. Check back soon.",
    url: "https://raselrana.com.bd/blog",
    siteName: "Rasel Rana — Blog",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics
        /* this is for Vercel Analytics, you can remove it if you don&apos;t
        want analytics */
        />
      </body>
    </html>
  );
}
