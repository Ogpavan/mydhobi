"use client";

import { useState } from "react";
import { ChevronDown, Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth";

export function AdminHeader({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const pageMeta = pathname.startsWith("/admin/store")
    ? {
        title:
          pathname === "/admin/store/create"
            ? "Create Store"
            : pathname.includes("/edit")
              ? "Edit Store"
              : "Stores",
      }
    : pathname === "/admin" || pathname === "/admin/dashboard"
      ? {
          title: "Dashboard",
        }
      : {
          title: "404",
        };

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      toast.success("Signed out");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Unable to sign out right now");
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[66px] items-center gap-[12px] px-[28px]">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-[34px] w-[34px] shrink-0 rounded lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[264px] p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebar
              collapsible={false}
              className="flex w-full border-r-0"
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <SidebarTrigger className="hidden lg:inline-flex" />

        <div className="min-w-[180px] flex-1">
          <h1 className="text-[22px] font-medium leading-none tracking-normal text-[#071333]">
            {pageMeta.title}
          </h1>
        </div>

        <div className="relative hidden h-[36px] w-full max-w-[320px] md:block">
          <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#385071]" />
          <Input
            className="h-[36px] rounded border-[#DCE6F2] bg-white pl-[38px] pr-3 text-[12px] font-normal shadow-[0_6px_18px_rgba(15,23,42,0.055)] placeholder:text-[#52627A] focus-visible:ring-blue-200"
            placeholder="Search orders, stores, customers..."
            type="search"
          />
        </div>

        <Button
          variant="ghost"
          aria-label="Notifications"
          className="relative h-[40px] w-[40px] shrink-0 rounded bg-transparent p-0 shadow-none hover:bg-[#F3F7FC]"
          onClick={() => toast.info("No new notifications")}
        >
          <img
            src="/sidebar/notification-bell.png"
            alt=""
            className="h-[32px] w-[32px] object-contain"
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hidden h-[52px] shrink-0 gap-[11px] rounded px-2 hover:bg-[#F3F7FC] sm:flex"
              aria-label="Open profile menu"
            >
              <Avatar className="h-[46px] w-[46px] border-2 border-[#CFE0FF] bg-[#EAF2FF] text-[#075DFF] shadow-[0_6px_16px_rgba(7,93,255,0.12)]">
                <img
                  src="/sidebar/admin-avatar-male.png"
                  alt={user.name}
                  className="h-full w-full object-contain"
                />
                <AvatarFallback className="bg-[#EAF2FF] text-[14px] font-medium text-[#075DFF]">
                  PA
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 flex-col items-start leading-none md:flex">
                <span className="max-w-[118px] truncate text-[13px] font-medium text-[#071333]">
                  {user.name}
                </span>
                <span className="mt-1 max-w-[118px] truncate text-[11px] font-normal text-[#52627A]">
                  {user.designation}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-[#536580]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-slate-500">
                  {user.designation}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Account settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border-t border-[#DCE6F2] px-4 pb-3 pt-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#385071]" />
          <Input
            className="h-[40px] rounded border-[#DCE6F2] pl-11 text-[13px] font-normal"
            placeholder="Search orders, stores, customers..."
            type="search"
          />
        </div>
      </div>
    </header>
  );
}
