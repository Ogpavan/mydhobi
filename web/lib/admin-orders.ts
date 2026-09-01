import { pool } from "@/lib/db";
import {
  ensureCustomerPortalSchema,
  getPortalOrder,
  type PortalOrder,
} from "@/lib/customer-portal";
import {
  orderStatuses,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import { allowedOrderTransitions } from "@/lib/order-lifecycle";
import { applyOrderStatusTransition } from "@/lib/order-workflow";
import { ensureReferralSchema } from "@/lib/referrals";
import { ensurePaymentLedger } from "@/lib/payments";

export { allowedOrderTransitions };

export type AdminOrderSummary = {
  id: string;
  customerName: string;
  customerMobile: string;
  service: string;
  itemCount: number;
  amount: number;
  pickupAt: string;
  paymentStatus: string;
  paymentMethod: string;
  status: PortalOrderStatus;
  createdAt: string;
};

export type AdminOrder = PortalOrder & {
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
};

export type AdminOrderStats = {
  total: number;
  inProcess: number;
  ready: number;
  todayRevenue: number;
};

function statusFromValue(value: unknown): PortalOrderStatus {
  return orderStatuses.includes(value as PortalOrderStatus)
    ? (value as PortalOrderStatus)
    : "New";
}

export async function listAdminOrders(storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT orders.id,orders.service,orders.item_count,orders.amount,
      orders.pickup_at,orders.payment_status,orders.payment_method,
      orders.status,orders.created_at,users.name AS customer_name,
      users.mobile AS customer_mobile
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     WHERE ($1::uuid IS NULL OR orders.store_id=$1)
     ORDER BY orders.created_at DESC
     LIMIT 500`,
    [storeId ?? null],
  );

  return rows.map(
    (row): AdminOrderSummary => ({
      id: String(row.id),
      customerName: String(row.customer_name),
      customerMobile: String(row.customer_mobile),
      service: String(row.service),
      itemCount: Number(row.item_count),
      amount: Number(row.amount),
      pickupAt: new Date(String(row.pickup_at)).toISOString(),
      paymentStatus: String(row.payment_status),
      paymentMethod: String(row.payment_method),
      status: statusFromValue(row.status),
      createdAt: new Date(String(row.created_at)).toISOString(),
    }),
  );
}

export async function getAdminOrder(id: string, storeId?: string | null): Promise<AdminOrder | null> {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT orders.user_id,users.name,users.mobile,users.email
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     WHERE orders.id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2) LIMIT 1`,
    [id, storeId ?? null],
  );
  if (!rows[0]) return null;

  const order = await getPortalOrder(String(rows[0].user_id), id);
  if (!order) return null;

  return {
    ...order,
    customerId: String(rows[0].user_id),
    customerName: String(rows[0].name),
    customerMobile: String(rows[0].mobile),
    customerEmail: String(rows[0].email),
  };
}

export async function getAdminOrderStats(storeId?: string | null): Promise<AdminOrderStats> {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE status IN ('New','Picked Up','In Cleaning','Out for Delivery')
      )::int AS in_process,
      COUNT(*) FILTER (WHERE status='Ready')::int AS ready,
      COALESCE(SUM(amount) FILTER (
        WHERE payment_status='Paid' AND created_at::date=CURRENT_DATE
      ),0) AS today_revenue
     FROM customer_orders
     WHERE ($1::uuid IS NULL OR store_id=$1)`,
    [storeId ?? null],
  );
  return {
    total: Number(rows[0].total),
    inProcess: Number(rows[0].in_process),
    ready: Number(rows[0].ready),
    todayRevenue: Number(rows[0].today_revenue),
  };
}

export async function updateAdminOrderStatus(
  id: string,
  nextStatus: PortalOrderStatus,
  note: string,
  storeId?: string | null,
) {
  await Promise.all([
    ensureCustomerPortalSchema(),
    ensureReferralSchema(),
    ensurePaymentLedger(),
  ]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await applyOrderStatusTransition(
      client,
      id,
      nextStatus,
      note,
      storeId,
    );
    if (result.kind !== "updated") {
      await client.query("ROLLBACK");
      return result;
    }
    await client.query("COMMIT");
    return { kind: "updated" as const, order: await getAdminOrder(id, storeId) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
