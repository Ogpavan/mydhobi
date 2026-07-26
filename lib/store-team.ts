import { pool } from "@/lib/db";

export type StoreTeamRole = string;
export type StoreTeamStatus = "active" | "disabled";

export type StoreTeamMember = {
  id: string;
  storeId: string;
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  createdAt: string;
};

export type StoreTeamPayload = {
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
};

type StoreTeamRow = {
  id: string;
  store_id: string;
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  created_at: Date;
};

let setupPromise: Promise<void> | null = null;

export function ensureStoreTeamTable() {
  if (!setupPromise) {
    setupPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS store_team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE store_team_members DROP CONSTRAINT IF EXISTS store_team_members_role_check;

      CREATE UNIQUE INDEX IF NOT EXISTS store_team_members_store_mobile_unique
      ON store_team_members (store_id, mobile);

      CREATE INDEX IF NOT EXISTS store_team_members_store_id_idx
      ON store_team_members (store_id);
    `).then(() => undefined).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}

function mapStoreTeamMember(row: StoreTeamRow): StoreTeamMember {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export function normalizeStoreTeamPayload(
  input: Partial<StoreTeamPayload>,
): StoreTeamPayload {
  return {
    name: input.name?.trim().replace(/\s+/g, " ") ?? "",
    mobile: input.mobile?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    role: typeof input.role === "string" ? input.role.trim().toLowerCase() : "",
    status: input.status === "disabled" ? "disabled" : "active",
  };
}

export function validateStoreTeamPayload(payload: StoreTeamPayload) {
  if (!payload.name) return "Full name is required.";
  if (payload.name.length > 100) return "Full name is too long.";
  if (!/^\d{10}$/.test(payload.mobile)) {
    return "Enter a 10-digit mobile number.";
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Enter a valid email address.";
  }
  if (!payload.role) return "Select a role.";

  return null;
}

export async function listStoreTeamMembers(storeId: string) {
  await ensureStoreTeamTable();
  const { rows } = await pool.query<StoreTeamRow>(
    `SELECT id, store_id, name, mobile, email, role, status, created_at
     FROM store_team_members
     WHERE store_id = $1
     ORDER BY
       CASE role WHEN 'manager' THEN 0 ELSE 1 END,
       name ASC`,
    [storeId],
  );

  return rows.map(mapStoreTeamMember);
}

export async function createStoreTeamMember(
  storeId: string,
  payload: StoreTeamPayload,
) {
  await ensureStoreTeamTable();
  const { rows } = await pool.query<StoreTeamRow>(
    `INSERT INTO store_team_members (store_id, name, mobile, email, role, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, store_id, name, mobile, email, role, status, created_at`,
    [
      storeId,
      payload.name,
      payload.mobile,
      payload.email,
      payload.role,
      payload.status,
    ],
  );

  return mapStoreTeamMember(rows[0]);
}

export async function updateStoreTeamMember(id: string, payload: StoreTeamPayload) {
  await ensureStoreTeamTable();
  const { rows } = await pool.query<StoreTeamRow>(
    `UPDATE store_team_members SET name = $2, mobile = $3, email = $4, role = $5, status = $6, updated_at = NOW()
     WHERE id = $1 RETURNING id, store_id, name, mobile, email, role, status, created_at`,
    [id, payload.name, payload.mobile, payload.email, payload.role, payload.status],
  );
  return rows[0] ? mapStoreTeamMember(rows[0]) : null;
}

export async function deleteStoreTeamMember(id: string) {
  await ensureStoreTeamTable();
  const result = await pool.query(`DELETE FROM store_team_members WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
