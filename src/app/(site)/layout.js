import CategoryBar from "@/components/layout/CategoryBar";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <CategoryBar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
