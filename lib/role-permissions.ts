import { pool } from "@/lib/db";
import { ensureRoleTable } from "@/lib/roles";

export type PermissionPage = {
  key: string;
  label: string;
};

export type PermissionGroup = {
  label: string;
  pages: PermissionPage[];
};

export const permissionGroups: PermissionGroup[] = [
  {
    label: "Daily Work",
    pages: [
      { key: "dashboard", label: "Dashboard" },
      { key: "orders", label: "Orders" },
      { key: "pickups", label: "Pickups" },
      { key: "deliveries", label: "Deliveries" },
      { key: "complaints", label: "Complaints" },
    ],
  },
  {
    label: "People and Stores",
    pages: [
      { key: "stores", label: "Stores" },
      { key: "customers", label: "Customers" },
      { key: "riders", label: "Riders" },
    ],
  },
  {
    label: "Services and Stock",
    pages: [
      { key: "services", label: "Services" },
      { key: "inventory", label: "Inventory" },
    ],
  },
  {
    label: "Money and Growth",
    pages: [
      { key: "payments", label: "Payments" },
      { key: "offers", label: "Offers" },
      { key: "referrals", label: "Referrals" },
    ],
  },
  {
    label: "Reports and Setup",
    pages: [
      { key: "reports", label: "Reports" },
      { key: "basic-setup", label: "Basic Setup" },
    ],
  },
];

export const permissionPageKeys = permissionGroups.flatMap((group) =>
  group.pages.map((page) => page.key),
);

const allowedPageKeys = new Set(permissionPageKeys);
let setupPromise: Promise<void> | null = null;

export async function ensureRolePermissionsTable() {
  await ensureRoleTable();

  if (!setupPromise) {
    setupPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS setup_role_permissions (
          role_id BIGINT NOT NULL REFERENCES setup_roles(id) ON DELETE CASCADE,
          page_key VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (role_id, page_key)
        );
      `)
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }

  return setupPromise;
}

export function validatePermissionPageKeys(pageKeys: unknown) {
  if (!Array.isArray(pageKeys) || !pageKeys.every((key) => typeof key === "string")) {
    return { error: "Check the selected pages.", pageKeys: [] as string[] };
  }

  const uniquePageKeys = [...new Set(pageKeys)];

  if (uniquePageKeys.some((key) => !allowedPageKeys.has(key))) {
    return { error: "One or more pages are not available.", pageKeys: [] as string[] };
  }

  return {
    error: null,
    pageKeys: permissionPageKeys.filter((key) => uniquePageKeys.includes(key)),
  };
}

export async function listRolePermissionAssignments() {
  await ensureRolePermissionsTable();
  const { rows } = await pool.query<{ role_id: string; page_key: string }>(
    `SELECT role_id, page_key
     FROM setup_role_permissions
     ORDER BY role_id, page_key`,
  );

  return rows.reduce<Record<string, string[]>>((assignments, row) => {
    const roleId = String(row.role_id);
    assignments[roleId] = [...(assignments[roleId] ?? []), row.page_key];
    return assignments;
  }, {});
}

export async function saveRolePermissions(roleId: string, pageKeys: string[]) {
  await ensureRolePermissionsTable();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const roleResult = await client.query(
      `SELECT id FROM setup_roles WHERE id = $1 LIMIT 1`,
      [roleId],
    );

    if (roleResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`DELETE FROM setup_role_permissions WHERE role_id = $1`, [
      roleId,
    ]);

    if (pageKeys.length > 0) {
      await client.query(
        `INSERT INTO setup_role_permissions (role_id, page_key)
         SELECT $1, UNNEST($2::text[])`,
        [roleId, pageKeys],
      );
    }

    await client.query("COMMIT");
    return pageKeys;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
