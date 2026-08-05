import { pool } from "@/lib/db";
import { ensureDeliverySchema } from "@/lib/deliveries";

export const riderStatuses = ["Available", "On Duty", "Off Duty"] as const;
export type RiderStatus = (typeof riderStatuses)[number];

export type RiderRecord = {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: RiderStatus;
  todayJobs: number;
  activeJobs: number;
};

export type RiderJob = {
  id: string;
  type: "Pickup" | "Delivery";
  orderId: string;
  customerName: string;
  address: string;
  scheduledAt: string;
  status: string;
};

export type RiderDetails = RiderRecord & {
  jobs: RiderJob[];
};

function statusFromValue(value: unknown): RiderStatus {
  return riderStatuses.includes(value as RiderStatus)
    ? (value as RiderStatus)
    : "Available";
}

function mapRider(row: Record<string, unknown>): RiderRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    mobile: String(row.mobile),
    area: String(row.area),
    status: statusFromValue(row.status),
    todayJobs: Number(row.today_jobs ?? 0),
    activeJobs: Number(row.active_jobs ?? 0),
  };
}

export async function listRiders(storeId?: string | null) {
  await ensureDeliverySchema();
  const { rows } = await pool.query(`
    SELECT riders.id,riders.name,riders.mobile,riders.area,riders.status,
      (
        SELECT COUNT(*) FROM (
          SELECT pickups.id,pickups.scheduled_at
          FROM order_pickups pickups
          INNER JOIN customer_orders pickup_orders ON pickup_orders.id=pickups.order_id
          WHERE pickups.rider_id=riders.id
            AND ($1::uuid IS NULL OR pickup_orders.store_id=$1)
          UNION ALL
          SELECT deliveries.id,deliveries.scheduled_at
          FROM order_deliveries deliveries
          INNER JOIN customer_orders delivery_orders ON delivery_orders.id=deliveries.order_id
          WHERE deliveries.rider_id=riders.id
            AND ($1::uuid IS NULL OR delivery_orders.store_id=$1)
        ) jobs
        WHERE jobs.scheduled_at >= date_trunc('day',NOW())
          AND jobs.scheduled_at < date_trunc('day',NOW()) + interval '1 day'
      )::int AS today_jobs,
      (
        SELECT COUNT(*) FROM (
          SELECT pickups.id FROM order_pickups pickups
          INNER JOIN customer_orders pickup_orders ON pickup_orders.id=pickups.order_id
          WHERE pickups.rider_id=riders.id
            AND ($1::uuid IS NULL OR pickup_orders.store_id=$1)
            AND pickups.status NOT IN ('Completed','Failed')
          UNION ALL
          SELECT deliveries.id FROM order_deliveries deliveries
          INNER JOIN customer_orders delivery_orders ON delivery_orders.id=deliveries.order_id
          WHERE deliveries.rider_id=riders.id
            AND ($1::uuid IS NULL OR delivery_orders.store_id=$1)
            AND deliveries.status NOT IN ('Delivered','Failed')
        ) jobs
      )::int AS active_jobs
    FROM riders
    WHERE ($1::uuid IS NULL OR riders.store_id=$1)
    ORDER BY
      CASE riders.status
        WHEN 'On Duty' THEN 0
        WHEN 'Available' THEN 1
        ELSE 2
      END,
      riders.name
  `, [storeId ?? null]);
  return rows.map(mapRider);
}

export async function getRider(id: string, storeId?: string | null): Promise<RiderDetails | null> {
  await ensureDeliverySchema();
  const { rows } = await pool.query(
    `SELECT riders.id,riders.name,riders.mobile,riders.area,riders.status,
      0::int AS today_jobs,0::int AS active_jobs
     FROM riders WHERE riders.id=$1 AND ($2::uuid IS NULL OR riders.store_id=$2) LIMIT 1`,
    [id, storeId ?? null],
  );
  if (!rows[0]) return null;

  const jobsResult = await pool.query(
    `SELECT * FROM (
       SELECT pickups.id,'Pickup' AS type,pickups.order_id,
         users.name AS customer_name,orders.address_text,
         pickups.scheduled_at,pickups.status
       FROM order_pickups pickups
       INNER JOIN customer_orders orders ON orders.id=pickups.order_id
       INNER JOIN app_users users ON users.id=orders.user_id
       WHERE pickups.rider_id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2)
       UNION ALL
       SELECT deliveries.id,'Delivery' AS type,deliveries.order_id,
         users.name AS customer_name,orders.address_text,
         deliveries.scheduled_at,deliveries.status
       FROM order_deliveries deliveries
       INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
       INNER JOIN app_users users ON users.id=orders.user_id
       WHERE deliveries.rider_id=$1 AND ($2::uuid IS NULL OR orders.store_id=$2)
     ) jobs
     ORDER BY scheduled_at DESC LIMIT 100`,
    [id, storeId ?? null],
  );
  const jobs: RiderJob[] = jobsResult.rows.map((row) => ({
    id: String(row.id),
    type: row.type === "Delivery" ? "Delivery" : "Pickup",
    orderId: String(row.order_id),
    customerName: String(row.customer_name),
    address: String(row.address_text),
    scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
    status: String(row.status),
  }));
  const rider = mapRider({
    ...rows[0],
    today_jobs: jobs.filter((job) => {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      return (
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
        }).format(new Date(job.scheduledAt)) === today
      );
    }).length,
    active_jobs: jobs.filter(
      (job) =>
        !["Completed", "Delivered", "Failed"].includes(job.status),
    ).length,
  });
  return { ...rider, jobs };
}

export async function createRider(input: {
  name: string;
  mobile: string;
  area: string;
  status: RiderStatus;
  storeId?: string | null;
}) {
  await ensureDeliverySchema();
  const { rows } = await pool.query(
    `INSERT INTO riders (name,mobile,area,status,store_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id,name,mobile,area,status,0::int AS today_jobs,
       0::int AS active_jobs`,
    [input.name, input.mobile, input.area, input.status, input.storeId ?? null],
  );
  return mapRider(rows[0]);
}

export async function updateRider(
  id: string,
  input: {
    name?: string;
    mobile?: string;
    area?: string;
    status?: RiderStatus;
    storeId?: string | null;
  },
) {
  await ensureDeliverySchema();
  const { rows } = await pool.query(
    `UPDATE riders SET
      name=COALESCE($2,name),
      mobile=COALESCE($3,mobile),
      area=COALESCE($4,area),
      status=COALESCE($5,status),
      updated_at=NOW()
     WHERE id=$1 AND ($6::uuid IS NULL OR store_id=$6)
     RETURNING id,name,mobile,area,status,0::int AS today_jobs,
       0::int AS active_jobs`,
    [
      id,
      input.name ?? null,
      input.mobile ?? null,
      input.area ?? null,
      input.status ?? null,
      input.storeId ?? null,
    ],
  );
  return rows[0] ? mapRider(rows[0]) : null;
}
