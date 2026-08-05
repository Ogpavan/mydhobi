import bcrypt from "bcryptjs";

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
  userId: string | null;
  createdAt: string;
};

export type StoreTeamPayload = {
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  password?: string;
};

type StoreTeamRow = {
  id: string;
  store_id: string;
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  user_id: string | null;
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
        user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE store_team_members DROP CONSTRAINT IF EXISTS store_team_members_role_check;
      ALTER TABLE store_team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS store_team_members_store_mobile_unique
      ON store_team_members (store_id, mobile);

      CREATE INDEX IF NOT EXISTS store_team_members_store_id_idx
      ON store_team_members (store_id);
      CREATE UNIQUE INDEX IF NOT EXISTS store_team_members_user_id_unique
      ON store_team_members (user_id) WHERE user_id IS NOT NULL;
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
    userId: row.user_id === null ? null : String(row.user_id),
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
    `SELECT id, store_id, name, mobile, email, role, status, user_id, created_at
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const manager = payload.role === "manager" || payload.role === "store_manager";
    if (manager && (!payload.password || payload.password.length < 8)) {
      throw new Error("MANAGER_PASSWORD_REQUIRED");
    }
    const userResult = manager
      ? await client.query<{ id: string }>(
          `INSERT INTO app_users (email, mobile, password_hash, name, designation, role, status)
           VALUES ($1, $2, $3, $4, 'Store Manager', 'store_manager', $5)
           RETURNING id`,
          [
            payload.email || `manager.${payload.mobile}@mydhobi.local`,
            payload.mobile,
            await bcrypt.hash(payload.password ?? "", 12),
            payload.name,
            payload.status === "active" ? "active" : "disabled",
          ],
        )
      : null;
    const userId = userResult?.rows[0]?.id ?? null;
    const { rows } = await client.query<StoreTeamRow>(
      `INSERT INTO store_team_members (store_id, name, mobile, email, role, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, store_id, name, mobile, email, role, status, user_id, created_at`,
      [storeId, payload.name, payload.mobile, payload.email, payload.role, payload.status, userId],
    );
    await client.query("COMMIT");
    return mapStoreTeamMember(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateStoreTeamMember(id: string, payload: StoreTeamPayload) {
  await ensureStoreTeamTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query<StoreTeamRow>(
      `SELECT id, store_id, name, mobile, email, role, status, user_id, created_at
       FROM store_team_members WHERE id=$1 FOR UPDATE`,
      [id],
    );
    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    const manager = payload.role === "manager" || payload.role === "store_manager";
    let userId = current.user_id;
    if (manager && !userId) {
      if (!payload.password || payload.password.length < 8) {
        throw new Error("MANAGER_PASSWORD_REQUIRED");
      }
      const userResult = await client.query<{ id: string }>(
        `INSERT INTO app_users (email, mobile, password_hash, name, designation, role, status)
         VALUES ($1, $2, $3, $4, 'Store Manager', 'store_manager', $5)
         RETURNING id`,
        [
          payload.email || `manager.${payload.mobile}@mydhobi.local`,
          payload.mobile,
          await bcrypt.hash(payload.password, 12),
          payload.name,
          payload.status === "active" ? "active" : "disabled",
        ],
      );
      userId = userResult.rows[0].id;
    } else if (userId) {
      const passwordHash = payload.password
        ? await bcrypt.hash(payload.password, 12)
        : null;
      await client.query(
        `UPDATE app_users
         SET name=$2,email=$3,mobile=$4,password_hash=COALESCE($5,password_hash),
             status=$6,updated_at=NOW()
         WHERE id=$1`,
        [
          userId,
          payload.name,
          payload.email || `manager.${payload.mobile}@mydhobi.local`,
          payload.mobile,
          passwordHash,
          manager && payload.status === "active" ? "active" : "disabled",
        ],
      );
    }

    const { rows } = await client.query<StoreTeamRow>(
      `UPDATE store_team_members
       SET name=$2,mobile=$3,email=$4,role=$5,status=$6,user_id=$7,updated_at=NOW()
       WHERE id=$1
       RETURNING id, store_id, name, mobile, email, role, status, user_id, created_at`,
      [id, payload.name, payload.mobile, payload.email, payload.role, payload.status, userId],
    );
    await client.query("COMMIT");
    return rows[0] ? mapStoreTeamMember(rows[0]) : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteStoreTeamMember(id: string) {
  await ensureStoreTeamTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ user_id: string | null }>(
      `DELETE FROM store_team_members WHERE id=$1 RETURNING user_id`,
      [id],
    );
    if (result.rows[0]?.user_id) {
      await client.query("DELETE FROM app_users WHERE id=$1", [result.rows[0].user_id]);
    }
    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getStoreMembershipByUserId(userId: string) {
  await ensureStoreTeamTable();
  const { rows } = await pool.query<{ store_id: string; status: StoreTeamStatus; role: string }>(
    `SELECT store_id, status, role
     FROM store_team_members
     WHERE user_id=$1
     LIMIT 1`,
    [userId],
  );
  return rows[0]
    ? { storeId: String(rows[0].store_id), status: rows[0].status, role: rows[0].role }
    : null;
}
