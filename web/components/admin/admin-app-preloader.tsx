"use client";

import { useEffect } from "react";

import type { SidebarSetting } from "@/lib/sidebar-settings-types";

const staticSidebarImages = [
  "/logo.png",
  "/sidebar/store-icon.png",
  "/sidebar/notification-bell.png",
  "/sidebar/admin-avatar-male.png",
] as const;

export function AdminAppPreloader({
  sidebarItems,
}: {
  sidebarItems: SidebarSetting[];
}) {
  useEffect(() => {
    const iconUrls = [
      ...staticSidebarImages,
      ...sidebarItems.flatMap((item) => item.iconUrl ? [item.iconUrl] : []),
    ];
    for (const url of iconUrls) {
      const image = new window.Image();
      image.src = url;
    }
  }, [sidebarItems]);

  return null;
}
