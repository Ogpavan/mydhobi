import type { SidebarItemKey } from "@/lib/sidebar-settings-types";
export type NavItem = {
  key: SidebarItemKey;
  title: string;
  href: string;
  children?: Array<{ title: string; href: string; adminOnly?: boolean }>;
};
export const navItems: NavItem[] = [
  { key: "dashboard", title: "Dashboard", href: "/admin/dashboard" },
  { key: "store", title: "Store", href: "/admin/store" },
  {
    key: "orders",
    title: "Orders",
    href: "/admin/orders",
    children: [
      { title: "Book new order", href: "/admin/orders/new" },
      { title: "List order", href: "/admin/orders" },
    ],
  },
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
      { title: "Services", href: "/admin/services/pricing" },
      { title: "Service Mapping", href: "/admin/services/mapping" },
      { title: "Tariffs", href: "/admin/rate-card" },
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
        title: "Charge Master",
        href: "/admin/settings/charges",
        adminOnly: true,
      },
      {
        title: "Discount Groups",
        href: "/admin/settings/discount-groups",
        adminOnly: true,
      },
      {
        title: "Role Permissions",
        href: "/admin/settings/role-permissions",
        adminOnly: true,
      },
      { title: "My Profile", href: "/admin/settings/profile" },
    ],
  },
];
