"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ReferenceSpriteIcon,
  type ReferenceSpriteName,
} from "@/components/admin/reference-sprite-icon";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem =
  | {
      title: string;
      href: string;
      icon: ReferenceSpriteName;
      customIcon?: never;
    }
  | {
      title: string;
      href: string;
      customIcon: "store";
      icon?: never;
    };

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: "navDashboard" },
  { title: "Store", href: "/admin/store", customIcon: "store" },
  { title: "Orders", href: "/admin/orders", icon: "navOrders" },
  { title: "Customers", href: "/admin/customers", icon: "navCustomers" },
  { title: "Pickups", href: "/admin/pickups", icon: "navPickups" },
  { title: "Deliveries", href: "/admin/deliveries", icon: "navDeliveries" },
  { title: "Rate Card", href: "/admin/rate-card", icon: "navRateCard" },
  { title: "Riders", href: "/admin/riders", icon: "navRiders" },
  { title: "Payments", href: "/admin/payments", icon: "navPayments" },
  { title: "Reports", href: "/admin/reports", icon: "navReports" },
  { title: "Settings", href: "/admin/settings", icon: "navSettings" },
];

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  collapsible?: boolean;
};

export function AdminSidebar({
  className,
  onNavigate,
  collapsible = true,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const isCollapsed = collapsible && !open;

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "bg-white pb-[14px] pt-[16px]",
        isCollapsed ? "px-[8px]" : "px-[20px]",
        className,
      )}
    >
      <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 pl-1")}>
        <img
          src="/logo.png"
          alt="MyDhobi logo"
          className={cn(
            "shrink-0 object-contain",
            isCollapsed ? "h-9 w-9" : "h-11 w-11",
          )}
        />
        <div className={cn("min-w-0", isCollapsed && "hidden")}>
          <p className="text-[18px] font-semibold leading-none tracking-normal text-[#0B1E57]">
            MyDhobi
          </p>
          <p className="mt-1 max-w-[154px] truncate text-[13px] font-normal text-[#5A6B8C]">
            Admin
          </p>
        </div>
      </div>

      <nav
        className={cn(
          "mt-[16px] flex flex-1 flex-col gap-[2px]",
          isCollapsed ? "mx-[-8px]" : "mx-[-20px]",
        )}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onNavigate}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group flex h-[38px] w-full items-center border-b border-[#EEF3F8] text-[13px] font-normal leading-none tracking-normal transition-colors last:border-b-0",
                isCollapsed
                  ? "justify-center px-0"
                  : "gap-[8px] px-[28px]",
                isActive
                  ? "border-[#D4E4FF] bg-[#EEF5FF] text-[#075DFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  : "text-[#071333] hover:bg-[#F7FAFF]",
              )}
            >
              {item.customIcon === "store" ? (
                <img
                  src="/sidebar/store-icon.png"
                  alt=""
                  className={cn(
                    "shrink-0 object-contain",
                    isCollapsed ? "h-[28px] w-[30px]" : "h-[31px] w-[33px]",
                  )}
                />
              ) : (
                <ReferenceSpriteIcon
                  name={item.icon}
                  scale={isCollapsed ? 0.48 : 0.54}
                />
              )}
              <span className={cn(isCollapsed && "hidden")}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

    </Sidebar>
  );
}
