"use client";

import {
  Bell,
  Bike,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock3,
  Droplets,
  Filter,
  Home,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  Scissors,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  Users,
  Wallet,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  bell: Bell,
  bike: Bike,
  "calendar-days": CalendarDays,
  "check-circle": CheckCircle2,
  "circle-dashed": CircleDashed,
  "clipboard-list": ClipboardList,
  clock: Clock3,
  droplets: Droplets,
  filter: Filter,
  home: Home,
  "indian-rupee": IndianRupee,
  "layout-dashboard": LayoutDashboard,
  "map-pin": MapPin,
  menu: Menu,
  "package-check": PackageCheck,
  phone: Phone,
  plus: Plus,
  scissors: Scissors,
  search: Search,
  settings: Settings,
  shirt: Shirt,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  truck: Truck,
  user: User,
  users: Users,
  wallet: Wallet,
  "washing-machine": WashingMachine,
};

export function IconByName({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Sparkles;

  return <Icon className={cn("size-5", className)} />;
}
