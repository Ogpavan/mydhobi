import {
  ensureCustomerPortalSchema,
  getPortalOrder,
} from "@/lib/customer-portal";
import { pool } from "@/lib/db";
import { getCustomerItemPrice, listCustomerItemCatalog } from "@/lib/item-master";
import {
  allowedOrderTransitions,
  orderStatuses,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import { applyOrderStatusTransition } from "@/lib/order-workflow";
import {
  ensurePaymentLedger,
  updatePaymentStatus,
  type PaymentStatus,
} from "@/lib/payments";
import { ensureReferralSchema } from "@/lib/referrals";
import type {
  AdminOrder,
  AdminOrderStats,
  AdminOrderSummary,
} from "@mydhobi/domain/admin-orders";
export type {
  AdminOrder,
  AdminOrderStats,
  AdminOrderSummary,
} from "@mydhobi/domain/admin-orders";

export { allowedOrderTransitions };

function statusFromValue(value: unknown): PortalOrderStatus {
  return orderStatuses.includes(value as PortalOrderStatus)
    ? (value as PortalOrderStatus)
    : "New";
}

export async function listAdminOrders(storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT orders.id,orders.store_id,stores.name AS store_name,
      orders.service,orders.item_count,orders.amount,
      orders.pickup_at,orders.payment_status,orders.payment_method,
      orders.status,orders.created_at,users.name AS customer_name,
      users.mobile AS customer_mobile
     FROM customer_orders orders
     INNER JOIN app_users users ON users.id=orders.user_id
     LEFT JOIN stores ON stores.id=orders.store_id
     WHERE ($1::uuid IS NULL OR orders.store_id=$1)
     ORDER BY orders.created_at DESC
     LIMIT 500`,
    [storeId ?? null],
  );

  return rows.map((row): AdminOrderSummary => ({
    id: String(row.id),
    storeId: row.store_id === null ? null : String(row.store_id),
    storeName: row.store_name === null ? null : String(row.store_name),
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
  }));
}

export async function getAdminOrder(
  id: string,
  storeId?: string | null,
): Promise<AdminOrder | null> {
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

  const [pickupResult, deliveryResult, paymentResult] = await Promise.all([
    pool.query(
      `SELECT pickups.id,pickups.scheduled_at,pickups.status,pickups.rider_id,
         pickups.notes,riders.name AS rider_name
       FROM order_pickups pickups
       LEFT JOIN riders ON riders.id=pickups.rider_id
       WHERE pickups.order_id=$1 LIMIT 1`,
      [id],
    ),
    pool.query(
      `SELECT deliveries.id,deliveries.scheduled_at,deliveries.status,
         deliveries.rider_id,deliveries.notes,riders.name AS rider_name
       FROM order_deliveries deliveries
       LEFT JOIN riders ON riders.id=deliveries.rider_id
       WHERE deliveries.order_id=$1 LIMIT 1`,
      [id],
    ),
    pool.query(
      `SELECT id,reference,method,status,amount
       FROM customer_payments
       WHERE order_id=$1 AND kind='Order'
       ORDER BY created_at DESC LIMIT 1`,
      [id],
    ),
  ]);
  function task(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
      status: String(row.status),
      riderId: row.rider_id === null ? null : String(row.rider_id),
      riderName: row.rider_name === null ? null : String(row.rider_name),
      notes: String(row.notes ?? ""),
    };
  }

  return {
    ...order,
    customerId: String(rows[0].user_id),
    customerName: String(rows[0].name),
    customerMobile: String(rows[0].mobile),
    customerEmail: String(rows[0].email),
    pickupTask: pickupResult.rows[0] ? task(pickupResult.rows[0]) : null,
    deliveryTask: deliveryResult.rows[0] ? task(deliveryResult.rows[0]) : null,
    payment: paymentResult.rows[0]
      ? {
          id: String(paymentResult.rows[0].id),
          reference: String(paymentResult.rows[0].reference),
          method: String(paymentResult.rows[0].method),
          status: String(paymentResult.rows[0].status),
          amount: Number(paymentResult.rows[0].amount),
        }
      : null,
    inspectionCatalog: order.invoicePending
      ? (await listCustomerItemCatalog(order.storeId)).services
          .filter((service) => service.isActive)
          .map((service) => ({
            garmentId: service.garmentId,
            garmentName: service.garmentName,
            serviceId: service.id,
            serviceName: service.name,
            price: service.regularPrice,
            unit: service.unit,
          }))
      : [],
  };
}

export type AdminInspectionItem = {
  garmentId: string;
  serviceId: string;
  quantity: number;
  rate?: number;
  discountPerItem?: number;
  stain?: string;
  damage?: string;
  fabric?: string;
  instructions?: string;
  photoUrls?: string[];
};

export async function completeAdminOrderInspection(
  id: string,
  items: AdminInspectionItem[],
  storeId?: string | null,
  staffId?: string,
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query<{
      user_id: string;
      store_id: string | null;
      status: string;
      invoice_pending: boolean;
    }>(
      `SELECT user_id,store_id,status,invoice_pending FROM customer_orders
       WHERE id=$1 AND ($2::uuid IS NULL OR store_id=$2) FOR UPDATE`,
      [id, storeId ?? null],
    );
    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    if (!current.invoice_pending || ["Delivered", "Cancelled"].includes(current.status)) {
      await client.query("ROLLBACK");
      return { kind: "inspection_closed" as const };
    }
    const priced = await Promise.all(items.map(async (item) => {
      const catalog = await getCustomerItemPrice(Number(item.garmentId), Number(item.serviceId), current.store_id);
      if (!catalog) throw new Error("ITEM_SERVICE_PRICE_NOT_FOUND");
      const baseRate = item.rate ?? catalog.price;
      const discount = Math.min(item.discountPerItem ?? 0, baseRate);
      return { ...item, catalog, baseRate, discount, rate: baseRate - discount };
    }));
    const quantity = priced.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = priced.reduce((sum, item) => sum + item.quantity * item.baseRate, 0);
    const discount = priced.reduce((sum, item) => sum + item.quantity * item.discount, 0);
    const amount = Math.max(0, subtotal - discount);

    await client.query("DELETE FROM customer_order_items WHERE order_id=$1", [id]);
    await client.query("DELETE FROM customer_order_inspection_notes WHERE order_id=$1", [id]);
    await client.query("DELETE FROM customer_order_item_photos WHERE order_id=$1", [id]);
    for (const item of priced) {
      const remark = [item.stain && `Stain: ${item.stain}`, item.damage && `Damage: ${item.damage}`, item.instructions].filter(Boolean).join(" · ").slice(0, 160);
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO customer_order_items
         (order_id,item_name,quantity,unit_price,base_unit_price,discount_type,discount_value,discount_amount,garment_id,garment_name,service_id,service_name,fabric,defect,remark)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [id, `${item.catalog.garmentName} · ${item.catalog.serviceName}`.slice(0, 100), item.quantity, item.rate, item.baseRate, item.discount > 0 ? "Flat" : "None", item.discount, item.discount * item.quantity, item.garmentId, item.catalog.garmentName, item.serviceId, item.catalog.serviceName, item.fabric ?? "", item.stain || item.damage ? `${item.stain ? `Stain: ${item.stain}` : ""}${item.stain && item.damage ? "; " : ""}${item.damage ? `Damage: ${item.damage}` : ""}` : "None", remark],
      );
      const itemId = inserted.rows[0].id;
      for (const [noteType, note] of [["stain", item.stain], ["damage", item.damage], ["care", item.instructions]] as const) {
        if (note?.trim()) await client.query(
          `INSERT INTO customer_order_inspection_notes(order_id,order_item_id,note_type,note,created_by) VALUES($1,$2,$3,$4,$5)`,
          [id, itemId, noteType, note.trim(), staffId ?? null],
        );
      }
      for (const photoUrl of item.photoUrls ?? []) await client.query(
        `INSERT INTO customer_order_item_photos(order_id,order_item_id,photo_url,created_by) VALUES($1,$2,$3,$4)`,
        [id, itemId, photoUrl, staffId ?? null],
      );
    }
    await client.query(
      `UPDATE customer_orders SET item_count=$2,amount=$3,discount_amount=$4,
       invoice_pending=FALSE,status='Awaiting Confirmation',payment_status='Unpaid',updated_at=NOW()
       WHERE id=$1`,
      [id, quantity, amount, discount],
    );
    await client.query(
      `INSERT INTO customer_payments(user_id,order_id,kind,method,status,amount,reference)
       VALUES($1,$2,'Order','cash','Pending',$3,$4)
       ON CONFLICT(reference) DO UPDATE SET amount=EXCLUDED.amount,status='Pending',updated_at=NOW()`,
      [current.user_id, id, amount, `ORDER-${id}`],
    );
    await client.query(
      `INSERT INTO customer_order_status_history(order_id,status,note) VALUES($1,'Awaiting Confirmation','Items inspected and final price set')`,
      [id],
    );
    await client.query(
      `INSERT INTO customer_notifications(user_id,title,message) VALUES($1,'Final Order Updated',$2)`,
      [current.user_id, `Your items were inspected. Review and confirm order #${id}.`],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { kind: "updated" as const, order: await getAdminOrder(id, storeId) };
}

export async function updateAdminOrderDetails(
  id: string,
  input: {
    pickupAt: string;
    paymentMethod: "cash" | "upi" | "card";
    instructions: string;
  },
  storeId?: string | null,
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT orders.id,orders.status,orders.payment_method,
         payments.status AS payment_status
       FROM customer_orders orders
       LEFT JOIN customer_payments payments
         ON payments.order_id=orders.id AND payments.kind='Order'
       WHERE orders.id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2)
       FOR UPDATE`,
      [id, storeId ?? null],
    );
    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    if (["Delivered", "Cancelled"].includes(String(current.status))) {
      await client.query("ROLLBACK");
      return { kind: "order_closed" as const };
    }
    if (
      current.payment_status &&
      current.payment_status !== "Pending" &&
      current.payment_method !== input.paymentMethod
    ) {
      await client.query("ROLLBACK");
      return { kind: "payment_closed" as const };
    }
    await client.query(
      `UPDATE customer_orders
       SET pickup_at=$2,payment_method=$3,instructions=$4,updated_at=NOW()
       WHERE id=$1`,
      [id, input.pickupAt, input.paymentMethod, input.instructions],
    );
    await client.query(
      `UPDATE order_pickups SET scheduled_at=$2,notes=$3,updated_at=NOW()
       WHERE order_id=$1`,
      [id, input.pickupAt, input.instructions],
    );
    await client.query(
      `UPDATE customer_payments SET method=$2,updated_at=NOW()
       WHERE order_id=$1 AND kind='Order' AND status='Pending'`,
      [id, input.paymentMethod],
    );
    await client.query(
      `INSERT INTO customer_order_status_history(order_id,status,note)
       VALUES($1,$2,'Order details updated')`,
      [id, current.status],
    );
    await client.query("COMMIT");
    return {
      kind: "updated" as const,
      order: await getAdminOrder(id, storeId),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAdminOrderPayment(
  orderId: string,
  nextStatus: PaymentStatus,
  storeId?: string | null,
) {
  await ensurePaymentLedger();
  const { rows } = await pool.query(
    `SELECT payments.id
     FROM customer_payments payments
     INNER JOIN customer_orders orders ON orders.id=payments.order_id
     WHERE payments.order_id=$1 AND payments.kind='Order'
       AND ($2::uuid IS NULL OR orders.store_id=$2)
     ORDER BY payments.created_at DESC LIMIT 1`,
    [orderId, storeId ?? null],
  );
  if (!rows[0]) return { kind: "not_found" as const };
  return updatePaymentStatus(String(rows[0].id), nextStatus, storeId);
}

export async function getAdminOrderStats(
  storeId?: string | null,
): Promise<AdminOrderStats> {
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
    return {
      kind: "updated" as const,
      order: await getAdminOrder(id, storeId),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
