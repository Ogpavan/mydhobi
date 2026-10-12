import type { ReferenceSpriteName } from "./components/admin/reference-sprite-icon";
import type { OperationOrder, RecentOrder } from "./admin-dashboard-types";
export type DashboardStatus = {
  label: "New" | "Picked Up" | "In Cleaning" | "Ready" | "Delivered";
  value: number;
  color: string;
  icon:
    | "statusNew"
    | "statusPicked"
    | "statusCleaning"
    | "statusReady"
    | "statusDelivered";
};
export type DashboardData = {
  stats: {
    todayPickups: number;
    todayDeliveries: number;
    ordersInProcess: number;
    pendingPayments: number;
  };
  trends: {
    pickups: number;
    deliveries: number;
    orders: number;
    payments: number;
  };
  ordersOverview: Array<{ day: string; orders: number }>;
  orderStatuses: DashboardStatus[];
  todayPickups: OperationOrder[];
  todayDeliveries: OperationOrder[];
  recentOrders: RecentOrder[];
};
const avatars: ReferenceSpriteName[] = [
  "avatarRahul",
  "avatarSneha",
  "avatarArjun",
  "avatarPriya",
  "avatarVikram",
  "avatarNeha",
];
