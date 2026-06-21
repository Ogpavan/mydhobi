"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth";

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-[#FBFDFF]">
        <AdminSidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex" />
        <SidebarInset>
          <AdminHeader user={user} />
          <main className="px-5 pb-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
