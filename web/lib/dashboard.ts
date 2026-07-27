import type { ReferenceSpriteName } from "@/components/admin/reference-sprite-icon";
import { pool } from "@/lib/db";
import { ensureDeliverySchema } from "@/lib/deliveries";
import type {
  OperationOrder,
  OrderStatus,
  RecentOrder,
} from "@/lib/admin-dashboard-types";
import { ensurePaymentLedger } from "@/lib/payments";

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

function percentChange(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

function formatDate(value: unknown) {
  if (!value) return "To be updated";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(String(value)));
}

function formatTime(value: unknown) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(String(value)));
}

function recentStatus(value: unknown): OrderStatus {
  const status = String(value);
  if (
    [
      "New",
      "Picked Up",
      "In Cleaning",
      "Ready",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ].includes(status)
  ) {
    return status as OrderStatus;
  }
  return "New";
}

export async function getDashboardData(): Promise<DashboardData> {
  await Promise.all([ensureDeliverySchema(), ensurePaymentLedger()]);
  const [
    statsResult,
    chartResult,
    statusResult,
    pickupsResult,
    deliveriesResult,
    recentResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM order_pickups
         WHERE (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
           (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int AS today_pickups,
        (SELECT COUNT(*) FROM order_pickups
         WHERE (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
           (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 1)::int AS yesterday_pickups,
        (SELECT COUNT(*) FROM order_deliveries
         WHERE (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
           (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int AS today_deliveries,
        (SELECT COUNT(*) FROM order_deliveries
         WHERE (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
           (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 1)::int AS yesterday_deliveries,
        (SELECT COUNT(*) FROM customer_orders
         WHERE status NOT IN ('Delivered','Cancelled'))::int AS process_orders,
        (SELECT COUNT(*) FROM customer_orders
         WHERE status NOT IN ('Delivered','Cancelled')
           AND (created_at AT TIME ZONE 'Asia/Kolkata')::date <
             (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int AS previous_process_orders,
        (SELECT COALESCE(SUM(amount),0) FROM customer_payments
         WHERE status='Pending') AS pending_payments,
        (SELECT COALESCE(SUM(amount),0) FROM customer_payments
         WHERE status='Pending'
           AND (created_at AT TIME ZONE 'Asia/Kolkata')::date <
             (NOW() AT TIME ZONE 'Asia/Kolkata')::date) AS previous_pending_payments
    `),
    pool.query(`
      SELECT days.day::date AS report_date,
        COUNT(orders.id)::int AS orders
      FROM generate_series(
        (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 6,
        (NOW() AT TIME ZONE 'Asia/Kolkata')::date,
        interval '1 day'
      ) days(day)
      LEFT JOIN customer_orders orders
        ON (orders.created_at AT TIME ZONE 'Asia/Kolkata')::date=days.day::date
      GROUP BY days.day ORDER BY days.day
    `),
    pool.query(`
      SELECT
        CASE WHEN status='Out for Delivery' THEN 'Ready' ELSE status END AS status,
        COUNT(*)::int AS orders
      FROM customer_orders
      WHERE status <> 'Cancelled'
      GROUP BY CASE WHEN status='Out for Delivery' THEN 'Ready' ELSE status END
    `),
    pool.query(`
      SELECT pickups.order_id,users.name AS customer,orders.address_text,
        pickups.scheduled_at,pickups.status
      FROM order_pickups pickups
      INNER JOIN customer_orders orders ON orders.id=pickups.order_id
      INNER JOIN app_users users ON users.id=orders.user_id
      WHERE (pickups.scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
        (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      ORDER BY pickups.scheduled_at LIMIT 4
    `),
    pool.query(`
      SELECT deliveries.order_id,users.name AS customer,orders.address_text,
        deliveries.scheduled_at,deliveries.status
      FROM order_deliveries deliveries
      INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
      INNER JOIN app_users users ON users.id=orders.user_id
      WHERE (deliveries.scheduled_at AT TIME ZONE 'Asia/Kolkata')::date =
        (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      ORDER BY deliveries.scheduled_at LIMIT 4
    `),
    pool.query(`
      SELECT orders.id,users.name AS customer,orders.service,orders.pickup_at,
        orders.delivery_at,orders.status,orders.payment_status,orders.amount
      FROM customer_orders orders
      INNER JOIN app_users users ON users.id=orders.user_id
      ORDER BY orders.created_at DESC LIMIT 8
    `),
  ]);

  const stats = statsResult.rows[0];
  const statusCounts = new Map(
    statusResult.rows.map((row) => [String(row.status), Number(row.orders)]),
  );
  const orderStatuses: DashboardStatus[] = [
    { label: "New", value: statusCounts.get("New") ?? 0, color: "bg-[#075DFF]", icon: "statusNew" },
    { label: "Picked Up", value: statusCounts.get("Picked Up") ?? 0, color: "bg-[#13A33D]", icon: "statusPicked" },
    { label: "In Cleaning", value: statusCounts.get("In Cleaning") ?? 0, color: "bg-[#FF930A]", icon: "statusCleaning" },
    { label: "Ready", value: statusCounts.get("Ready") ?? 0, color: "bg-[#17C4C6]", icon: "statusReady" },
    { label: "Delivered", value: statusCounts.get("Delivered") ?? 0, color: "bg-[#13A33D]", icon: "statusDelivered" },
  ];

  return {
    stats: {
      todayPickups: Number(stats.today_pickups),
      todayDeliveries: Number(stats.today_deliveries),
      ordersInProcess: Number(stats.process_orders),
      pendingPayments: Number(stats.pending_payments),
    },
    trends: {
      pickups: percentChange(Number(stats.today_pickups), Number(stats.yesterday_pickups)),
      deliveries: percentChange(Number(stats.today_deliveries), Number(stats.yesterday_deliveries)),
      orders: percentChange(Number(stats.process_orders), Number(stats.previous_process_orders)),
      payments: percentChange(Number(stats.pending_payments), Number(stats.previous_pending_payments)),
    },
    ordersOverview: chartResult.rows.map((row) => ({
      day: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }).format(new Date(row.report_date)),
      orders: Number(row.orders),
    })),
    orderStatuses,
    todayPickups: pickupsResult.rows.map((row, index) => ({
      id: String(row.order_id),
      customer: String(row.customer),
      area: String(row.address_text),
      time: formatTime(row.scheduled_at),
      status: "Scheduled",
      avatar: avatars[index % avatars.length],
    })),
    todayDeliveries: deliveriesResult.rows.map((row, index) => ({
      id: String(row.order_id),
      customer: String(row.customer),
      area: String(row.address_text),
      time: formatTime(row.scheduled_at),
      status:
        row.status === "Delivered" ? "Delivered" : "Out for Delivery",
      avatar: avatars[(index + 3) % avatars.length],
    })),
    recentOrders: recentResult.rows.map((row) => ({
      id: String(row.id),
      customer: String(row.customer),
      service: String(row.service),
      pickupDate: formatDate(row.pickup_at),
      deliveryDate: formatDate(row.delivery_at),
      status: recentStatus(row.status),
      payment: row.payment_status === "Paid" ? "Paid" : "Unpaid",
      amount: `₹${Number(row.amount).toLocaleString("en-IN")}`,
    })),
  };
}
