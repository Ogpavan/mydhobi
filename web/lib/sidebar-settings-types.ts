export const SIDEBAR_ITEM_DEFINITIONS = [
  { key: "dashboard", defaultLabel: "Dashboard" },
  { key: "store", defaultLabel: "Store" },
  { key: "orders", defaultLabel: "Orders" },
  { key: "customers", defaultLabel: "Customers" },
  { key: "pickups", defaultLabel: "Pickups" },
  { key: "deliveries", defaultLabel: "Deliveries" },
  { key: "services", defaultLabel: "Items" },
  { key: "inventory", defaultLabel: "Inventory" },
  { key: "riders", defaultLabel: "Riders" },
  { key: "payments", defaultLabel: "Payments" },
  { key: "offers", defaultLabel: "Offers" },
  { key: "referrals", defaultLabel: "Referrals" },
  { key: "complaints", defaultLabel: "Complaints" },
  { key: "reports", defaultLabel: "Reports" },
  { key: "settings", defaultLabel: "Settings" },
] as const;

export type SidebarItemKey = (typeof SIDEBAR_ITEM_DEFINITIONS)[number]["key"];

export type SidebarSetting = {
  key: SidebarItemKey;
  label: string;
  iconUrl: string | null;
};

export const SIDEBAR_SETTINGS_UPDATED_EVENT = "mydhobi:sidebar-settings-updated";
