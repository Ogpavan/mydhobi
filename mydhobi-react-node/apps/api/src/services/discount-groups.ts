import type { PoolClient } from "pg";

import { pool } from "@/lib/db";
import {
  calculateDiscountedPrice,
  DISCOUNT_TYPES,
  type DiscountGroup,
  type DiscountGroupDetails,
  type DiscountGroupPayload,
  type DiscountGroupPricing,
  type DiscountGroupRule,
  type DiscountGroupStore,
  type DiscountType,
} from "@mydhobi/domain/discount-groups";
import { ensureItemMasterSchema } from "@/lib/item-master";
import { isSchemaMigration } from "../database/schema-mode";

export type {
  DiscountGroup,
  DiscountGroupDetails,
  DiscountGroupPayload,
  DiscountGroupPricing,
  DiscountGroupRule,
  DiscountGroupStore,
  DiscountType,
} from "@mydhobi/domain/discount-groups";

let setupPromise: Promise<void> | null = null;

export function ensureDiscountGroupSchema() {
  if (!isSchemaMigration()) return Promise.resolve();
  if (!setupPromise) {
    setupPromise = (async () => {
      await ensureItemMasterSchema();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS discount_groups (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS discount_groups_name_lower_idx
          ON discount_groups (LOWER(name));
        CREATE TABLE IF NOT EXISTS discount_group_services (
          id BIGSERIAL PRIMARY KEY,
          discount_group_id BIGINT NOT NULL REFERENCES discount_groups(id) ON DELETE CASCADE,
          service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
          discount_type VARCHAR(20) NOT NULL DEFAULT 'Percentage',
          discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT discount_group_services_type CHECK (discount_type IN ('Percentage','Flat')),
          CONSTRAINT discount_group_services_value CHECK (
            discount_value >= 0 AND
            (discount_type = 'Flat' OR discount_value <= 100)
          ),
          UNIQUE(discount_group_id, service_id)
        );
        CREATE INDEX IF NOT EXISTS discount_group_services_group_idx
          ON discount_group_services(discount_group_id, service_id);
        ALTER TABLE stores
          ADD COLUMN IF NOT EXISTS discount_group_id BIGINT
          REFERENCES discount_groups(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS stores_discount_group_idx
          ON stores(discount_group_id);
        ALTER TABLE customer_order_items
          ADD COLUMN IF NOT EXISTS base_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) NOT NULL DEFAULT 'None',
          ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
        UPDATE customer_order_items
        SET base_unit_price = unit_price
        WHERE base_unit_price = 0 AND unit_price > 0;
      `);
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function iso(value: unknown) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(String(value)).toISOString();
}

function mapGroup(row: Record<string, unknown>): DiscountGroup {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    isActive: Boolean(row.is_active),
    serviceCount: Number(row.service_count ?? 0),
    storeCount: Number(row.store_count ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapRule(row: Record<string, unknown>): DiscountGroupRule {
  return {
    ...(row.id === undefined ? {} : { id: Number(row.id) }),
    serviceId: Number(row.service_id),
    serviceName: String(row.service_name),
    discountType: row.discount_type as DiscountType,
    discountValue: Number(row.discount_value),
  };
}

function mapStore(row: Record<string, unknown>): DiscountGroupStore {
  return {
    id: String(row.id),
    name: String(row.name),
    storeCode: `ST-${String(row.store_number).padStart(3, "0")}`,
    status: String(row.status),
  };
}

export function validateDiscountGroupPayload(
  input: Partial<DiscountGroupPayload>,
) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 120) return "Enter a valid discount group name.";
  if (typeof input.description !== "string" || input.description.length > 1000)
    return "Enter a valid description.";
  if (!Array.isArray(input.rules)) return "Add valid service discounts.";
  const seen = new Set<number>();
  for (const rule of input.rules) {
    if (!Number.isInteger(rule.serviceId) || rule.serviceId < 1)
      return "Choose a valid service.";
    if (seen.has(rule.serviceId)) return "A service can appear only once.";
    seen.add(rule.serviceId);
    if (!DISCOUNT_TYPES.includes(rule.discountType))
      return "Choose a valid discount type.";
    if (
      !Number.isFinite(rule.discountValue) ||
      rule.discountValue < 0 ||
      (rule.discountType === "Percentage" && rule.discountValue > 100)
    ) {
      return rule.discountType === "Percentage"
        ? "Percentage discount must be between 0% and 100%."
        : "Flat discount cannot be negative.";
    }
  }
  return null;
}

async function assertServices(
  client: PoolClient,
  rules: DiscountGroupPayload["rules"],
) {
  if (!rules.length) return;
  const result = await client.query<{ id: string }>(
    "SELECT id FROM services WHERE id = ANY($1::bigint[])",
    [rules.map((rule) => rule.serviceId)],
  );
  if (result.rows.length !== rules.length) throw new Error("SERVICE_NOT_FOUND");
}

async function replaceRules(
  client: PoolClient,
  groupId: number,
  rules: DiscountGroupPayload["rules"],
) {
  await assertServices(client, rules);
  await client.query(
    "DELETE FROM discount_group_services WHERE discount_group_id=$1",
    [groupId],
  );
  for (const rule of rules) {
    await client.query(
      `INSERT INTO discount_group_services(
         discount_group_id,service_id,discount_type,discount_value
       ) VALUES($1,$2,$3,$4)`,
      [groupId, rule.serviceId, rule.discountType, rule.discountValue],
    );
  }
}

const groupSelect = `
  groups.id,groups.name,groups.description,groups.is_active,groups.created_at,groups.updated_at,
  COUNT(DISTINCT rules.service_id)::int AS service_count,
  COUNT(DISTINCT stores.id)::int AS store_count`;

export async function listDiscountGroups(includeInactive = true, search = "") {
  await ensureDiscountGroupSchema();
  const params: string[] = [];
  const conditions: string[] = [];
  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push("(groups.name ILIKE $1 OR groups.description ILIKE $1)");
  }
  if (!includeInactive) conditions.push("groups.is_active=TRUE");
  const { rows } = await pool.query(
    `SELECT ${groupSelect}
     FROM discount_groups groups
     LEFT JOIN discount_group_services rules ON rules.discount_group_id=groups.id
     LEFT JOIN stores ON stores.discount_group_id=groups.id
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     GROUP BY groups.id ORDER BY groups.is_active DESC,groups.name`,
    params,
  );
  return rows.map(mapGroup);
}

export async function getDiscountGroup(
  id: number,
): Promise<DiscountGroupDetails | null> {
  await ensureDiscountGroupSchema();
  const groupResult = await pool.query(
    `SELECT ${groupSelect}
    FROM discount_groups groups
    LEFT JOIN discount_group_services rules ON rules.discount_group_id=groups.id
    LEFT JOIN stores ON stores.discount_group_id=groups.id
    WHERE groups.id=$1 GROUP BY groups.id`,
    [id],
  );
  if (!groupResult.rows[0]) return null;
  const [rulesResult, storesResult] = await Promise.all([
    pool.query(
      `SELECT rules.id,rules.service_id,services.name AS service_name,
         rules.discount_type,rules.discount_value
       FROM discount_group_services rules
       JOIN services ON services.id=rules.service_id
       WHERE rules.discount_group_id=$1 ORDER BY services.sort_order,services.name`,
      [id],
    ),
    pool.query(
      `SELECT id,store_number,name,status FROM stores
       WHERE discount_group_id=$1 ORDER BY store_number,name`,
      [id],
    ),
  ]);
  return {
    ...mapGroup(groupResult.rows[0]),
    rules: rulesResult.rows.map(mapRule),
    stores: storesResult.rows.map(mapStore),
  };
}

export async function listActiveDiscountGroupPricing(): Promise<
  DiscountGroupPricing[]
> {
  await ensureDiscountGroupSchema();
  const { rows } = await pool.query(
    `SELECT groups.id,groups.is_active,rules.id AS rule_id,rules.service_id,
       services.name AS service_name,rules.discount_type,rules.discount_value
     FROM discount_groups groups
     LEFT JOIN discount_group_services rules ON rules.discount_group_id=groups.id
     LEFT JOIN services ON services.id=rules.service_id
     WHERE groups.is_active=TRUE
     ORDER BY groups.id,services.sort_order,services.name`,
  );
  const groups = new Map<number, DiscountGroupPricing>();
  for (const row of rows) {
    const id = Number(row.id);
    const group = groups.get(id) ?? { id, isActive: true, rules: [] };
    if (row.service_id !== null) group.rules.push(mapRule(row));
    groups.set(id, group);
  }
  return [...groups.values()];
}

export async function createDiscountGroup(input: DiscountGroupPayload) {
  await ensureDiscountGroupSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO discount_groups(name,description,is_active)
       VALUES($1,$2,$3) RETURNING id,name,description,is_active,created_at,updated_at`,
      [input.name.trim(), input.description.trim(), input.isActive],
    );
    await replaceRules(client, Number(rows[0].id), input.rules);
    await client.query("COMMIT");
    return getDiscountGroup(Number(rows[0].id));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDiscountGroup(
  id: number,
  input: DiscountGroupPayload,
) {
  await ensureDiscountGroupSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE discount_groups SET name=$2,description=$3,is_active=$4,updated_at=NOW()
       WHERE id=$1 RETURNING id`,
      [id, input.name.trim(), input.description.trim(), input.isActive],
    );
    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    await replaceRules(client, id, input.rules);
    await client.query("COMMIT");
    return getDiscountGroup(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteDiscountGroup(id: number) {
  await ensureDiscountGroupSchema();
  const result = await pool.query(
    "DELETE FROM discount_groups WHERE id=$1 RETURNING id",
    [id],
  );
  return Boolean(result.rows[0]);
}

export async function listDiscountGroupStores(id: number) {
  const group = await getDiscountGroup(id);
  return group?.stores ?? null;
}

export async function getStoreDiscountGroupId(
  client: PoolClient,
  storeId: string,
) {
  const { rows } = await client.query<{ id: string; is_active: boolean }>(
    `SELECT groups.id,groups.is_active
     FROM stores
     LEFT JOIN discount_groups groups ON groups.id=stores.discount_group_id
     WHERE stores.id=$1 LIMIT 1`,
    [storeId],
  );
  return rows[0]?.id && rows[0].is_active ? Number(rows[0].id) : null;
}

export async function assignDiscountGroupToStore(
  storeId: string,
  groupId: number | null,
) {
  await ensureDiscountGroupSchema();
  const store = await pool.query("SELECT 1 FROM stores WHERE id=$1", [storeId]);
  if (!store.rows[0]) throw new Error("STORE_NOT_FOUND");
  if (groupId !== null) {
    const group = await pool.query(
      "SELECT 1 FROM discount_groups WHERE id=$1 AND is_active=TRUE",
      [groupId],
    );
    if (!group.rows[0]) throw new Error("DISCOUNT_GROUP_NOT_FOUND");
  }
  const { rows } = await pool.query(
    `UPDATE stores SET discount_group_id=$2,updated_at=NOW()
     WHERE id=$1 RETURNING discount_group_id`,
    [storeId, groupId],
  );
  return rows[0]?.discount_group_id === null
    ? null
    : Number(rows[0].discount_group_id);
}

export async function getDiscountRulesForGroup(
  client: PoolClient,
  groupId: number,
) {
  const { rows } = await client.query<Record<string, unknown>>(
    `SELECT discount_group_services.service_id,services.name AS service_name,
       discount_group_services.discount_type,discount_group_services.discount_value
     FROM discount_group_services
     JOIN services ON services.id=discount_group_services.service_id
     WHERE discount_group_services.discount_group_id=$1`,
    [groupId],
  );
  return new Map<number, DiscountGroupRule>(
    rows.map((row) => [Number(row.service_id), mapRule(row)]),
  );
}

export { calculateDiscountedPrice };
