import type { PoolClient } from "pg";

import { pool } from "@/lib/db";
import { ensureItemMasterSchema, normalizePricingUnit } from "@/lib/item-master";
import type { PricingUnit } from "@/lib/item-master-types";

export type TariffRate = {
  price: number | null;
  isAvailable: boolean;
  pricingUnit: PricingUnit;
};

export type TariffService = {
  id: number;
  name: string;
};

export type TariffMapping = {
  isMapped: boolean;
  pricingUnit: PricingUnit;
};

export type TariffItem = {
  id: number;
  name: string;
  shortCode: string;
  categoryId: number;
  defaultPricingUnit: PricingUnit;
  mappings: Record<string, TariffMapping>;
  rates: Record<string, TariffRate>;
};

export type TariffSheet = {
  services: TariffService[];
  items: TariffItem[];
};

export type TariffChange = {
  itemId: number;
  serviceId: number;
  price: number | null;
  isAvailable: boolean;
};

async function assertPriceList(client: PoolClient, groupId: number) {
  const group = await client.query("SELECT 1 FROM rate_card_groups WHERE id=$1", [groupId]);
  if (!group.rows[0]) throw new Error("Price list not found.");
}

async function ensureTariffMappings(client: PoolClient) {
  await client.query(
    `INSERT INTO garment_service_mappings(
       garment_id,service_id,is_enabled,price,pricing_unit,turnaround_hours
     )
     SELECT DISTINCT t.item_id,t.service_id,FALSE,0,g.default_pricing_unit,48
     FROM tariffs t
     JOIN garments g ON g.id=t.item_id
     WHERE t.is_available=TRUE
     ON CONFLICT(garment_id,service_id) DO NOTHING`,
  );
}

export async function getTariffSheet(groupId: number, categoryId?: number) {
  await ensureItemMasterSchema();
  const client = await pool.connect();
  try {
    await assertPriceList(client, groupId);
    await ensureTariffMappings(client);

    const params: number[] = [groupId];
    const rateCategoryFilter = categoryId === undefined ? "" : "AND g.category_id=$2";
    const itemCategoryFilter = categoryId === undefined ? "" : "AND g.category_id=$1";
    const mappingCategoryFilter = categoryId === undefined ? "" : "AND g.category_id=$1";
    if (categoryId !== undefined) params.push(categoryId);

    const [serviceResult, itemResult, mappingResult, rateResult] = await Promise.all([
      client.query<{ id: string; name: string }>(
        "SELECT id,name FROM services WHERE is_active=TRUE ORDER BY sort_order,name",
      ),
      client.query<{ id: string; name: string; short_code: string; category_id: string; default_pricing_unit: string }>(
        `SELECT g.id,g.name,g.short_code,g.category_id,g.default_pricing_unit
         FROM garments g
         JOIN garment_categories c ON c.id=g.category_id AND c.is_active=TRUE
         WHERE g.is_active=TRUE ${itemCategoryFilter}
         ORDER BY g.sort_order,g.name`,
        categoryId === undefined ? [] : [categoryId],
      ),
      client.query<{ garment_id: string; service_id: string; is_enabled: boolean; pricing_unit: string }>(
        `SELECT m.garment_id,m.service_id,m.is_enabled,m.pricing_unit
         FROM garment_service_mappings m
         JOIN garments g ON g.id=m.garment_id AND g.is_active=TRUE
         JOIN services s ON s.id=m.service_id AND s.is_active=TRUE
         WHERE TRUE ${mappingCategoryFilter}`,
        categoryId === undefined ? [] : [categoryId],
      ),
      client.query<{ item_id: string; service_id: string; price: string | null; is_available: boolean; pricing_unit: string }>(
        `SELECT m.garment_id AS item_id,m.service_id,r.price,r.is_enabled AS is_available,
           COALESCE(r.pricing_unit,m.pricing_unit,g.default_pricing_unit) AS pricing_unit
         FROM rate_card_group_rates r
         JOIN garment_service_mappings m ON m.id=r.mapping_id
         JOIN garments g ON g.id=m.garment_id AND g.is_active=TRUE
         JOIN garment_categories c ON c.id=g.category_id AND c.is_active=TRUE
         JOIN services s ON s.id=m.service_id AND s.is_active=TRUE
         WHERE r.group_id=$1 ${rateCategoryFilter}
         ORDER BY g.sort_order,g.name,s.sort_order,s.name`,
        params,
      ),
    ]);

    const items = itemResult.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      shortCode: row.short_code,
      categoryId: Number(row.category_id),
      defaultPricingUnit: normalizePricingUnit(row.default_pricing_unit),
      mappings: {} as Record<string, TariffMapping>,
      rates: {} as Record<string, TariffRate>,
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
    for (const row of rateResult.rows) {
      const item = itemsById.get(Number(row.item_id));
      if (!item) continue;
      item.rates[String(row.service_id)] = {
        price: row.price === null ? null : Number(row.price),
        isAvailable: row.is_available,
        pricingUnit: normalizePricingUnit(row.pricing_unit),
      };
    }

    return {
      services: serviceResult.rows.map((row) => ({ id: Number(row.id), name: row.name })),
      items,
    } satisfies TariffSheet;
  } finally {
    client.release();
  }
}

export async function updateTariffs(groupId: number, changes: TariffChange[]) {
  await ensureItemMasterSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertPriceList(client, groupId);
    for (const change of changes) {
      const mapping = await client.query<{ id: string }>(
        "SELECT id FROM garment_service_mappings WHERE garment_id=$1 AND service_id=$2 AND is_enabled=TRUE",
        [change.itemId, change.serviceId],
      );
      if (!mapping.rows[0]) throw new Error("Map this service to the item before setting its tariff.");
      const result = await client.query(
        `INSERT INTO rate_card_group_rates(
           group_id,mapping_id,is_enabled,price,pricing_unit,turnaround_hours,
           express_available,express_price,express_turnaround_hours
         )
         SELECT $1,m.id,$3,COALESCE($2,0),m.pricing_unit,m.turnaround_hours,
           m.express_available,m.express_price,m.express_turnaround_hours
         FROM garment_service_mappings m WHERE m.id=$4
         ON CONFLICT(group_id,mapping_id) DO UPDATE SET
           price=EXCLUDED.price,
           is_enabled=EXCLUDED.is_enabled,
           updated_at=NOW()
         RETURNING id`,
        [groupId, change.price, change.isAvailable, Number(mapping.rows[0].id)],
      );
      if (!result.rows[0]) throw new Error("Item or service not found.");
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
