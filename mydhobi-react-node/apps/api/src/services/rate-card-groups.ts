import { pool } from "@/lib/db";
import {
  ensureItemMasterSchema,
  getItem,
  listItems,
  normalizePricingUnit,
} from "@/lib/item-master";
import type {
  ItemDetail,
  PricingUnit,
  RateCardGroup,
  RateCardStoreAssignment,
} from "@/lib/item-master-types";
import { PRICING_UNITS } from "@/lib/item-master-types";
import type { PriceListCopySource } from "@mydhobi/domain/rate-card-groups";
export type { PriceListCopySource } from "@mydhobi/domain/rate-card-groups";

function iso(value: unknown) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(String(value)).toISOString();
}

function mapGroup(row: Record<string, unknown>): RateCardGroup {
  return {
    id: Number(row.id),
    name: String(row.name),
    tariffCode: String(row.tariff_code ?? ""),
    description: String(row.description ?? ""),
    isActive: Boolean(row.is_active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function listRateCardGroups(includeInactive = true) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(
    `SELECT * FROM rate_card_groups ${includeInactive ? "" : "WHERE is_active=TRUE"} ORDER BY is_active DESC,name`,
  );
  return rows.map(mapGroup);
}

export async function getFirstConfiguredRateCardGroupId() {
  await ensureItemMasterSchema();
  const { rows } = await pool.query<{ group_id: string }>(
    `SELECT rates.group_id
     FROM rate_card_group_rates rates
     INNER JOIN rate_card_groups groups
       ON groups.id = rates.group_id AND groups.is_active = TRUE
     INNER JOIN garment_service_mappings mappings
       ON mappings.id = rates.mapping_id AND mappings.is_enabled = TRUE
     INNER JOIN garments items
       ON items.id = mappings.garment_id AND items.is_active = TRUE
     INNER JOIN garment_categories categories
       ON categories.id = items.category_id AND categories.is_active = TRUE
     INNER JOIN services
       ON services.id = mappings.service_id AND services.is_active = TRUE
     WHERE rates.is_enabled = TRUE AND rates.price IS NOT NULL
     ORDER BY groups.name
     LIMIT 1`,
  );
  return rows[0] ? Number(rows[0].group_id) : null;
}

export async function createRateCardGroup(input: {
  name: string;
  tariffCode: string;
  description?: string;
  isActive?: boolean;
  copyFrom?: PriceListCopySource;
}) {
  await ensureItemMasterSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO rate_card_groups(name,tariff_code,description,is_active) VALUES($1,$2,$3,$4) RETURNING *`,
      [
        input.name.trim(),
        input.tariffCode.trim().toUpperCase(),
        input.description?.trim() ?? "",
        input.isActive ?? true,
      ],
    );
    const created = mapGroup(rows[0]);

    if (input.copyFrom?.type === "group") {
      const copied = await client.query(
        `INSERT INTO rate_card_group_rates(
           group_id,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,
           express_available,express_price,express_turnaround_hours
         )
         SELECT $1,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,
           express_available,express_price,express_turnaround_hours
         FROM rate_card_group_rates WHERE group_id=$2`,
        [created.id, input.copyFrom.id],
      );
      const source = await client.query(
        "SELECT 1 FROM rate_card_groups WHERE id=$1",
        [input.copyFrom.id],
      );
      if (!source.rows[0]) throw new Error("Price list to copy was not found.");
      if (copied.rowCount === 0)
        throw new Error("The selected price list has no prices to copy.");
    }

    if (input.copyFrom?.type === "store") {
      const source = await client.query("SELECT 1 FROM stores WHERE id=$1", [
        input.copyFrom.id,
      ]);
      if (!source.rows[0]) throw new Error("Store to copy was not found.");
      const copied = await client.query(
        `INSERT INTO rate_card_group_rates(
           group_id,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,
           express_available,express_price,express_turnaround_hours
         )
         SELECT $1,m.id,t.is_available,COALESCE(t.price,0),m.pricing_unit,m.turnaround_hours,
           m.express_available,m.express_price,m.express_turnaround_hours
         FROM tariffs t
         JOIN garment_service_mappings m
           ON m.garment_id=t.item_id AND m.service_id=t.service_id
         WHERE t.store_id=$2`,
        [created.id, input.copyFrom.id],
      );
      if (copied.rowCount === 0)
        throw new Error("This store has no saved tariffs to copy.");
    }

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRateCardGroup(
  id: number,
  input: Partial<{
    name: string;
    tariffCode: string;
    description: string;
    isActive: boolean;
  }>,
) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(
    `UPDATE rate_card_groups
     SET name=COALESCE($2,name),tariff_code=COALESCE($3,tariff_code),description=COALESCE($4,description),is_active=COALESCE($5,is_active),updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      id,
      input.name?.trim() || null,
      input.tariffCode?.trim().toUpperCase() || null,
      input.description?.trim() ?? null,
      input.isActive ?? null,
    ],
  );
  return rows[0] ? mapGroup(rows[0]) : null;
}

