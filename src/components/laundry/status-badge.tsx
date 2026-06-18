"use client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";

const variantByTone = {
  success: "success",
  warning: "warning",
  info: "info",
  accent: "accent",
  outline: "outline",
} as const;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];

  return <Badge variant={variantByTone[meta.tone]}>{meta.label}</Badge>;
}
