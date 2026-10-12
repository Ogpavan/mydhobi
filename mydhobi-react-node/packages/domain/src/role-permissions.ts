export type PermissionPage = {
  key: string;
  label: string;
};
export type PermissionGroup = {
  label: string;
  pages: PermissionPage[];
};
export const permissionGroups: PermissionGroup[] = [
  {
    label: "Daily Work",
    pages: [
      { key: "dashboard", label: "Dashboard" },
      { key: "orders", label: "Orders" },
      { key: "pickups", label: "Pickups" },
      { key: "deliveries", label: "Deliveries" },
      { key: "complaints", label: "Complaints" },
    ],
  },
  {
    label: "People and Stores",
    pages: [
      { key: "stores", label: "Stores" },
      { key: "customers", label: "Customers" },
      { key: "riders", label: "Riders" },
    ],
  },
  {
    label: "Services and Stock",
    pages: [
      { key: "services", label: "Services" },
      { key: "inventory", label: "Inventory" },
    ],
  },
  {
    label: "Money and Growth",
    pages: [
      { key: "payments", label: "Payments" },
      { key: "offers", label: "Offers" },
      { key: "referrals", label: "Referrals" },
    ],
  },
  {
    label: "Reports and Setup",
    pages: [
      { key: "reports", label: "Reports" },
      { key: "basic-setup", label: "Basic Setup" },
    ],
  },
];
