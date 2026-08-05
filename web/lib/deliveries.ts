import { pool } from "@/lib/db";
import {
  ensurePickupSchema,
  listPickupRiders,
  type PickupRider,
} from "@/lib/pickups";

export const deliveryStatuses = [
  "Ready",
  "Assigned",
  "Out for Delivery",
  "Delivered",
  "Failed",
] as const;

export type DeliveryStatus = (typeof deliveryStatuses)[number];

export type DeliveryTask = {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  address: string;
  service: string;
  amount: number;
  paymentStatus: string;
  scheduledAt: string;
  status: DeliveryStatus;
  riderId: string | null;
  riderName: string | null;
  notes: string;
};

export type DeliveryStats = {
  today: number;
  delivered: number;
  pending: number;
  unassigned: number;
};

let setupPromise: Promise<void> | null = null;

export function ensureDeliverySchema() {
  if (!setupPromise) {
    setupPromise = ensurePickupSchema()
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS order_deliveries (
            id BIGSERIAL PRIMARY KEY,
            order_id VARCHAR(20) NOT NULL UNIQUE REFERENCES customer_orders(id) ON DELETE CASCADE,
            rider_id BIGINT REFERENCES riders(id) ON DELETE SET NULL,
            scheduled_at TIMESTAMPTZ NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Ready',
            notes VARCHAR(180) NOT NULL DEFAULT '',
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS order_deliveries_schedule_idx
          ON order_deliveries(scheduled_at,status);
          UPDATE riders
          SET store_id = source.store_id
          FROM (
            SELECT DISTINCT ON (deliveries.rider_id)
              deliveries.rider_id, orders.store_id
            FROM order_deliveries deliveries
            INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
            WHERE deliveries.rider_id IS NOT NULL AND orders.store_id IS NOT NULL
            ORDER BY deliveries.rider_id, deliveries.scheduled_at DESC
          ) source
          WHERE riders.id=source.rider_id AND riders.store_id IS NULL;
        `),
      )
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

export async function syncDeliveryTasks() {
  await ensureDeliverySchema();
  await pool.query(`
    INSERT INTO order_deliveries (order_id,scheduled_at,status)
    SELECT orders.id,
      COALESCE(
        orders.delivery_at,
        GREATEST(orders.pickup_at + interval '1 day',NOW())
      ),
      CASE
        WHEN orders.status='Delivered' THEN 'Delivered'
        WHEN orders.status='Out for Delivery' THEN 'Out for Delivery'
        ELSE 'Ready'
      END
    FROM customer_orders orders
    WHERE orders.status IN ('Ready','Out for Delivery','Delivered')
    ON CONFLICT (order_id) DO NOTHING
  `);
}

function statusFromValue(value: unknown): DeliveryStatus {
  return deliveryStatuses.includes(value as DeliveryStatus)
    ? (value as DeliveryStatus)
    : "Ready";
}

export async function listDeliveryRiders(storeId?: string | null): Promise<PickupRider[]> {
  return listPickupRiders(storeId);
}

export async function listDeliveryTasks(storeId?: string | null) {
  await syncDeliveryTasks();
  const { rows } = await pool.query(
    `SELECT deliveries.id,deliveries.order_id,deliveries.scheduled_at,
      deliveries.status,deliveries.rider_id,deliveries.notes,
      orders.address_text,orders.service,orders.amount,orders.payment_status,
      users.name AS customer_name,users.mobile AS customer_mobile,
      riders.name AS rider_name
     FROM order_deliveries deliveries
     INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
     INNER JOIN app_users users ON users.id=orders.user_id
     LEFT JOIN riders ON riders.id=deliveries.rider_id
     WHERE ($1::uuid IS NULL OR orders.store_id=$1)
     ORDER BY
       CASE WHEN deliveries.status='Delivered' THEN 1 ELSE 0 END,
       deliveries.scheduled_at`,
    [storeId ?? null],
  );
  return rows.map(
    (row): DeliveryTask => ({
      id: String(row.id),
      orderId: String(row.order_id),
      customerName: String(row.customer_name),
      customerMobile: String(row.customer_mobile),
      address: String(row.address_text),
      service: String(row.service),
      amount: Number(row.amount),
      paymentStatus: String(row.payment_status),
      scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
      status: statusFromValue(row.status),
      riderId: row.rider_id === null ? null : String(row.rider_id),
      riderName: row.rider_name === null ? null : String(row.rider_name),
      notes: String(row.notes),
    }),
  );
}

export async function getDeliveryStats(storeId?: string | null): Promise<DeliveryStats> {
  await syncDeliveryTasks();
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE deliveries.scheduled_at >= date_trunc('day',NOW())
          AND deliveries.scheduled_at < date_trunc('day',NOW()) + interval '1 day'
      )::int AS today,
      COUNT(*) FILTER (WHERE deliveries.status='Delivered')::int AS delivered,
      COUNT(*) FILTER (WHERE deliveries.status NOT IN ('Delivered','Failed'))::int AS pending,
      COUNT(*) FILTER (
        WHERE deliveries.rider_id IS NULL AND deliveries.status NOT IN ('Delivered','Failed')
      )::int AS unassigned
    FROM order_deliveries deliveries
    INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
    WHERE ($1::uuid IS NULL OR orders.store_id=$1)
  `, [storeId ?? null]);
  return {
    today: Number(rows[0].today),
    delivered: Number(rows[0].delivered),
    pending: Number(rows[0].pending),
    unassigned: Number(rows[0].unassigned),
  };
}

const deliveryTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  Ready: ["Assigned", "Failed"],
  Assigned: ["Out for Delivery", "Failed"],
  "Out for Delivery": ["Delivered", "Failed"],
  Delivered: [],
  Failed: ["Ready"],
};