export async function deleteRateCardGroup(id: number) {
  await ensureItemMasterSchema();
  const assigned = await pool.query(
    "SELECT 1 FROM store_rate_card_assignments WHERE group_id=$1 LIMIT 1",
    [id],
  );
  if (assigned.rows[0])
    throw new Error(
      "This price list is assigned to a store. Remove the assignment before deleting it.",
    );
  const result = await pool.query(
    "DELETE FROM rate_card_groups WHERE id=$1 RETURNING id",
    [id],
  );
  return Boolean(result.rows[0]);
}

export async function getRateCardGroupItems(groupId: number) {
  await ensureItemMasterSchema();
  const group = await pool.query("SELECT 1 FROM rate_card_groups WHERE id=$1", [
    groupId,
  ]);
  if (!group.rows[0]) return null;

  const [items, rateRows] = await Promise.all([
    listItems({ includeInactive: true }),
    pool.query<Record<string, unknown>>(
      `SELECT id,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,express_available,express_price,express_turnaround_hours
       FROM rate_card_group_rates WHERE group_id=$1`,
      [groupId],
    ),
  ]);
  const details = await Promise.all(items.map((item) => getItem(item.id)));
  const rates = new Map<number, Record<string, unknown>>(
    rateRows.rows.map((row) => [Number(row.mapping_id), row]),
  );

  return details
    .filter((item): item is ItemDetail => item !== null)
    .map((item) => ({
      ...item,
      mappings: item.mappings.map((mapping) => {
        if (mapping.id === null) return mapping;
        const rate = rates.get(mapping.id);
        if (!rate) return mapping;
        return {
          ...mapping,
          id: mapping.id,
          isEnabled: Boolean(rate.is_enabled),
          price: Number(rate.price),
          pricingUnit: normalizePricingUnit(rate.pricing_unit),
          turnaroundHours: Number(rate.turnaround_hours),
          expressAvailable: Boolean(rate.express_available),
          expressPrice:
            rate.express_price === null ? null : Number(rate.express_price),
          expressTurnaroundHours:
            rate.express_turnaround_hours === null
              ? null
              : Number(rate.express_turnaround_hours),
        };
      }),
    }));
}

