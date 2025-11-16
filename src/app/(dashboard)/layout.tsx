// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
// --- START OF FIX ---
// Changed the import path from local component to the package "sonner"
import { Toaster } from "sonner";
// --- END OF FIX ---

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Desktop Sidebar: Hidden on small screens, visible on large */}
      <div className="hidden border-r bg-card lg:block lg:w-64">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col">
        {/* Header: Now includes the mobile menu toggle */}
        <Header />

        <main className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 md:space-y-6">
          {children}
        </main>
      </div>
      {/* Toaster for notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