export async function updateDeliveryTask(
  id: string,
  input: {
    riderId?: string;
    status?: DeliveryStatus;
    scheduledAt?: string;
    notes?: string;
  },
  storeId?: string | null,
) {
  await syncDeliveryTasks();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT deliveries.*,orders.user_id,orders.status AS order_status
       FROM order_deliveries deliveries
       INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
       WHERE deliveries.id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2) FOR UPDATE`,
      [id, storeId ?? null],
    );
    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }

    const current = currentResult.rows[0];
    const currentStatus = statusFromValue(current.status);
    let nextStatus = input.status ?? currentStatus;
    const riderId =
      input.riderId ??
      (current.rider_id === null ? null : String(current.rider_id));

    if (input.riderId && currentStatus === "Ready" && !input.status) {
      nextStatus = "Assigned";
    }
    if (
      nextStatus !== currentStatus &&
      !deliveryTransitions[currentStatus].includes(nextStatus)
    ) {
      await client.query("ROLLBACK");
      return { kind: "invalid_transition" as const, currentStatus };
    }
    if (
      ["Assigned", "Out for Delivery", "Delivered"].includes(nextStatus) &&
      !riderId
    ) {
      await client.query("ROLLBACK");
      return { kind: "rider_required" as const };
    }

    await client.query(
      `UPDATE order_deliveries
       SET rider_id=$2,status=$3::varchar,
         scheduled_at=COALESCE($4::timestamptz,scheduled_at),
         notes=COALESCE($5,notes),
         completed_at=CASE WHEN $3::varchar='Delivered' THEN NOW() ELSE completed_at END,
         updated_at=NOW()
       WHERE id=$1`,
      [
        id,
        riderId,
        nextStatus,
        input.scheduledAt ?? null,
        input.notes ?? null,
      ],
    );

    if (
      nextStatus === "Out for Delivery" &&
      currentStatus !== nextStatus &&
      current.order_status === "Ready"
    ) {
      await client.query(
        `UPDATE customer_orders SET status='Out for Delivery',updated_at=NOW()
         WHERE id=$1`,
        [current.order_id],
      );
      await client.query(
        `INSERT INTO customer_order_status_history (order_id,status,note)
         VALUES ($1,'Out for Delivery','Rider left for delivery')`,
        [current.order_id],
      );
      await client.query(
        `INSERT INTO customer_notifications (user_id,title,message)
         VALUES ($1,'Out for Delivery',$2)`,
        [
          current.user_id,
          `Order #${current.order_id} is out for delivery.`,
        ],
      );
    }

    if (
      nextStatus === "Delivered" &&
      currentStatus !== nextStatus &&
      current.order_status === "Out for Delivery"
    ) {
      await client.query(
        `UPDATE customer_orders
         SET status='Delivered',delivery_at=NOW(),updated_at=NOW()
         WHERE id=$1`,
        [current.order_id],
      );
      await client.query(
        `INSERT INTO customer_order_status_history (order_id,status,note)
         VALUES ($1,'Delivered','Delivery completed')`,
        [current.order_id],
      );
      await client.query(
        `INSERT INTO customer_notifications (user_id,title,message)
         VALUES ($1,'Order Delivered',$2)`,
        [
          current.user_id,
          `Order #${current.order_id} has been delivered.`,
        ],
      );
    }

    await client.query("COMMIT");
    const tasks = await listDeliveryTasks(storeId);
    return {
      kind: "updated" as const,
      delivery: tasks.find((task) => task.id === id) ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
