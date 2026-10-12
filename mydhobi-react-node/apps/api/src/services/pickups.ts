import { ensureCustomerPortalSchema } from "@/lib/customer-portal";
import { pool } from "@/lib/db";
import { applyOrderStatusTransition } from "@/lib/order-workflow";
import { ensureReferralSchema } from "@/lib/referrals";
import type {
  PickupRider,
  PickupStats,
  PickupStatus,
  PickupTask,
} from "@mydhobi/domain/pickups";
import { isSchemaMigration } from "../database/schema-mode";
export type {
  PickupRider,
  PickupStats,
  PickupStatus,
  PickupTask,
} from "@mydhobi/domain/pickups";

export const pickupStatuses = [
  "Scheduled",
  "Assigned",
  "Out for Pickup",
  "Completed",
  "Failed",
  "Cancelled",
] as const;

let setupPromise: Promise<void> | null = null;

export function ensurePickupSchema() {
  if (!isSchemaMigration()) return Promise.resolve();

  if (!setupPromise) {
    setupPromise = ensureCustomerPortalSchema()
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS riders (
            id BIGSERIAL PRIMARY KEY,
            store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
            name VARCHAR(100) NOT NULL,
            mobile VARCHAR(10) NOT NULL UNIQUE,
            area VARCHAR(100) NOT NULL DEFAULT '',
            status VARCHAR(20) NOT NULL DEFAULT 'Available',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT riders_mobile_format CHECK (mobile ~ '^[0-9]{10}$')
          );
          INSERT INTO riders (name,mobile,area,status)
          VALUES
            ('Ramesh Kumar','9876543211','Whitefield','On Duty'),
            ('Suresh Yadav','9876543212','Koramangala','On Duty'),
            ('Imran Khan','9876543213','Indiranagar','Available'),
            ('Kiran Rao','9876543214','HSR Layout','Off Duty')
          ON CONFLICT (mobile) DO NOTHING;

          CREATE TABLE IF NOT EXISTS order_pickups (
            id BIGSERIAL PRIMARY KEY,
            order_id VARCHAR(20) NOT NULL UNIQUE REFERENCES customer_orders(id) ON DELETE CASCADE,
            rider_id BIGINT REFERENCES riders(id) ON DELETE SET NULL,
            scheduled_at TIMESTAMPTZ NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
            notes VARCHAR(180) NOT NULL DEFAULT '',
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS order_pickups_schedule_idx
          ON order_pickups(scheduled_at,status);
          ALTER TABLE riders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS riders_store_id_idx ON riders(store_id);
          UPDATE riders
          SET store_id = source.store_id
          FROM (
            SELECT DISTINCT ON (rider_id) rider_id, store_id
            FROM (
              SELECT pickups.rider_id, orders.store_id, pickups.scheduled_at
              FROM order_pickups pickups
              INNER JOIN customer_orders orders ON orders.id=pickups.order_id
              WHERE pickups.rider_id IS NOT NULL AND orders.store_id IS NOT NULL
            ) assignments
            ORDER BY rider_id, scheduled_at DESC
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

export async function syncPickupTasks() {
  await ensurePickupSchema();
  await pool.query(`
    INSERT INTO order_pickups (order_id,scheduled_at,status,notes)
    SELECT orders.id,orders.pickup_at,
      CASE WHEN orders.status IN ('Picked Up','In Cleaning','Ready','Out for Delivery','Delivered')
        THEN 'Completed' ELSE 'Scheduled' END,
      orders.instructions
    FROM customer_orders orders
    WHERE orders.status <> 'Cancelled'
    ON CONFLICT (order_id) DO NOTHING
  `);
  await pool.query(`
    UPDATE order_pickups pickups
    SET status=CASE
        WHEN orders.status='Cancelled' AND pickups.status <> 'Completed' THEN 'Cancelled'
        WHEN orders.status IN ('Picked Up','In Cleaning','Ready','Out for Delivery','Delivered') THEN 'Completed'
        ELSE pickups.status
      END,
      completed_at=CASE
        WHEN orders.status IN ('Picked Up','In Cleaning','Ready','Out for Delivery','Delivered')
          THEN COALESCE(pickups.completed_at,NOW())
        ELSE pickups.completed_at
      END,
      updated_at=NOW()
    FROM customer_orders orders
    WHERE pickups.order_id=orders.id
      AND ((orders.status='Cancelled' AND pickups.status NOT IN ('Completed','Cancelled'))
        OR (orders.status IN ('Picked Up','In Cleaning','Ready','Out for Delivery','Delivered') AND pickups.status <> 'Completed'))
  `);
}

function statusFromValue(value: unknown): PickupStatus {
  return pickupStatuses.includes(value as PickupStatus)
    ? (value as PickupStatus)
    : "Scheduled";
}

export async function listPickupRiders(storeId?: string | null) {
  await ensurePickupSchema();
  const { rows } = await pool.query(
    `SELECT id,name,mobile,area,status FROM riders
     WHERE status <> 'Off Duty'
       AND ($1::uuid IS NULL OR store_id=$1)
     ORDER BY name`,
    [storeId ?? null],
  );
  return rows.map((row): PickupRider => ({
    id: String(row.id),
    name: String(row.name),
    mobile: String(row.mobile),
    area: String(row.area),
    status: row.status === "On Duty" ? "On Duty" : "Available",
  }));
}

export async function listPickupTasks(storeId?: string | null) {
  await syncPickupTasks();
  const { rows } = await pool.query(
    `SELECT pickups.id,pickups.order_id,pickups.scheduled_at,pickups.status,
      pickups.rider_id,pickups.notes,orders.address_text,orders.service,
      users.name AS customer_name,users.mobile AS customer_mobile,
      riders.name AS rider_name
     FROM order_pickups pickups
     INNER JOIN customer_orders orders ON orders.id=pickups.order_id
     INNER JOIN app_users users ON users.id=orders.user_id
     LEFT JOIN riders ON riders.id=pickups.rider_id
     WHERE ($1::uuid IS NULL OR orders.store_id=$1)
     ORDER BY
       CASE WHEN pickups.status='Completed' THEN 1 ELSE 0 END,
    pickups.scheduled_at`,
    [storeId ?? null],
  );
  return rows.map((row): PickupTask => ({
    id: String(row.id),
    orderId: String(row.order_id),
    customerName: String(row.customer_name),
    customerMobile: String(row.customer_mobile),
    address: String(row.address_text),
    service: String(row.service),
    scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
    status: statusFromValue(row.status),
    riderId: row.rider_id === null ? null : String(row.rider_id),
    riderName: row.rider_name === null ? null : String(row.rider_name),
    notes: String(row.notes),
  }));
}

export async function getPickupStats(
  storeId?: string | null,
): Promise<PickupStats> {
  await syncPickupTasks();
  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (
        WHERE pickups.scheduled_at >= date_trunc('day',NOW())
          AND pickups.scheduled_at < date_trunc('day',NOW()) + interval '1 day'
      )::int AS today,
      COUNT(*) FILTER (WHERE pickups.status='Completed')::int AS completed,
      COUNT(*) FILTER (WHERE pickups.status NOT IN ('Completed','Failed','Cancelled'))::int AS pending,
      COUNT(*) FILTER (
        WHERE pickups.rider_id IS NULL AND pickups.status NOT IN ('Completed','Failed','Cancelled')
      )::int AS unassigned
    FROM order_pickups pickups
    INNER JOIN customer_orders orders ON orders.id=pickups.order_id
    WHERE ($1::uuid IS NULL OR orders.store_id=$1)
  `,
    [storeId ?? null],
  );
  return {
    today: Number(rows[0].today),
    completed: Number(rows[0].completed),
    pending: Number(rows[0].pending),
    unassigned: Number(rows[0].unassigned),
  };
}

const pickupTransitions: Record<PickupStatus, PickupStatus[]> = {
  Scheduled: ["Assigned", "Failed"],
  Assigned: ["Out for Pickup", "Failed"],
  "Out for Pickup": ["Completed", "Failed"],
  Completed: [],
  Failed: ["Scheduled"],
  Cancelled: [],
};

export async function updatePickupTask(
  id: string,
  input: {
    riderId?: string;
    status?: PickupStatus;
    scheduledAt?: string;
    notes?: string;
  },
  storeId?: string | null,
) {
  await Promise.all([syncPickupTasks(), ensureReferralSchema()]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT pickups.*,orders.user_id,orders.status AS order_status,
        orders.store_id AS order_store_id
       FROM order_pickups pickups
       INNER JOIN customer_orders orders ON orders.id=pickups.order_id
       WHERE pickups.id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2) FOR UPDATE`,
      [id, storeId ?? null],
    );
    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    const current = currentResult.rows[0];
    if (
      current.order_status === "Cancelled" ||
      current.order_status === "Delivered"
    ) {
      await client.query("ROLLBACK");
      return { kind: "order_closed" as const };
    }
    const currentStatus = statusFromValue(current.status);
    let nextStatus = input.status ?? currentStatus;
    const riderId =
      input.riderId ??
      (current.rider_id === null ? null : String(current.rider_id));

    if (input.riderId && currentStatus === "Scheduled" && !input.status) {
      nextStatus = "Assigned";
    }
    if (
      nextStatus !== currentStatus &&
      !pickupTransitions[currentStatus].includes(nextStatus)
    ) {
      await client.query("ROLLBACK");
      return { kind: "invalid_transition" as const, currentStatus };
    }
    if (
      ["Assigned", "Out for Pickup", "Completed"].includes(nextStatus) &&
      !riderId
    ) {
      await client.query("ROLLBACK");
      return { kind: "rider_required" as const };
    }
    if (riderId) {
      const rider = await client.query(
        `SELECT id FROM riders
         WHERE id=$1 AND status <> 'Off Duty'
           AND store_id IS NOT DISTINCT FROM $2::uuid`,
        [riderId, current.order_store_id],
      );
      if (!rider.rows[0]) {
        await client.query("ROLLBACK");
        return { kind: "invalid_rider" as const };
      }
    }

    await client.query(
      `UPDATE order_pickups
       SET rider_id=$2,status=$3::varchar,
         scheduled_at=COALESCE($4::timestamptz,scheduled_at),
         notes=COALESCE($5,notes),
         completed_at=CASE WHEN $3::varchar='Completed' THEN NOW() ELSE completed_at END,
         updated_at=NOW()
       WHERE id=$1`,
      [id, riderId, nextStatus, input.scheduledAt ?? null, input.notes ?? null],
    );

    if (nextStatus !== currentStatus) {
      if (nextStatus === "Out for Pickup") {
        await client.query(
          `INSERT INTO customer_notifications (user_id,title,message)
           VALUES ($1,'Rider on the way',$2)`,
          [
            current.user_id,
            `Our rider is on the way for order #${current.order_id}.`,
          ],
        );
      }
      if (nextStatus === "Completed" && current.order_status === "New") {
        const orderResult = await applyOrderStatusTransition(
          client,
          String(current.order_id),
          "Picked Up",
          "Pickup completed",
          storeId,
        );
        if (orderResult.kind !== "updated") {
          await client.query("ROLLBACK");
          return orderResult;
        }
      }
    }

    await client.query("COMMIT");
    const tasks = await listPickupTasks(storeId);
    return {
      kind: "updated" as const,
      pickup: tasks.find((task) => task.id === id) ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
