"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex">
        <AdminSidebar />
        <main className={cn("w-full px-4 py-6 sm:px-6 lg:px-8", className)}>{children}</main>
      </div>
    </div>
  );
}
