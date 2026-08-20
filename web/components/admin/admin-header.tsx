"use client";

import { useState } from "react";
import { ChevronDown, Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { startNavigationProgress } from "@/components/navigation-loader";
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
import type { SidebarSetting } from "@/lib/sidebar-settings-types";

export function AdminHeader({
  user,
  sidebarItems,
}: {
  user: AuthUser;
  sidebarItems: SidebarSetting[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery,setSearchQuery]=useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [alerts,setAlerts]=useState<Array<{id:string;title:string;message:string;href:string;createdAt:string}>>([]);
  const [alertsLoading,setAlertsLoading]=useState(false);
  const operationalTitles: Record<string, string> = {
    "/admin/orders": "Orders",
    "/admin/pickups": "Pickups",
    "/admin/deliveries": "Deliveries",
    "/admin/rate-card": "Rate Card",
    "/admin/services": "Items",
    "/admin/services/categories": "Garment Categories",
    "/admin/services/pricing": "Services",
    "/admin/riders": "Riders",
    "/admin/payments": "Payments",
    "/admin/offers": "Offers & Coupons",
    "/admin/referrals": "Referrals",
    "/admin/search": "Search",
    "/admin/complaints": "Complaints",
    "/admin/reports": "Business Summary",
    "/admin/reports/orders": "Order Report",
    "/admin/reports/sales": "Sales Report",
    "/admin/reports/payments": "Payment Report",
    "/admin/reports/wallet": "Wallet Report",
    "/admin/reports/customers": "Customer Report",
    "/admin/reports/services": "Service Report",
    "/admin/reports/pickups": "Pickup Report",
    "/admin/reports/deliveries": "Delivery Report",
    "/admin/reports/riders": "Rider Report",
    "/admin/reports/inventory": "Inventory Report",
    "/admin/reports/complaints": "Complaint Report",
  };
  const pageMeta = pathname.startsWith("/admin/orders/")
    ? {
        title: "Order Details",
      }
    : pathname.startsWith("/admin/riders/")
      ? {
          title: "Rider Details",
        }
    : operationalTitles[pathname]
    ? {
        title: operationalTitles[pathname],
      }
    : pathname === "/admin/inventory"
    ? {
        title: "Inventory",
      }
    : pathname === "/admin/customers"
    ? {
        title: "Customers",
      }
    : pathname === "/admin/settings/basic-setup"
    ? {
        title: "Basic Setup",
      }
    : pathname === "/admin/settings/profile"
    ? {
        title: "My Profile",
      }
    : pathname === "/admin/settings/role-permissions"
    ? {
        title: "Role Permissions",
      }
    : pathname === "/developer"
    ? {
        title: "Developer",
      }
    : pathname.startsWith("/admin/store")
    ? {
        title:
          pathname === "/admin/store/create"
            ? "Create Store"
            : pathname.includes("/edit")
              ? "Edit Store"
              : pathname === "/admin/store"
                ? "Stores"
                : "Store Details",
      }
    : pathname === "/admin" || pathname === "/admin/dashboard"
      ? {
          title: "Dashboard",
        }
      : {
          title: "404",
        };

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Logout failed (${response.status})`);
      }

      toast.success("Signed out");
      startNavigationProgress();
      window.location.replace("/");
    } catch {
      setSigningOut(false);
      toast.error("Unable to sign out right now");
    }
  }

  async function loadAlerts(opened:boolean) {
    if(!opened)return;
    setAlertsLoading(true);
    try{
      const request=await fetch("/api/admin/alerts");
      const data=await request.json() as {alerts?:typeof alerts};
      if(request.ok)setAlerts(data.alerts??[]);
    }finally{setAlertsLoading(false);}
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
              showRolePermissions={user.role === "admin"}
              storeManager={user.role === "store_manager"}
              sidebarItems={sidebarItems}
            />
          </SheetContent>
        </Sheet>

        <SidebarTrigger className="hidden lg:inline-flex" />

        <div className="min-w-[180px] flex-1">
          <h1 className="text-[22px] font-medium leading-none tracking-normal text-[#071333]">
            {pageMeta.title}
          </h1>
        </div>

        {user.role !== "store_manager" ? <form onSubmit={event=>{event.preventDefault();const query=searchQuery.trim();if(!query)return;startNavigationProgress();router.push(`/admin/search?q=${encodeURIComponent(query)}`)}} className="relative hidden h-[36px] w-full max-w-[320px] md:block">
          <Search className="pointer-events-none absolute left-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#385071]" />
          <Input
            value={searchQuery}
            onChange={event=>setSearchQuery(event.target.value)}
            className="h-[36px] rounded border-[#DCE6F2] bg-white pl-[38px] pr-3 text-[12px] font-normal shadow-[0_6px_18px_rgba(15,23,42,0.055)] placeholder:text-[#52627A] focus-visible:ring-blue-200"
            placeholder="Search orders, stores, customers..."
            type="search"
          />
        </form> : null}

        <DropdownMenu onOpenChange={loadAlerts}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label="Operational alerts"
              className="relative h-[40px] w-[40px] shrink-0 rounded bg-transparent p-0 shadow-none hover:bg-[#F3F7FC]"
            >
              <Image src="/sidebar/notification-bell.png" alt="" width={32} height={32} className="h-[32px] w-[32px] object-contain" />
              {alerts.length?<span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{alerts.length}</span>:null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px]">
            <DropdownMenuLabel>Operational Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alertsLoading?<p className="px-3 py-5 text-center text-[12px] text-[#52627A]">Loading...</p>:alerts.length?alerts.map(alert=><DropdownMenuItem key={alert.id} asChild><Link href={alert.href} className="flex flex-col items-start py-2"><span className="text-[12px] font-medium">{alert.title}</span><span className="mt-1 text-[11px] text-[#52627A]">{alert.message}</span></Link></DropdownMenuItem>):<p className="px-3 py-5 text-center text-[12px] text-[#52627A]">No alerts</p>}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hidden h-[52px] shrink-0 gap-[11px] rounded px-2 hover:bg-[#F3F7FC] sm:flex"
              aria-label="Open profile menu"
            >
              <Avatar className="h-[46px] w-[46px] border-2 border-[#CFE0FF] bg-[#EAF2FF] text-[#075DFF] shadow-[0_6px_16px_rgba(7,93,255,0.12)]">
                <Image
                  src="/sidebar/admin-avatar-male.png"
                  alt={user.name}
                  width={46}
                  height={46}
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
            <DropdownMenuItem asChild>
              <Link href="/admin/settings/profile">Profile</Link>
            </DropdownMenuItem>
            {user.role !== "store_manager" ? (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings/basic-setup">Basic Setup</Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void handleSignOut();
              }}
              disabled={signingOut}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border-t border-[#DCE6F2] px-4 pb-3 pt-2 md:hidden">
        {user.role !== "store_manager" ? <form onSubmit={event=>{event.preventDefault();const query=searchQuery.trim();if(!query)return;startNavigationProgress();router.push(`/admin/search?q=${encodeURIComponent(query)}`)}} className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#385071]" />
          <Input
            value={searchQuery}
            onChange={event=>setSearchQuery(event.target.value)}
            className="h-[40px] rounded border-[#DCE6F2] pl-11 text-[13px] font-normal"
            placeholder="Search orders, stores, customers..."
            type="search"
          />
        </form> : null}
      </div>
    </header>
  );
}
