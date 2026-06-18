export const THEME_COLORS = {
  primary: "#005941",
  primaryDark: "#003d2d",
  accent: "#ff7a00",
  cream: "#fbf4e8",
  slate: "#17221e",
  border: "#e7ded2",
} as const;

export const SERVICE_DEFINITIONS = [
  {
    id: "wash-iron",
    name: "Wash & Iron",
    shortName: "Wash",
    description: "Everyday laundry washed, dried, pressed, and folded.",
    icon: "washing-machine",
    priceFrom: 25,
    turnaround: "24 hrs",
    accentClass: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "ironing",
    name: "Ironing",
    shortName: "Iron",
    description: "Crisp steam pressing for shirts, trousers, and uniforms.",
    icon: "sparkles",
    priceFrom: 15,
    turnaround: "12 hrs",
    accentClass: "bg-orange-50 text-orange-700",
  },
  {
    id: "dry-cleaning",
    name: "Dry Cleaning",
    shortName: "Dry Clean",
    description: "Gentle fabric care for premium garments and occasion wear.",
    icon: "shirt",
    priceFrom: 80,
    turnaround: "48 hrs",
    accentClass: "bg-sky-50 text-sky-700",
  },
  {
    id: "darning",
    name: "Darning",
    shortName: "Repair",
    description: "Small fixes, hems, button work, and fabric repair.",
    icon: "scissors",
    priceFrom: 40,
    turnaround: "48 hrs",
    accentClass: "bg-violet-50 text-violet-700",
  },
] as const;

export type ServiceId = (typeof SERVICE_DEFINITIONS)[number]["id"];

export const ORDER_STATUSES = [
  "delivered",
  "in-progress",
  "pending-pickup",
  "out-for-delivery",
  "in-washing",
  "ready-delivery",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "success" | "warning" | "info" | "accent" | "outline"; description: string }
> = {
  delivered: {
    label: "Delivered",
    tone: "success",
    description: "Completed and delivered",
  },
  "in-progress": {
    label: "In Progress",
    tone: "warning",
    description: "Being processed by the laundry team",
  },
  "pending-pickup": {
    label: "Pending Pickup",
    tone: "outline",
    description: "Pickup is scheduled",
  },
  "out-for-delivery": {
    label: "Out for Delivery",
    tone: "accent",
    description: "Rider is on the way",
  },
  "in-washing": {
    label: "In Washing",
    tone: "info",
    description: "Garments are in cleaning",
  },
  "ready-delivery": {
    label: "Ready Delivery",
    tone: "success",
    description: "Packed and ready for dispatch",
  },
};

export const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/orders", label: "Orders", icon: "clipboard-list" },
  { href: "/book", label: "Book", icon: "plus" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;

export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "clipboard-list" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/services", label: "Services", icon: "shirt" },
  { href: "/admin/riders", label: "Riders", icon: "bike" },
] as const;

export const PICKUP_SLOTS = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "02:00 PM - 04:00 PM", "06:00 PM - 08:00 PM"] as const;