export async function upsertRateCardGroupRate(input: {
  groupId: number;
  mappingId: number | null;
  garmentId: number;
  serviceId: number;
  isEnabled: boolean;
  price: number;
  pricingUnit: PricingUnit;
  turnaroundHours: number;
  expressAvailable: boolean;
  expressPrice: number | null;
  expressTurnaroundHours: number | null;
}) {
  await ensureItemMasterSchema();
  if (
    !PRICING_UNITS.includes(input.pricingUnit) ||
    !Number.isFinite(input.price) ||
    input.price < 0 ||
    !Number.isInteger(input.turnaroundHours) ||
    input.turnaroundHours < 0 ||
    (input.expressPrice !== null &&
      (!Number.isFinite(input.expressPrice) || input.expressPrice < 0)) ||
    (input.expressTurnaroundHours !== null &&
      (!Number.isInteger(input.expressTurnaroundHours) ||
        input.expressTurnaroundHours < 0))
  )
    throw new Error("Enter valid non-negative pricing and turnaround values.");

  const group = await pool.query("SELECT 1 FROM rate_card_groups WHERE id=$1", [
    input.groupId,
  ]);
  if (!group.rows[0]) throw new Error("Rate group not found.");

  let mappingId = input.mappingId;
  if (mappingId === null) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO garment_service_mappings(garment_id,service_id,price,pricing_unit,turnaround_hours)
       VALUES($1,$2,0,$3,48)
       ON CONFLICT(garment_id,service_id) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
      [input.garmentId, input.serviceId, input.pricingUnit],
    );
    mappingId = Number(rows[0]?.id);
  }
  if (!mappingId) throw new Error("Item service mapping not found.");
  const validMapping = await pool.query(
    "SELECT 1 FROM garment_service_mappings WHERE id=$1 AND garment_id=$2 AND service_id=$3",
    [mappingId, input.garmentId, input.serviceId],
  );
  if (!validMapping.rows[0]) throw new Error("Item service mapping not found.");

  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO rate_card_group_rates(group_id,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,express_available,express_price,express_turnaround_hours)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(group_id,mapping_id) DO UPDATE SET is_enabled=EXCLUDED.is_enabled,price=EXCLUDED.price,pricing_unit=EXCLUDED.pricing_unit,turnaround_hours=EXCLUDED.turnaround_hours,express_available=EXCLUDED.express_available,express_price=EXCLUDED.express_price,express_turnaround_hours=EXCLUDED.express_turnaround_hours,updated_at=NOW()
     RETURNING id`,
    [
      input.groupId,
      mappingId,
      input.isEnabled,
      input.price,
      input.pricingUnit,
      input.turnaroundHours,
      input.expressAvailable,
      input.expressPrice,
      input.expressTurnaroundHours,
    ],
  );
  return { id: Number(rows[0].id), mappingId };
}

export async function listRateCardStoreAssignments() {
  await ensureItemMasterSchema();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT st.id AS store_id,st.name AS store_name,g.id AS group_id,g.name AS group_name,g.tariff_code
     FROM stores st LEFT JOIN store_rate_card_assignments a ON a.store_id=st.id
     LEFT JOIN rate_card_groups g ON g.id=a.group_id ORDER BY st.store_number,st.name`,
  );
  return rows.map((row) => ({
    storeId: String(row.store_id),
    storeName: String(row.store_name),
    groupId: row.group_id === null ? null : Number(row.group_id),
    groupName: row.group_name === null ? null : String(row.group_name),
    tariffCode: row.tariff_code === null ? null : String(row.tariff_code),
  })) satisfies RateCardStoreAssignment[];
}

export async function assignRateCardToStore(
  storeId: string,
  groupId: number | null,
) {
  await ensureItemMasterSchema();
  const store = await pool.query("SELECT 1 FROM stores WHERE id=$1", [storeId]);
  if (!store.rows[0]) throw new Error("Store not found.");
  if (groupId === null) {
    await pool.query(
      "DELETE FROM store_rate_card_assignments WHERE store_id=$1",
      [storeId],
    );
    return null;
  }
  const group = await pool.query(
    "SELECT 1 FROM rate_card_groups WHERE id=$1 AND is_active=TRUE",
    [groupId],
  );
  if (!group.rows[0]) throw new Error("Active tariff card not found.");
  await pool.query(
    `INSERT INTO store_rate_card_assignments(store_id,group_id) VALUES($1,$2)
     ON CONFLICT(store_id) DO UPDATE SET group_id=EXCLUDED.group_id,updated_at=NOW()`,
    [storeId, groupId],
  );
  return groupId;
}

export async function assignRateCardsToStores(
  assignments: Array<{ storeId: string; groupId: number | null }>,
) {
  await ensureItemMasterSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const assignment of assignments) {
      const store = await client.query("SELECT 1 FROM stores WHERE id=$1", [
        assignment.storeId,
      ]);
      if (!store.rows[0]) throw new Error("Store not found.");
      if (assignment.groupId === null) {
        await client.query(
          "DELETE FROM store_rate_card_assignments WHERE store_id=$1",
          [assignment.storeId],
        );
        continue;
      }
      const group = await client.query(
        "SELECT 1 FROM rate_card_groups WHERE id=$1 AND is_active=TRUE",
        [assignment.groupId],
      );
      if (!group.rows[0]) throw new Error("Active price list not found.");
      await client.query(
        `INSERT INTO store_rate_card_assignments(store_id,group_id) VALUES($1,$2)
         ON CONFLICT(store_id) DO UPDATE SET group_id=EXCLUDED.group_id,updated_at=NOW()`,
        [assignment.storeId, assignment.groupId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
