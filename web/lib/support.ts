import { pool } from "@/lib/db";
import { ensureCustomerPortalSchema } from "@/lib/customer-portal";

export const complaintStatuses = ["Open", "In Progress", "Resolved"] as const;
export type ComplaintStatus = (typeof complaintStatuses)[number];

export type ComplaintRecord = {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  subject: string;
  details: string;
  response: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type ComplaintStats = {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
};

let supportSetupPromise: Promise<void> | null = null;

export async function ensureSupportSchema() {
  if (!supportSetupPromise) {
    supportSetupPromise = ensureCustomerPortalSchema()
      .then(() =>
        pool.query(`
          ALTER TABLE customer_complaints
          ADD COLUMN IF NOT EXISTS response TEXT NOT NULL DEFAULT '';
          ALTER TABLE customer_complaints
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
          ALTER TABLE customer_complaints
          ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
          CREATE INDEX IF NOT EXISTS customer_complaints_status_idx
          ON customer_complaints(status, created_at DESC);
        `),
      )
      .then(() => undefined)
      .catch((error) => {
        supportSetupPromise = null;
        throw error;
      });
  }
  return supportSetupPromise;
}

function mapComplaint(row: Record<string, unknown>): ComplaintRecord {
  const id = String(row.id);
  return {
    id,
    reference: `COMP${id.padStart(4, "0")}`,
    customerId: String(row.user_id),
    customerName: String(row.customer_name),
    customerMobile: String(row.customer_mobile ?? ""),
    subject: String(row.subject),
    details: String(row.details ?? ""),
    response: String(row.response ?? ""),
    status: row.status as ComplaintStatus,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    resolvedAt: row.resolved_at
      ? new Date(String(row.resolved_at)).toISOString()
      : null,
  };
}

const complaintSelect = `
  SELECT complaints.id, complaints.user_id, complaints.subject,
         complaints.details, complaints.response, complaints.status,
         complaints.created_at, complaints.updated_at, complaints.resolved_at,
         users.name AS customer_name, users.mobile AS customer_mobile
  FROM customer_complaints complaints
  INNER JOIN app_users users ON users.id = complaints.user_id
`;

export async function listComplaints() {
  await ensureSupportSchema();
  const { rows } = await pool.query(
    `${complaintSelect} ORDER BY
      CASE complaints.status
        WHEN 'Open' THEN 1
        WHEN 'In Progress' THEN 2
        ELSE 3
      END,
      complaints.created_at DESC`,
  );
  return rows.map(mapComplaint);
}

export async function getComplaintStats(): Promise<ComplaintStats> {
  await ensureSupportSchema();
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'Open')::int AS open,
      COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'Resolved')::int AS resolved,
      COUNT(*)::int AS total
    FROM customer_complaints
  `);
  return {
    open: Number(rows[0].open),
    inProgress: Number(rows[0].in_progress),
    resolved: Number(rows[0].resolved),
    total: Number(rows[0].total),
  };
}

export async function updateComplaint(
  id: string,
  status: ComplaintStatus,
  response: string,
) {
  await ensureSupportSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      "SELECT user_id, status FROM customer_complaints WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!current.rowCount) {
      await client.query("ROLLBACK");
      return null;
    }
    const updated = await client.query(
      `UPDATE customer_complaints
       SET status = $2::varchar,
           response = $3,
           updated_at = NOW(),
           resolved_at = CASE
             WHEN $2::varchar = 'Resolved' THEN COALESCE(resolved_at, NOW())
             ELSE NULL
           END
       WHERE id = $1
       RETURNING id`,
      [id, status, response],
    );
    const statusChanged = current.rows[0].status !== status;
    if (statusChanged || response) {
      const message = response
        ? `Support replied: ${response.slice(0, 220)}`
        : `Your complaint is now ${status}.`;
      await client.query(
        `INSERT INTO customer_notifications (user_id,title,message)
         VALUES ($1,$2,$3)`,
        [
          current.rows[0].user_id,
          status === "Resolved" ? "Complaint Resolved" : "Complaint Updated",
          message,
        ],
      );
    }
    const result = await client.query(
      `${complaintSelect} WHERE complaints.id = $1`,
      [updated.rows[0].id],
    );
    await client.query("COMMIT");
    return mapComplaint(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
