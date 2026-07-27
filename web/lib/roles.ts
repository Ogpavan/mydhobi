import { pool } from "@/lib/db";

export type SetupRole = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

type RoleRow = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
};

let setupPromise: Promise<void> | null = null;

export function ensureRoleTable() {
  if (!setupPromise) {
    setupPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS setup_roles (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS setup_roles_name_unique
      ON setup_roles (LOWER(name));
      INSERT INTO setup_roles (name, description)
      VALUES
        ('Manager', 'Manage daily work and staff for an assigned store.'),
        ('Staff', 'Handle daily orders, pickups, deliveries, and customers.')
      ON CONFLICT DO NOTHING;
    `).then(() => undefined).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function mapRole(row: RoleRow): SetupRole {
  return { id: row.id, name: row.name, description: row.description, isActive: row.is_active };
}

export function normalizeRolePayload(input: { name?: unknown; description?: unknown }) {
  return {
    name: typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "",
    description: typeof input.description === "string" ? input.description.trim() : "",
  };
}

export function validateRolePayload(payload: { name: string; description: string }) {
  if (!payload.name) return "Role name is required.";
  if (payload.name.length > 100) return "Role name is too long.";
  if (payload.description.length > 300) return "Description is too long.";
  return null;
}

export async function listSetupRoles() {
  await ensureRoleTable();
  const { rows } = await pool.query<RoleRow>(
    `SELECT id, name, description, is_active FROM setup_roles ORDER BY name ASC`,
  );
  return rows.map(mapRole);
}

export async function createSetupRole(name: string, description: string) {
  await ensureRoleTable();
  const { rows } = await pool.query<RoleRow>(
    `INSERT INTO setup_roles (name, description) VALUES ($1, $2)
     RETURNING id, name, description, is_active`,
    [name, description],
  );
  return mapRole(rows[0]);
}

export async function updateSetupRole(id: string, name: string, description: string) {
  await ensureRoleTable();
  const { rows } = await pool.query<RoleRow>(
    `UPDATE setup_roles SET name = $2, description = $3, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, description, is_active`,
    [id, name, description],
  );
  return rows[0] ? mapRole(rows[0]) : null;
}

export async function updateSetupRoleStatus(id: string, isActive: boolean) {
  await ensureRoleTable();
  const { rows } = await pool.query<RoleRow>(
    `UPDATE setup_roles SET is_active = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, description, is_active`,
    [id, isActive],
  );
  return rows[0] ? mapRole(rows[0]) : null;
}

export async function deleteSetupRole(id: string) {
  await ensureRoleTable();
  const result = await pool.query(`DELETE FROM setup_roles WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
