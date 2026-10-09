import AuthProvider from "@/providers/auth-provider";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
