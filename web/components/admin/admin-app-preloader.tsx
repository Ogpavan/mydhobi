"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { SidebarSetting } from "@/lib/sidebar-settings-types";

const adminRoutes = [
  "/admin/dashboard",
  "/admin/store",
  "/admin/store/create",
  "/admin/orders",
  "/admin/customers",
  "/admin/pickups",
  "/admin/deliveries",
  "/admin/services",
  "/admin/services/categories",
  "/admin/services/pricing",
  "/admin/inventory",
  "/admin/riders",
  "/admin/payments",
  "/admin/offers",
  "/admin/referrals",
  "/admin/complaints",
  "/admin/reports",
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
  "/admin/settings/basic-setup",
  "/admin/settings/profile",
] as const;

const staticSidebarImages = [
  "/logo.png",
  "/sidebar/store-icon.png",
  "/sidebar/notification-bell.png",
  "/sidebar/admin-avatar-male.png",
] as const;

export function AdminAppPreloader({
  sidebarItems,
  showAdminRoutes,
}: {
  sidebarItems: SidebarSetting[];
  showAdminRoutes: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    for (const route of adminRoutes) router.prefetch(route);
    if (showAdminRoutes) {
      router.prefetch("/admin/reports/wallet");
      router.prefetch("/admin/settings/role-permissions");
    }

    const iconUrls = [
      ...staticSidebarImages,
      ...sidebarItems.flatMap((item) => item.iconUrl ? [item.iconUrl] : []),
    ];
    for (const url of iconUrls) {
      const image = new window.Image();
      image.src = url;
    }
  }, [router, showAdminRoutes, sidebarItems]);

  return null;
}
