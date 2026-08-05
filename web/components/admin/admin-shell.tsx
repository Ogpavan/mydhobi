"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminAppPreloader } from "@/components/admin/admin-app-preloader";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth";
import type { SidebarSetting } from "@/lib/sidebar-settings-types";

export function AdminShell({
  children,
  user,
  sidebarItems,
}: {
  children: React.ReactNode;
  user: AuthUser;
  sidebarItems: SidebarSetting[];
}) {
  return (
    <SidebarProvider defaultOpen>
      <AdminAppPreloader
        sidebarItems={sidebarItems}
        showAdminRoutes={user.role === "admin"}
      />
      <div className="min-h-screen bg-[#FBFDFF]">
        <AdminSidebar
          className="fixed inset-y-0 left-0 z-40 hidden lg:flex"
          showRolePermissions={user.role === "admin"}
          storeManager={user.role === "store_manager"}
          sidebarItems={sidebarItems}
        />
        <SidebarInset>
          <AdminHeader user={user} sidebarItems={sidebarItems} />
          <main className="px-5 pb-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
