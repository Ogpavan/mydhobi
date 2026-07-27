import { pool } from "@/lib/db";
import {
  ensureCustomerPortalSchema,
  getPortalOrder,
  type PortalOrder,
} from "@/lib/customer-portal";
import {
  allowedOrderTransitions,
  orderStatuses,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";

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

export async function listAdminOrders() {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT orders.id,orders.service,orders.item_count,orders.amount,
      orders.pickup_at,orders.payment_status,orders.payment_method,
      orders.status,orders.created_at,users.name AS customer_name,
      users.mobile AS customer_mobile
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     ORDER BY orders.created_at DESC`,
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

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT orders.user_id,users.name,users.mobile,users.email
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     WHERE orders.id=$1 LIMIT 1`,
    [id],
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

export async function getAdminOrderStats(): Promise<AdminOrderStats> {
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
     FROM customer_orders`,
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
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      "SELECT user_id,status FROM customer_orders WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }

    const currentStatus = statusFromValue(currentResult.rows[0].status);
    if (!allowedOrderTransitions[currentStatus].includes(nextStatus)) {
      await client.query("ROLLBACK");
      return { kind: "invalid_transition" as const, currentStatus };
    }

    await client.query(
      `UPDATE customer_orders
       SET status=$2::varchar,
         delivery_at=CASE WHEN $2::varchar='Delivered' THEN NOW() ELSE delivery_at END,
         updated_at=NOW()
       WHERE id=$1`,
      [id, nextStatus],
    );
    await client.query(
      `INSERT INTO customer_order_status_history (order_id,status,note)
       VALUES ($1,$2,$3)`,
      [id, nextStatus, note],
    );
    await client.query(
      `INSERT INTO customer_notifications (user_id,title,message)
       VALUES ($1,$2,$3)`,
      [
        currentResult.rows[0].user_id,
        `Order ${nextStatus}`,
        `Order #${id} is now ${nextStatus.toLowerCase()}.`,
      ],
    );
    await client.query("COMMIT");
    return { kind: "updated" as const, order: await getAdminOrder(id) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
