import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        {/* Desktop: left padding for sidebar. Mobile: no left padding, bottom padding for bottom nav */}
        <div className="lg:pl-64 pb-20 lg:pb-0">
          <Header />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
