import Image from "@/platform/image";
import type { SidebarItemKey } from "@/lib/sidebar-settings-types";

export function SidebarItemIcon({
  itemKey,
  collapsed = false,
}: {
  itemKey: SidebarItemKey;
  collapsed?: boolean;
}) {
  const size = collapsed ? 26 : 28;
  return (
    <Image
      src={`/sidebar/3d-v1/${itemKey}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority
      draggable={false}
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}
