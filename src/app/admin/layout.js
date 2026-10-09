import AuthProvider from "@/providers/auth-provider";

// Shared by the sign-in page and the panel. The panel's own layout
// (admin/(panel)/layout.js) adds the access check and the sidebar.
export const metadata = {
  title: { default: "Admin", template: "%s — Blog admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
