import { pool } from "@/lib/db";
import { ensureCustomerPortalSchema } from "@/lib/customer-portal";

export const pickupStatuses = [
  "Scheduled",
  "Assigned",
  "Out for Pickup",
  "Completed",
  "Failed",
] as const;

export type PickupStatus = (typeof pickupStatuses)[number];

export type PickupRider = {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: "Available" | "On Duty" | "Off Duty";
};

export type PickupTask = {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  address: string;
  service: string;
  scheduledAt: string;
  status: PickupStatus;
  riderId: string | null;
  riderName: string | null;
  notes: string;
};

export type PickupStats = {
  today: number;
  completed: number;
  pending: number;
  unassigned: number;
};

let setupPromise: Promise<void> | null = null;

export function ensurePickupSchema() {
  if (!setupPromise) {
    setupPromise = ensureCustomerPortalSchema()
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS riders (
            id BIGSERIAL PRIMARY KEY,
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
}

function statusFromValue(value: unknown): PickupStatus {
  return pickupStatuses.includes(value as PickupStatus)
    ? (value as PickupStatus)
    : "Scheduled";
}

export async function listPickupRiders() {
  await ensurePickupSchema();
  const { rows } = await pool.query(
    `SELECT id,name,mobile,area,status FROM riders
     WHERE status <> 'Off Duty' ORDER BY name`,
  );
  return rows.map(
    (row): PickupRider => ({
      id: String(row.id),
      name: String(row.name),
      mobile: String(row.mobile),
      area: String(row.area),
      status: row.status === "On Duty" ? "On Duty" : "Available",
    }),
  );
}

export async function listPickupTasks() {
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
     ORDER BY
       CASE WHEN pickups.status='Completed' THEN 1 ELSE 0 END,
       pickups.scheduled_at`,
  );
  return rows.map(
    (row): PickupTask => ({
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
    }),
  );
}

export async function getPickupStats(): Promise<PickupStats> {
  await syncPickupTasks();
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE scheduled_at >= date_trunc('day',NOW())
          AND scheduled_at < date_trunc('day',NOW()) + interval '1 day'
      )::int AS today,
      COUNT(*) FILTER (WHERE status='Completed')::int AS completed,
      COUNT(*) FILTER (WHERE status NOT IN ('Completed','Failed'))::int AS pending,
      COUNT(*) FILTER (
        WHERE rider_id IS NULL AND status NOT IN ('Completed','Failed')
      )::int AS unassigned
    FROM order_pickups
  `);
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
};

export async function updatePickupTask(
  id: string,
  input: {
    riderId?: string;
    status?: PickupStatus;
    scheduledAt?: string;
    notes?: string;
  },
) {
  await syncPickupTasks();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT pickups.*,orders.user_id,orders.status AS order_status
       FROM order_pickups pickups
       INNER JOIN customer_orders orders ON orders.id=pickups.order_id
       WHERE pickups.id=$1 FOR UPDATE`,
      [id],
    );
    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    const current = currentResult.rows[0];
    const currentStatus = statusFromValue(current.status);
    let nextStatus = input.status ?? currentStatus;
    const riderId = input.riderId ?? (
      current.rider_id === null ? null : String(current.rider_id)
    );

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

    await client.query(
      `UPDATE order_pickups
       SET rider_id=$2,status=$3::varchar,
         scheduled_at=COALESCE($4::timestamptz,scheduled_at),
         notes=COALESCE($5,notes),
         completed_at=CASE WHEN $3::varchar='Completed' THEN NOW() ELSE completed_at END,
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
        await client.query(
          `UPDATE customer_orders SET status='Picked Up',updated_at=NOW()
           WHERE id=$1`,
          [current.order_id],
        );
        await client.query(
          `INSERT INTO customer_order_status_history (order_id,status,note)
           VALUES ($1,'Picked Up','Pickup completed')`,
          [current.order_id],
        );
        await client.query(
          `INSERT INTO customer_notifications (user_id,title,message)
           VALUES ($1,'Order Picked Up',$2)`,
          [
            current.user_id,
            `Your clothes for order #${current.order_id} have been picked up.`,
          ],
        );
      }
    }

    await client.query("COMMIT");
    const tasks = await listPickupTasks();
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
