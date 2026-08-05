import { pool } from "@/lib/db";
import { ensurePaymentLedger } from "@/lib/payments";

export const reportRanges = [7, 30, 90, 365] as const;
export type ReportRange = (typeof reportRanges)[number];

export type ReportData = {
  range: ReportRange;
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrder: number;
  };
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  topServices: Array<{ service: string; orders: number; revenue: number }>;
  orderStatuses: Array<{ status: string; orders: number }>;
  paymentMethods: Array<{ method: string; transactions: number; amount: number }>;
};

export function normalizeReportRange(value: string | null): ReportRange {
  const range = Number(value);
  return reportRanges.includes(range as ReportRange)
    ? (range as ReportRange)
    : 30;
}

function dateKey(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function getReportData(
  range: ReportRange,
  storeId?: string | null,
): Promise<ReportData> {
  await ensurePaymentLedger();
  const [summaryResult, dailyResult, serviceResult, statusResult, methodResult] =
    await Promise.all([
      pool.query(
        `SELECT
          COUNT(*)::int AS orders,
          COALESCE(SUM(amount) FILTER (WHERE payment_status='Paid'),0) AS revenue,
          COALESCE(AVG(amount),0) AS average_order,
          (
            SELECT COUNT(DISTINCT users.id)::int
            FROM app_users users
            INNER JOIN customer_orders customer_scope ON customer_scope.user_id=users.id
            WHERE users.role='customer'
              AND ($2::uuid IS NULL OR customer_scope.store_id=$2)
          ) AS customers
         FROM customer_orders
         WHERE created_at >= NOW() - ($1::int * interval '1 day')
           AND ($2::uuid IS NULL OR store_id=$2)`,
        [range, storeId ?? null],
      ),
      pool.query(
        `SELECT
          (created_at AT TIME ZONE 'Asia/Kolkata')::date AS report_date,
          COUNT(*)::int AS orders,
          COALESCE(SUM(amount) FILTER (WHERE payment_status='Paid'),0) AS revenue
         FROM customer_orders
         WHERE created_at >= NOW() - ($1::int * interval '1 day')
           AND ($2::uuid IS NULL OR store_id=$2)
         GROUP BY report_date
         ORDER BY report_date`,
        [range, storeId ?? null],
      ),
      pool.query(
        `SELECT service,COUNT(*)::int AS orders,
          COALESCE(SUM(amount) FILTER (WHERE payment_status='Paid'),0) AS revenue
         FROM customer_orders
         WHERE created_at >= NOW() - ($1::int * interval '1 day')
           AND ($2::uuid IS NULL OR store_id=$2)
         GROUP BY service
         ORDER BY orders DESC,revenue DESC
         LIMIT 10`,
        [range, storeId ?? null],
      ),
      pool.query(
        `SELECT status,COUNT(*)::int AS orders
         FROM customer_orders
         WHERE created_at >= NOW() - ($1::int * interval '1 day')
           AND ($2::uuid IS NULL OR store_id=$2)
         GROUP BY status
         ORDER BY orders DESC,status`,
        [range, storeId ?? null],
      ),
      pool.query(
        `SELECT customer_payments.method,COUNT(*)::int AS transactions,
          COALESCE(SUM(customer_payments.amount),0) AS amount
         FROM customer_payments
         LEFT JOIN customer_orders orders ON orders.id=customer_payments.order_id
         WHERE customer_payments.created_at >= NOW() - ($1::int * interval '1 day')
           AND customer_payments.status='Paid'
           AND ($2::uuid IS NULL OR orders.store_id=$2)
         GROUP BY customer_payments.method
         ORDER BY amount DESC`,
        [range, storeId ?? null],
      ),
    ]);

  const summary = summaryResult.rows[0];
  return {
    range,
    summary: {
      revenue: Number(summary.revenue),
      orders: Number(summary.orders),
      customers: Number(summary.customers),
      averageOrder: Number(summary.average_order),
    },
    dailyOrders: dailyResult.rows.map((row) => ({
      date: dateKey(row.report_date),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    })),
    topServices: serviceResult.rows.map((row) => ({
      service: String(row.service),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    })),
    orderStatuses: statusResult.rows.map((row) => ({
      status: String(row.status),
      orders: Number(row.orders),
    })),
    paymentMethods: methodResult.rows.map((row) => ({
      method: String(row.method),
      transactions: Number(row.transactions),
      amount: Number(row.amount),
    })),
  };
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function createOrdersCsv(range: ReportRange, storeId?: string | null) {
  await ensurePaymentLedger();
  const { rows } = await pool.query(
    `SELECT orders.id,users.name AS customer,users.mobile,orders.service,
      orders.item_count,orders.status,orders.payment_method,
      orders.payment_status,orders.amount,orders.pickup_at,
      orders.delivery_at,orders.created_at
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     WHERE orders.created_at >= NOW() - ($1::int * interval '1 day')
       AND ($2::uuid IS NULL OR orders.store_id=$2)
     ORDER BY orders.created_at DESC`,
    [range, storeId ?? null],
  );
  const headers = [
    "Order ID",
    "Customer",
    "Mobile",
    "Service",
    "Items",
    "Order Status",
    "Payment Method",
    "Payment Status",
    "Amount",
    "Pickup At",
    "Delivered At",
    "Created At",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.customer,
      row.mobile,
      row.service,
      row.item_count,
      row.status,
      row.payment_method,
      row.payment_status,
      row.amount,
      row.pickup_at ? new Date(row.pickup_at).toISOString() : "",
      row.delivery_at ? new Date(row.delivery_at).toISOString() : "",
      new Date(row.created_at).toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );
  return [headers.map(csvCell).join(","), ...lines].join("\n");
}
