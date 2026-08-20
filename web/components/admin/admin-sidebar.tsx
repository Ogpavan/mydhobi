"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SidebarItemIcon } from "@/components/admin/sidebar-item-icon";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  SIDEBAR_ITEM_DEFINITIONS,
  SIDEBAR_SETTINGS_UPDATED_EVENT,
  type SidebarItemKey,
  type SidebarSetting,
} from "@/lib/sidebar-settings-types";
import { cn } from "@/lib/utils";

type NavItem = {
  key: SidebarItemKey;
  title: string;
  href: string;
  children?: Array<{ title: string; href: string; adminOnly?: boolean }>;
};

const navItems: NavItem[] = [
  { key: "dashboard", title: "Dashboard", href: "/admin/dashboard" },
  { key: "store", title: "Store", href: "/admin/store" },
  { key: "orders", title: "Orders", href: "/admin/orders" },
  { key: "customers", title: "Customers", href: "/admin/customers" },
  { key: "pickups", title: "Pickups", href: "/admin/pickups" },
  { key: "deliveries", title: "Deliveries", href: "/admin/deliveries" },
  {
    key: "services",
    title: "Items",
    href: "/admin/services",
    children: [
      { title: "Garments", href: "/admin/services/categories" },
      { title: "Items", href: "/admin/services" },
      { title: "Rate Card", href: "/admin/rate-card" },
      { title: "Services", href: "/admin/services/pricing" },
    ],
  },
  { key: "inventory", title: "Inventory", href: "/admin/inventory" },
  { key: "riders", title: "Riders", href: "/admin/riders" },
  { key: "payments", title: "Payments", href: "/admin/payments" },
  { key: "offers", title: "Offers", href: "/admin/offers" },
  { key: "referrals", title: "Referrals", href: "/admin/referrals" },
  {
    key: "complaints",
    title: "Complaints",
    href: "/admin/complaints",
  },
  {
    key: "reports",
    title: "Reports",
    href: "/admin/reports",
    children: [
      { title: "Business Summary", href: "/admin/reports" },
      { title: "Order Report", href: "/admin/reports/orders" },
      { title: "Sales Report", href: "/admin/reports/sales" },
      { title: "Payment Report", href: "/admin/reports/payments" },
      {
        title: "Wallet Report",
        href: "/admin/reports/wallet",
        adminOnly: true,
      },
      { title: "Customer Report", href: "/admin/reports/customers" },
      { title: "Service Report", href: "/admin/reports/services" },
      { title: "Pickup Report", href: "/admin/reports/pickups" },
      { title: "Delivery Report", href: "/admin/reports/deliveries" },
      { title: "Rider Report", href: "/admin/reports/riders" },
      { title: "Inventory Report", href: "/admin/reports/inventory" },
      { title: "Complaint Report", href: "/admin/reports/complaints" },
    ],
  },
  {
    key: "settings",
    title: "Settings",
    href: "/admin/settings",
    children: [
      { title: "Basic Setup", href: "/admin/settings/basic-setup" },
      {
        title: "Role Permissions",
        href: "/admin/settings/role-permissions",
        adminOnly: true,
      },
      { title: "My Profile", href: "/admin/settings/profile" },
    ],
  },
];

const storeManagerReportPaths = new Set([
  "/admin/reports/orders",
  "/admin/reports/sales",
  "/admin/reports/payments",
  "/admin/reports/customers",
  "/admin/reports/services",
  "/admin/reports/pickups",
  "/admin/reports/deliveries",
  "/admin/reports/riders",
  "/admin/reports/inventory",
  "/admin/reports/complaints",
]);

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  collapsible?: boolean;
  showRolePermissions?: boolean;
  storeManager?: boolean;
  sidebarItems?: SidebarSetting[];
};

