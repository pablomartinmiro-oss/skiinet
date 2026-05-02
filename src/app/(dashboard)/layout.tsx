"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { InstructorSidebar } from "@/components/layout/InstructorSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { InstructorBottomNav } from "@/components/layout/InstructorBottomNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { GHLStatusBanner } from "@/components/shared/GHLStatusBanner";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { InstructorRedirect } from "@/components/layout/InstructorRedirect";
import { useMyInstructorProfile } from "@/hooks/useInstructors";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <InstructorRedirect />
        <DashboardShell>{children}</DashboardShell>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isInstructor, isLoading } = useInstructorDetect();

  // Block render until we know the role — prevents admin flash
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E4DE] border-t-[#E87B5A]" />
          <p className="text-sm text-[#8A8580]">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora background */}
      <div className="aurora-wrap" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="relative z-10 flex h-screen overflow-hidden">
      {/* Desktop sidebar — swap based on role */}
      <div className="hidden md:block">
        {isInstructor ? <InstructorSidebar /> : <Sidebar />}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {isInstructor ? (
          <InstructorTopbar />
        ) : (
          <div className="flex items-center gap-2 md:block">
            <div className="md:hidden pl-2">
              <MobileNav />
            </div>
            <div className="flex-1">
              <Topbar />
            </div>
          </div>
        )}

        <DemoBanner />
        {!isInstructor && <GHLStatusBanner />}

        <main
          className={`flex-1 overflow-auto ${
            isInstructor
              ? "p-4 pb-24 md:p-7 md:pb-7"
              : "p-5 md:p-7"
          }`}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* Mobile bottom nav for instructors */}
        {isInstructor && <InstructorBottomNav />}
      </div>

      {/* Admin-only: command palette + AI chat */}
      {!isInstructor && (
        <>
          <CommandPalette />
          <AIChatWidget />
        </>
      )}
      </div>
    </div>
  );
}

function useInstructorDetect() {
  const { data, isLoading } = useMyInstructorProfile();
  const { roleName } = usePermissions();

  const isManager = roleName?.toLowerCase().startsWith("owner") || roleName?.toLowerCase().includes("manager");
  const isInstructor = data?.isInstructor === true && !isManager;

  return { isInstructor, isLoading };
}
