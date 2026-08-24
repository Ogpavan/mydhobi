import type { PoolClient } from "pg";

import { pool } from "@/lib/db";
import { ensureItemMasterSchema, normalizePricingUnit } from "@/lib/item-master";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";

export type ServiceMappingService = {
  id: number;
  name: string;
};

export type ServiceMappingValue = {
  isMapped: boolean;
  pricingUnit: PricingUnit;
};

export type ServiceMappingItem = {
  id: number;
  name: string;
  shortCode: string;
  categoryId: number;
  defaultPricingUnit: PricingUnit;
  mappings: Record<string, ServiceMappingValue>;
};

export type ServiceMappingSheet = {
  services: ServiceMappingService[];
  items: ServiceMappingItem[];
};

export type ServiceMappingChange = {
  itemId: number;
  serviceId: number;
  isMapped: boolean;
  pricingUnit: PricingUnit;
};

export async function getServiceMappingSheet(categoryId: number) {
  await ensureItemMasterSchema();
  const [serviceResult, itemResult, mappingResult] = await Promise.all([
    pool.query<{ id: string; name: string }>(
      "SELECT id,name FROM services WHERE is_active=TRUE ORDER BY sort_order,name",
    ),
    pool.query<{ id: string; name: string; short_code: string; category_id: string; default_pricing_unit: string }>(
      `SELECT g.id,g.name,g.short_code,g.category_id,g.default_pricing_unit
       FROM garments g
       JOIN garment_categories c ON c.id=g.category_id AND c.is_active=TRUE
       WHERE g.is_active=TRUE AND g.category_id=$1
       ORDER BY g.sort_order,g.name`,
      [categoryId],
    ),
    pool.query<{ garment_id: string; service_id: string; is_enabled: boolean; pricing_unit: string }>(
      `SELECT m.garment_id,m.service_id,m.is_enabled,m.pricing_unit
       FROM garment_service_mappings m
       JOIN garments g ON g.id=m.garment_id AND g.is_active=TRUE
       JOIN services s ON s.id=m.service_id AND s.is_active=TRUE
       WHERE g.category_id=$1`,
      [categoryId],
    ),
  ]);

  const items = itemResult.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    shortCode: row.short_code,
    categoryId: Number(row.category_id),
    defaultPricingUnit: normalizePricingUnit(row.default_pricing_unit),
    mappings: {} as Record<string, ServiceMappingValue>,
  }));
  const itemsById = new Map(items.map((item) => [item.id, item]));
  for (const row of mappingResult.rows) {
    const item = itemsById.get(Number(row.garment_id));
    if (!item) continue;
    item.mappings[String(row.service_id)] = {
      isMapped: row.is_enabled,
      pricingUnit: normalizePricingUnit(row.pricing_unit),
    };
  }

  return {
    services: serviceResult.rows.map((row) => ({ id: Number(row.id), name: row.name })),
    items,
  } satisfies ServiceMappingSheet;
}

async function assertMappingTargets(client: PoolClient, itemId: number, serviceId: number) {
  const result = await client.query(
    "SELECT 1 FROM garments g CROSS JOIN services s WHERE g.id=$1 AND s.id=$2",
    [itemId, serviceId],
  );
  if (!result.rows[0]) throw new Error("Item or service not found.");
}

export async function updateServiceMappings(changes: ServiceMappingChange[]) {
  await ensureItemMasterSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const change of changes) {
      if (!PRICING_UNITS.includes(change.pricingUnit)) throw new Error("Choose a valid billing unit.");
      await assertMappingTargets(client, change.itemId, change.serviceId);
      if (change.isMapped) {
        await client.query(
          `INSERT INTO garment_service_mappings(
             garment_id,service_id,is_enabled,price,pricing_unit,turnaround_hours
           ) VALUES($1,$2,TRUE,0,$3,48)
           ON CONFLICT(garment_id,service_id) DO UPDATE SET
             is_enabled=TRUE,
             pricing_unit=EXCLUDED.pricing_unit,
             updated_at=NOW()`,
          [change.itemId, change.serviceId, change.pricingUnit],
        );
      } else {
        await client.query(
          `UPDATE garment_service_mappings
           SET is_enabled=FALSE,pricing_unit=$3,updated_at=NOW()
           WHERE garment_id=$1 AND service_id=$2`,
          [change.itemId, change.serviceId, change.pricingUnit],
        );
        await client.query(
          `UPDATE tariffs SET price=NULL,is_available=FALSE,updated_at=NOW()
           WHERE item_id=$1 AND service_id=$2`,
          [change.itemId, change.serviceId],
        );
      }
    }
    await client.query("COMMIT");
    return changes.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