export function AdminSidebar({
  className,
  onNavigate,
  collapsible = true,
  showRolePermissions = false,
  storeManager = false,
  sidebarItems = SIDEBAR_ITEM_DEFINITIONS.map((item) => ({
    key: item.key,
    label: item.defaultLabel,
    iconUrl: null,
  })),
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const [settings, setSettings] = useState(sidebarItems);
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    navItems
      .filter((item) => item.children && (pathname.startsWith(item.href) || item.children.some((child) => pathname === child.href)))
      .map((item) => item.href),
  );
  const isCollapsed = collapsible && !open;
  const visibleNavItems = storeManager
    ? navItems.filter((item) => [
      "dashboard", "orders", "customers", "pickups", "deliveries", "inventory",
      "riders", "payments", "complaints", "reports", "settings",
    ].includes(item.key))
    : navItems;

  useEffect(() => {
    const activeGroup = navItems.find(
      (item) => item.children && (pathname.startsWith(item.href) || item.children.some((child) => pathname === child.href)),
    );
    if (activeGroup) {
      setOpenGroups((current) =>
        current.includes(activeGroup.href)
          ? current
          : [...current, activeGroup.href],
      );
    }
  }, [pathname]);

  useEffect(() => {
    function handleSettingsUpdate(event: Event) {
      setSettings((event as CustomEvent<SidebarSetting[]>).detail);
    }

    window.addEventListener(SIDEBAR_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(
      SIDEBAR_SETTINGS_UPDATED_EVENT,
      handleSettingsUpdate,
    );
  }, []);

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "bg-white pb-[14px] pt-[16px]",
        className,
      )}
    >
      <SidebarHeader className={isCollapsed ? "px-[8px]" : "px-[20px]"}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 pl-1")}>
          <Image
            src="/logo.png"
            alt="MyDhobi logo"
            width={44}
            height={44}
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
      </SidebarHeader>

      <SidebarContent className="mt-[16px]">
        <nav aria-label="Admin navigation">
          <SidebarMenu className="gap-[2px]">
            {visibleNavItems.map((item) => {
          const setting = settings.find((entry) => entry.key === item.key);
          const title = setting?.label ?? item.title;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)) ||
            Boolean(item.children?.some((child) => pathname === child.href));
          const itemClassName = cn(
            "group flex h-[38px] w-full items-center text-[13px] font-normal leading-none tracking-normal transition-colors",
            isCollapsed ? "justify-center px-0" : "gap-[8px] px-[28px]",
            isActive
              ? "bg-[#EEF5FF] text-[#075DFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "text-[#071333] hover:bg-[#F7FAFF]",
          );
          const icon = setting?.iconUrl ? (
            <Image
              src={setting.iconUrl}
              alt=""
              width={30}
              height={30}
              unoptimized
              className={cn(
                "shrink-0 object-contain",
                isCollapsed ? "h-[26px] w-[26px]" : "h-[29px] w-[29px]",
              )}
            />
          ) : (
            <SidebarItemIcon itemKey={item.key} collapsed={isCollapsed} />
          );

          if (item.children) {
            const isExpanded = openGroups.includes(item.href) && !isCollapsed;
            const visibleChildren = item.children.filter(
              (child) => (!child.adminOnly || showRolePermissions || storeManagerReportPaths.has(child.href)) &&
                (!storeManager || child.href === "/admin/settings/profile" || storeManagerReportPaths.has(child.href)),
            );

            return (
              <SidebarMenuItem key={item.key}>
                <button
                  type="button"
                  title={isCollapsed ? title : undefined}
                  className={itemClassName}
                  aria-expanded={isExpanded}
                  onClick={() => {
                    if (isCollapsed) {
                      setOpen(true);
                      setOpenGroups((current) =>
                        current.includes(item.href)
                          ? current
                          : [...current, item.href],
                      );
                      return;
                    }

                    setOpenGroups((current) =>
                      current.includes(item.href)
                        ? current.filter((href) => href !== item.href)
                        : [...current, item.href],
                    );
                  }}
                >
                  {icon}
                  <span className={cn("flex-1 text-left", isCollapsed && "hidden")}>
                    {title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isCollapsed && "hidden",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {isExpanded ? (
                  <div className="bg-[#FAFCFF] py-1">
                    {visibleChildren.map((child) => {
                      const childActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "flex h-[34px] items-center pl-[69px] pr-5 text-[12px] font-normal transition-colors",
                            childActive
                              ? "bg-[#E7F0FF] text-[#075DFF]"
                              : "text-[#385071] hover:bg-[#F1F6FD] hover:text-[#075DFF]",
                          )}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
                <SidebarSeparator
                  className={isActive ? "bg-[#D4E4FF]" : "bg-[#EEF3F8]"}
                />
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={item.key}>
              <Link
                href={item.href}
                onClick={onNavigate}
                title={isCollapsed ? title : undefined}
                aria-current={isActive ? "page" : undefined}
                className={itemClassName}
              >
                {icon}
                <span className={cn(isCollapsed && "hidden")}>{title}</span>
              </Link>
              <SidebarSeparator
                className={isActive ? "bg-[#D4E4FF]" : "bg-[#EEF3F8]"}
              />
            </SidebarMenuItem>
          );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
