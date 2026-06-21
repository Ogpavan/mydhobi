import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const SPRITE_SOURCE = "/ChatGPT Image Jun 21, 2026, 12_41_48 PM.png";
const SPRITE_WIDTH = 1672;
const SPRITE_HEIGHT = 941;

const sprites = {
  logo: { x: 37, y: 23, w: 64, h: 64 },
  navDashboard: { x: 43, y: 118, w: 60, h: 54 },
  navOrders: { x: 48, y: 192, w: 52, h: 52 },
  navCustomers: { x: 45, y: 260, w: 60, h: 46 },
  navPickups: { x: 48, y: 326, w: 57, h: 48 },
  navDeliveries: { x: 48, y: 390, w: 57, h: 60 },
  navRateCard: { x: 46, y: 461, w: 60, h: 59 },
  navRiders: { x: 50, y: 526, w: 54, h: 54 },
  navPayments: { x: 46, y: 599, w: 60, h: 50 },
  navReports: { x: 48, y: 665, w: 58, h: 54 },
  navSettings: { x: 47, y: 735, w: 58, h: 58 },
  adminAvatar: { x: 43, y: 878, w: 67, h: 63 },
  statPickups: { x: 347, y: 129, w: 122, h: 116 },
  statDeliveries: { x: 690, y: 140, w: 118, h: 106 },
  statProcess: { x: 1033, y: 134, w: 104, h: 112 },
  statPayments: { x: 1355, y: 130, w: 126, h: 112 },
  chartIcon: { x: 350, y: 316, w: 52, h: 52 },
  statusPie: { x: 1157, y: 315, w: 58, h: 54 },
  statusNew: { x: 1161, y: 379, w: 44, h: 44 },
  statusPicked: { x: 1161, y: 432, w: 44, h: 45 },
  statusCleaning: { x: 1161, y: 485, w: 45, h: 46 },
  statusReady: { x: 1161, y: 539, w: 45, h: 45 },
  statusDelivered: { x: 1161, y: 592, w: 45, h: 45 },
  pickupHeader: { x: 355, y: 674, w: 56, h: 39 },
  deliveryHeader: { x: 972, y: 673, w: 62, h: 42 },
  avatarRahul: { x: 352, y: 727, w: 59, h: 59 },
  avatarSneha: { x: 352, y: 792, w: 59, h: 59 },
  avatarArjun: { x: 352, y: 855, w: 59, h: 59 },
  avatarPriya: { x: 971, y: 727, w: 59, h: 59 },
  avatarVikram: { x: 971, y: 792, w: 59, h: 59 },
  avatarNeha: { x: 971, y: 855, w: 59, h: 59 },
} as const;

export type ReferenceSpriteName = keyof typeof sprites;

type ReferenceSpriteIconProps = HTMLAttributes<HTMLSpanElement> & {
  name: ReferenceSpriteName;
  scale?: number;
  label?: string;
};

export function ReferenceSpriteIcon({
  name,
  scale = 1,
  label,
  className,
  style,
  ...props
}: ReferenceSpriteIconProps) {
  const sprite = sprites[name];
  const scaledStyle: CSSProperties = {
    width: sprite.w * scale,
    height: sprite.h * scale,
    backgroundImage: `url("${SPRITE_SOURCE}")`,
    backgroundPosition: `-${sprite.x * scale}px -${sprite.y * scale}px`,
    backgroundSize: `${SPRITE_WIDTH * scale}px ${SPRITE_HEIGHT * scale}px`,
    ...style,
  };

  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("inline-block shrink-0 bg-no-repeat", className)}
      role={label ? "img" : undefined}
      style={scaledStyle}
      {...props}
    />
  );
}
