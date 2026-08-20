import { ensureServiceCatalogSchema } from "@/lib/service-catalog";
import { pool } from "@/lib/db";
import type {
  ItemCategory,
  ItemDetail,
  ItemListRow,
  ItemMasterService,
  ItemServiceMapping,
  PricingUnit,
  StoreRateOverride,
} from "@/lib/item-master-types";
import { PRICING_UNITS } from "@/lib/item-master-types";
import type { CatalogService, ServiceCategory } from "@/lib/service-catalog";

export { PRICING_UNITS, PRICING_UNIT_LABELS } from "@/lib/item-master-types";
export type { PricingUnit } from "@/lib/item-master-types";

const unitSet = new Set<string>(PRICING_UNITS);

export function normalizePricingUnit(value: unknown): PricingUnit {
  if (value === "kg") return "kg";
  if (value === "pair") return "pair";
  if (value === "set") return "set";
  if (value === "sq_ft") return "sq_ft";
  return "piece";
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function mapCategory(row: Record<string, unknown>): ItemCategory {
  return {
    id: Number(row.id), name: String(row.name), description: String(row.description ?? ""),
    imagePath: String(row.image_path ?? ""), sortOrder: Number(row.sort_order), isActive: Boolean(row.is_active),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  };
}

function mapService(row: Record<string, unknown>): ItemMasterService {
  return {
    id: Number(row.id), name: String(row.name), slug: String(row.slug), description: String(row.description ?? ""),
    imagePath: String(row.image_path ?? ""), isActive: Boolean(row.is_active), sortOrder: Number(row.sort_order),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  };
}

function mapItem(row: Record<string, unknown>): ItemListRow {
  return {
    id: Number(row.id), categoryId: Number(row.category_id), categoryName: String(row.category_name), name: String(row.name),
    shortCode: String(row.short_code), description: String(row.description ?? ""), imagePath: String(row.image_path ?? ""),
    defaultPricingUnit: normalizePricingUnit(row.default_pricing_unit), isActive: Boolean(row.is_active), sortOrder: Number(row.sort_order),
    serviceCount: Number(row.service_count ?? 0), minPrice: row.min_price === null || row.min_price === undefined ? null : Number(row.min_price),
    maxPrice: row.max_price === null || row.max_price === undefined ? null : Number(row.max_price),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  };
}

function mapMapping(row: Record<string, unknown>): ItemServiceMapping {
  return {
    id: row.mapping_id === null || row.mapping_id === undefined ? null : Number(row.mapping_id),
    garmentId: Number(row.garment_id), serviceId: Number(row.service_id), serviceName: String(row.service_name), serviceImagePath: String(row.service_image_path ?? ""),
    isEnabled: Boolean(row.is_enabled), price: Number(row.price ?? 0), pricingUnit: normalizePricingUnit(row.pricing_unit), turnaroundHours: Number(row.turnaround_hours ?? 0),
    expressAvailable: Boolean(row.express_available), expressPrice: row.express_price === null || row.express_price === undefined ? null : Number(row.express_price),
    expressTurnaroundHours: row.express_turnaround_hours === null || row.express_turnaround_hours === undefined ? null : Number(row.express_turnaround_hours),
    updatedAt: row.mapping_updated_at ? iso(row.mapping_updated_at) : null,
  };
}

let setupPromise: Promise<void> | null = null;

export function ensureItemMasterSchema() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await ensureServiceCatalogSchema();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS garment_categories (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          image_path VARCHAR(250) NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS garment_categories_name_lower_idx ON garment_categories (LOWER(name));
        CREATE TABLE IF NOT EXISTS garments (
          id BIGSERIAL PRIMARY KEY,
          category_id BIGINT NOT NULL REFERENCES garment_categories(id) ON DELETE RESTRICT,
          name VARCHAR(150) NOT NULL,
          short_code VARCHAR(30) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          image_path VARCHAR(250) NOT NULL DEFAULT '',
          default_pricing_unit VARCHAR(20) NOT NULL DEFAULT 'piece',
          sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT garments_pricing_unit CHECK (default_pricing_unit IN ('piece','kg','pair','set','sq_ft'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS garments_name_lower_idx ON garments (LOWER(name));
        CREATE UNIQUE INDEX IF NOT EXISTS garments_short_code_lower_idx ON garments (LOWER(short_code));
        CREATE INDEX IF NOT EXISTS garments_category_idx ON garments(category_id, sort_order, name);
        CREATE TABLE IF NOT EXISTS services (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(110) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          image_path VARCHAR(250) NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS services_name_lower_idx ON services (LOWER(name));
        CREATE UNIQUE INDEX IF NOT EXISTS services_slug_idx ON services(slug);
        CREATE TABLE IF NOT EXISTS garment_service_mappings (
          id BIGSERIAL PRIMARY KEY,
          garment_id BIGINT NOT NULL REFERENCES garments(id) ON DELETE RESTRICT,
          service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
          is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
          pricing_unit VARCHAR(20) NOT NULL DEFAULT 'piece',
          turnaround_hours INTEGER NOT NULL DEFAULT 48 CHECK (turnaround_hours >= 0),
          express_available BOOLEAN NOT NULL DEFAULT FALSE,
          express_price NUMERIC(12,2) CHECK (express_price IS NULL OR express_price >= 0),
          express_turnaround_hours INTEGER CHECK (express_turnaround_hours IS NULL OR express_turnaround_hours >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT garment_service_mapping_unit CHECK (pricing_unit IN ('piece','kg','pair','set','sq_ft')),
          UNIQUE(garment_id, service_id)
        );
        CREATE INDEX IF NOT EXISTS garment_service_mappings_garment_idx ON garment_service_mappings(garment_id, is_enabled);
        CREATE TABLE IF NOT EXISTS store_rate_overrides (
          id BIGSERIAL PRIMARY KEY,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          mapping_id BIGINT NOT NULL REFERENCES garment_service_mappings(id) ON DELETE CASCADE,
          price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
          pricing_unit VARCHAR(20),
          turnaround_hours INTEGER CHECK (turnaround_hours IS NULL OR turnaround_hours >= 0),
          express_available BOOLEAN,
          express_price NUMERIC(12,2) CHECK (express_price IS NULL OR express_price >= 0),
          express_turnaround_hours INTEGER CHECK (express_turnaround_hours IS NULL OR express_turnaround_hours >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT store_rate_override_unit CHECK (pricing_unit IS NULL OR pricing_unit IN ('piece','kg','pair','set','sq_ft')),
          UNIQUE(store_id, mapping_id)
        );
        CREATE INDEX IF NOT EXISTS store_rate_overrides_store_idx ON store_rate_overrides(store_id);
        CREATE TABLE IF NOT EXISTS rate_card_groups (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS rate_card_groups_name_lower_idx ON rate_card_groups (LOWER(name));
        ALTER TABLE rate_card_groups ADD COLUMN IF NOT EXISTS tariff_code VARCHAR(50) NOT NULL DEFAULT '';
        CREATE UNIQUE INDEX IF NOT EXISTS rate_card_groups_tariff_code_lower_idx ON rate_card_groups (LOWER(tariff_code)) WHERE tariff_code <> '';
        CREATE TABLE IF NOT EXISTS rate_card_group_rates (
          id BIGSERIAL PRIMARY KEY,
          group_id BIGINT NOT NULL REFERENCES rate_card_groups(id) ON DELETE CASCADE,
          mapping_id BIGINT NOT NULL REFERENCES garment_service_mappings(id) ON DELETE RESTRICT,
          is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
          pricing_unit VARCHAR(20) NOT NULL DEFAULT 'piece',
          turnaround_hours INTEGER NOT NULL DEFAULT 48 CHECK (turnaround_hours >= 0),
          express_available BOOLEAN NOT NULL DEFAULT FALSE,
          express_price NUMERIC(12,2) CHECK (express_price IS NULL OR express_price >= 0),
          express_turnaround_hours INTEGER CHECK (express_turnaround_hours IS NULL OR express_turnaround_hours >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT rate_card_group_rate_unit CHECK (pricing_unit IN ('piece','kg','pair','set','sq_ft')),
          UNIQUE(group_id, mapping_id)
        );
        CREATE INDEX IF NOT EXISTS rate_card_group_rates_group_idx ON rate_card_group_rates(group_id, mapping_id);
        CREATE TABLE IF NOT EXISTS store_rate_card_assignments (
          store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
          group_id BIGINT NOT NULL REFERENCES rate_card_groups(id) ON DELETE RESTRICT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS store_rate_card_assignments_group_idx ON store_rate_card_assignments(group_id);
      `);
      await migrateLegacyCatalog();
    })().catch((error) => { setupPromise = null; throw error; });
  }
  return setupPromise;
}

async function migrateLegacyCatalog() {
  const categoryNames = ["Men", "Women", "Kids", "Household", "Bedding", "Footwear", "Accessories", "Other"];
  for (let index = 0; index < categoryNames.length; index += 1) {
    await pool.query(`INSERT INTO garment_categories(name, sort_order) VALUES($1,$2) ON CONFLICT DO NOTHING`, [categoryNames[index], index]);
  }
  const existing = await pool.query<{ garment_count: string; service_count: string; mapping_count: string }>(`
    SELECT
      (SELECT COUNT(*) FROM garments) AS garment_count,
      (SELECT COUNT(*) FROM services) AS service_count,
      (SELECT COUNT(*) FROM garment_service_mappings) AS mapping_count
  `);
  if (Number(existing.rows[0]?.garment_count) > 0 && Number(existing.rows[0]?.service_count) > 0 && Number(existing.rows[0]?.mapping_count) > 0) return;
  const legacy = await pool.query<Record<string, unknown>>(`
    SELECT c.id,c.name,c.image_path,c.display_order,c.is_active,c.audience
    FROM service_categories c ORDER BY c.id
  `);
  const categoryRows = await pool.query<{ id: number; name: string }>("SELECT id,name FROM garment_categories");
  const categoryIds = new Map(categoryRows.rows.map((row) => [row.name.toLowerCase(), row.id]));
  const categoryFor = (name: string, audience: unknown) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("t-shirt")) return categoryIds.get("kids")!;
    if (["blazer", "shirt", "trousers"].some((value) => normalized.includes(value))) return categoryIds.get("men")!;
    if (["dress", "saree", "kurta", "pajama"].some((value) => normalized.includes(value))) return categoryIds.get("women")!;
    if (["t-shirt", "cap", "jacket"].some((value) => normalized.includes(value))) return categoryIds.get("kids")!;
    if (normalized.includes("bed") || normalized.includes("blanket")) return categoryIds.get("bedding")!;
    if (normalized.includes("shoe") || normalized.includes("foot")) return categoryIds.get("footwear")!;
    if (normalized.includes("bag") || normalized.includes("belt")) return categoryIds.get("accessories")!;
    if (audience === "men") return categoryIds.get("men")!;
    if (audience === "women") return categoryIds.get("women")!;
    if (audience === "kid") return categoryIds.get("kids")!;
    return categoryIds.get("other")!;
  };
  for (const row of legacy.rows) {
    const name = String(row.name);
    const shortCode = slugify(name).replace(/-/g, "").slice(0, 30) || `item${row.id}`;
    await pool.query(`
      INSERT INTO garments(category_id,name,short_code,image_path,sort_order,is_active)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING
    `, [categoryFor(name, row.audience), name, shortCode, row.image_path ?? "", Number(row.display_order ?? 0), Boolean(row.is_active)]);
  }
  const oldServices = await pool.query<Record<string, unknown>>(`
    SELECT name,slug,image_path,display_order,is_active FROM catalog_services GROUP BY name,slug,image_path,display_order,is_active ORDER BY display_order,name
  `);
  for (const row of oldServices.rows) {
    await pool.query(`INSERT INTO services(name,slug,image_path,sort_order,is_active) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [row.name, row.slug, row.image_path ?? "", Number(row.display_order ?? 0), Boolean(row.is_active)]);
  }
  const mappings = await pool.query<Record<string, unknown>>(`
    SELECT c.name AS garment_name, c.is_active AS garment_active, s.name AS service_name, s.slug AS service_slug,
      s.image_path AS service_image_path, s.regular_price, s.express_price, s.turnaround, s.is_active AS service_active, s.unit
    FROM catalog_services s JOIN service_categories c ON c.id=s.category_id
  `);
  const items = await pool.query<{ id: number; name: string }>("SELECT id,name FROM garments");
  const services = await pool.query<{ id: number; name: string }>("SELECT id,name FROM services");
  const itemIds = new Map(items.rows.map((row) => [row.name.toLowerCase(), row.id]));
  const serviceIds = new Map(services.rows.map((row) => [row.name.toLowerCase(), row.id]));
  for (const row of mappings.rows) {
    const garmentId = itemIds.get(String(row.garment_name).toLowerCase());
    const serviceId = serviceIds.get(String(row.service_name).toLowerCase());
    if (!garmentId || !serviceId) continue;
    const turnaround = Number(String(row.turnaround).match(/\d+/)?.[0] ?? 2) * 24;
    const unit = unitSet.has(String(row.unit)) ? String(row.unit) : "piece";
    await pool.query(`
      INSERT INTO garment_service_mappings(garment_id,service_id,is_enabled,price,pricing_unit,turnaround_hours,express_available,express_price,express_turnaround_hours)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(garment_id,service_id) DO NOTHING
    `, [garmentId, serviceId, Boolean(row.garment_active) && Boolean(row.service_active), Number(row.regular_price ?? 0), unit, turnaround, row.express_price !== null, row.express_price === null ? null : Number(row.express_price), row.express_price !== null ? Math.max(1, turnaround - 24) : null]);
  }
}

const itemSelect = `g.id,g.category_id,c.name AS category_name,g.name,g.short_code,g.description,g.image_path,g.default_pricing_unit,g.sort_order,g.is_active,g.created_at,g.updated_at,
  COUNT(m.id) FILTER (WHERE m.is_enabled AND s.is_active) AS service_count,
  MIN(m.price) FILTER (WHERE m.is_enabled AND s.is_active) AS min_price,
  MAX(m.price) FILTER (WHERE m.is_enabled AND s.is_active) AS max_price`;

export async function listItemCategories(includeInactive = true, search = "") {
  await ensureItemMasterSchema();
  const params: string[] = [];
  const conditions: string[] = [];
  if (search.trim()) conditions.push("name ILIKE $1");
  if (search.trim()) params.push(`%${search.trim()}%`);
  if (!includeInactive) conditions.push("is_active=TRUE");
  const { rows } = await pool.query(`SELECT * FROM garment_categories ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY sort_order,name`, params);
  return rows.map(mapCategory);
}

export async function createItemCategory(input: { name: string; description?: string; imagePath?: string; sortOrder?: number; isActive?: boolean }) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`INSERT INTO garment_categories(name,description,image_path,sort_order,is_active) VALUES($1,$2,$3,$4,$5) RETURNING *`, [input.name.trim(), input.description?.trim() ?? "", input.imagePath?.trim() ?? "", input.sortOrder ?? 0, input.isActive ?? true]);
  return mapCategory(rows[0]);
}

export async function updateItemCategory(id: number, input: Partial<{ name: string; description: string; imagePath: string; sortOrder: number; isActive: boolean }>) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`UPDATE garment_categories SET name=COALESCE($2,name),description=COALESCE($3,description),image_path=COALESCE($4,image_path),sort_order=COALESCE($5,sort_order),is_active=COALESCE($6,is_active),updated_at=NOW() WHERE id=$1 RETURNING *`, [id, input.name?.trim() || null, input.description?.trim() ?? null, input.imagePath?.trim() ?? null, input.sortOrder ?? null, input.isActive ?? null]);
  return rows[0] ? mapCategory(rows[0]) : null;
}

export async function deleteItemCategory(id: number) {
  await ensureItemMasterSchema();
  const used = await pool.query("SELECT 1 FROM garments WHERE category_id=$1 LIMIT 1", [id]);
  if (used.rows[0]) throw new Error("This category has items. Deactivate it instead of deleting it.");
  const result = await pool.query("DELETE FROM garment_categories WHERE id=$1 RETURNING id", [id]);
  return Boolean(result.rows[0]);
}

export async function listItems(options: { includeInactive?: boolean; categoryId?: number; search?: string } = {}) {
  await ensureItemMasterSchema();
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  if (!options.includeInactive) conditions.push("g.is_active=TRUE");
  if (options.categoryId) { params.push(options.categoryId); conditions.push(`g.category_id=$${params.length}`); }
  if (options.search?.trim()) { params.push(`%${options.search.trim()}%`); conditions.push(`(g.name ILIKE $${params.length} OR g.short_code ILIKE $${params.length} OR c.name ILIKE $${params.length})`); }
  const { rows } = await pool.query(`SELECT ${itemSelect} FROM garments g JOIN garment_categories c ON c.id=g.category_id LEFT JOIN garment_service_mappings m ON m.garment_id=g.id LEFT JOIN services s ON s.id=m.service_id ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} GROUP BY g.id,c.name ORDER BY g.sort_order,g.name`, params);
  return rows.map(mapItem);
}

export async function getItem(id: number) {
  await ensureItemMasterSchema();
  const items = await listItems({ includeInactive: true });
  const item = items.find((row) => row.id === id);
  if (!item) return null;
  const { rows } = await pool.query(`SELECT m.id AS mapping_id,g.id AS garment_id,s.id AS service_id,s.name AS service_name,s.image_path AS service_image_path,m.is_enabled,m.price,m.pricing_unit,m.turnaround_hours,m.express_available,m.express_price,m.express_turnaround_hours,m.updated_at AS mapping_updated_at FROM garments g CROSS JOIN services s LEFT JOIN garment_service_mappings m ON m.garment_id=g.id AND m.service_id=s.id WHERE g.id=$1 ORDER BY s.sort_order,s.name`, [id]);
  return { ...item, mappings: rows.map(mapMapping) } satisfies ItemDetail;
}

export async function listRateCardItems() {
  await ensureItemMasterSchema();
  const items = await listItems({ includeInactive: true });
  const details = await Promise.all(items.map((item) => getItem(item.id)));
  return details.filter((item): item is ItemDetail => item !== null);
}

export async function listServices(includeInactive = true) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`SELECT * FROM services ${includeInactive ? "" : "WHERE is_active=TRUE"} ORDER BY sort_order,name`);
  return rows.map(mapService);
}

export async function createItemService(input: { name: string; description?: string; imagePath?: string; sortOrder?: number; isActive?: boolean }) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`INSERT INTO services(name,slug,description,image_path,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [input.name.trim(), `${slugify(input.name)}-${Date.now()}`, input.description?.trim() ?? "", input.imagePath?.trim() ?? "", input.sortOrder ?? 0, input.isActive ?? true]);
  return mapService(rows[0]);
}

export async function updateItemService(id: number, input: Partial<{ name: string; description: string; imagePath: string; sortOrder: number; isActive: boolean }>) {
  await ensureItemMasterSchema();
  const current = await pool.query("SELECT * FROM services WHERE id=$1", [id]);
  if (!current.rows[0]) return null;
  const name = input.name?.trim() || String(current.rows[0].name);
  const { rows } = await pool.query(`UPDATE services SET name=$2,description=$3,image_path=$4,sort_order=$5,is_active=$6,updated_at=NOW() WHERE id=$1 RETURNING *`, [id, name, input.description?.trim() ?? current.rows[0].description, input.imagePath?.trim() ?? current.rows[0].image_path, input.sortOrder ?? current.rows[0].sort_order, input.isActive ?? current.rows[0].is_active]);
  return mapService(rows[0]);
}

export async function upsertItemMapping(garmentId: number, input: { serviceId: number; isEnabled: boolean; price: number; pricingUnit: PricingUnit; turnaroundHours: number; expressAvailable: boolean; expressPrice: number | null; expressTurnaroundHours: number | null }) {
  await ensureItemMasterSchema();
  if (!unitSet.has(input.pricingUnit) || input.price < 0 || input.turnaroundHours < 0 || (input.expressPrice !== null && input.expressPrice < 0) || (input.expressTurnaroundHours !== null && input.expressTurnaroundHours < 0)) throw new Error("Enter valid non-negative pricing and turnaround values.");
  const { rows } = await pool.query(`INSERT INTO garment_service_mappings(garment_id,service_id,is_enabled,price,pricing_unit,turnaround_hours,express_available,express_price,express_turnaround_hours) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(garment_id,service_id) DO UPDATE SET is_enabled=EXCLUDED.is_enabled,price=EXCLUDED.price,pricing_unit=EXCLUDED.pricing_unit,turnaround_hours=EXCLUDED.turnaround_hours,express_available=EXCLUDED.express_available,express_price=EXCLUDED.express_price,express_turnaround_hours=EXCLUDED.express_turnaround_hours,updated_at=NOW() RETURNING id`, [garmentId, input.serviceId, input.isEnabled, input.price, input.pricingUnit, input.turnaroundHours, input.expressAvailable, input.expressPrice, input.expressTurnaroundHours]);
  return Number(rows[0].id);
}

export async function deleteItem(id: number) {
  await ensureItemMasterSchema();
  const used = await pool.query("SELECT 1 FROM garment_service_mappings WHERE garment_id=$1 LIMIT 1", [id]);
  if (used.rows[0]) throw new Error("This item has service history. Deactivate it instead of deleting it.");
  const result = await pool.query("DELETE FROM garments WHERE id=$1 RETURNING id", [id]);
  return Boolean(result.rows[0]);
}

export async function createItem(input: { name: string; categoryId: number; shortCode: string; description?: string; imagePath?: string; defaultPricingUnit: PricingUnit; sortOrder?: number; isActive?: boolean }) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`INSERT INTO garments(category_id,name,short_code,description,image_path,default_pricing_unit,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [input.categoryId, input.name.trim(), input.shortCode.trim().toUpperCase(), input.description?.trim() ?? "", input.imagePath?.trim() ?? "", input.defaultPricingUnit, input.sortOrder ?? 0, input.isActive ?? true]);
  return getItem(Number(rows[0].id));
}

export async function updateItem(id: number, input: Partial<{ name: string; categoryId: number; shortCode: string; description: string; imagePath: string; defaultPricingUnit: PricingUnit; sortOrder: number; isActive: boolean }>) {
  await ensureItemMasterSchema();
  const { rows } = await pool.query(`UPDATE garments SET name=COALESCE($2,name),category_id=COALESCE($3,category_id),short_code=COALESCE($4,short_code),description=COALESCE($5,description),image_path=COALESCE($6,image_path),default_pricing_unit=COALESCE($7,default_pricing_unit),sort_order=COALESCE($8,sort_order),is_active=COALESCE($9,is_active),updated_at=NOW() WHERE id=$1 RETURNING id`, [id, input.name?.trim() || null, input.categoryId ?? null, input.shortCode?.trim().toUpperCase() || null, input.description?.trim() ?? null, input.imagePath?.trim() ?? null, input.defaultPricingUnit ?? null, input.sortOrder ?? null, input.isActive ?? null]);
  return rows[0] ? getItem(Number(rows[0].id)) : null;
}

export async function listStoreOverrides(storeId?: string) {
  await ensureItemMasterSchema();
  const params = storeId ? [storeId] : [];
  const { rows } = await pool.query(`SELECT o.*,st.name AS store_name FROM store_rate_overrides o JOIN stores st ON st.id=o.store_id ${storeId ? "WHERE o.store_id=$1" : ""} ORDER BY st.name,o.id`, params);
  return rows.map((row) => ({ id: Number(row.id), storeId: String(row.store_id), storeName: String(row.store_name), mappingId: Number(row.mapping_id), price: Number(row.price), pricingUnit: row.pricing_unit ? normalizePricingUnit(row.pricing_unit) : null, turnaroundHours: row.turnaround_hours === null ? null : Number(row.turnaround_hours), expressAvailable: row.express_available, expressPrice: row.express_price === null ? null : Number(row.express_price), expressTurnaroundHours: row.express_turnaround_hours === null ? null : Number(row.express_turnaround_hours), updatedAt: iso(row.updated_at) })) satisfies StoreRateOverride[];
}

export async function upsertStoreOverride(input: { storeId: string; mappingId: number; price: number; pricingUnit: PricingUnit | null; turnaroundHours: number | null; expressAvailable: boolean | null; expressPrice: number | null; expressTurnaroundHours: number | null }) {
  await ensureItemMasterSchema();
  if (input.price < 0) throw new Error("Price cannot be negative.");
  const { rows } = await pool.query(`INSERT INTO store_rate_overrides(store_id,mapping_id,price,pricing_unit,turnaround_hours,express_available,express_price,express_turnaround_hours) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(store_id,mapping_id) DO UPDATE SET price=EXCLUDED.price,pricing_unit=EXCLUDED.pricing_unit,turnaround_hours=EXCLUDED.turnaround_hours,express_available=EXCLUDED.express_available,express_price=EXCLUDED.express_price,express_turnaround_hours=EXCLUDED.express_turnaround_hours,updated_at=NOW() RETURNING id`, [input.storeId, input.mappingId, input.price, input.pricingUnit, input.turnaroundHours, input.expressAvailable, input.expressPrice, input.expressTurnaroundHours]);
  return Number(rows[0].id);
}

async function resolveCatalogStoreId(storeId?: string | null) {
  if (storeId) return storeId;
  const { rows } = await pool.query<{ id: string }>("SELECT id FROM stores WHERE status='active' ORDER BY store_number ASC LIMIT 1");
  return rows[0]?.id ?? null;
}

export async function getAssignedRateCardId(storeId?: string | null) {
  await ensureItemMasterSchema();
  const resolvedStoreId = await resolveCatalogStoreId(storeId);
  if (!resolvedStoreId) return null;
  const { rows } = await pool.query<{ group_id: number }>("SELECT a.group_id FROM store_rate_card_assignments a JOIN rate_card_groups g ON g.id=a.group_id AND g.is_active=TRUE WHERE a.store_id=$1", [resolvedStoreId]);
  return rows[0] ? Number(rows[0].group_id) : null;
}

export async function getCustomerItemPrice(garmentId: number, serviceId: number, storeId?: string | null) {
  await ensureItemMasterSchema();
  const resolvedStoreId = await resolveCatalogStoreId(storeId);
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT COALESCE(gr.price,m.price) AS price,
      COALESCE(gr.pricing_unit,m.pricing_unit) AS pricing_unit,
      COALESCE(gr.turnaround_hours,m.turnaround_hours) AS turnaround_hours,
      COALESCE(gr.express_available,m.express_available) AS express_available,
      COALESCE(gr.express_price,m.express_price) AS express_price
     FROM garments g JOIN garment_categories c ON c.id=g.category_id
     JOIN garment_service_mappings m ON m.garment_id=g.id AND m.service_id=$2
     JOIN services s ON s.id=m.service_id
     LEFT JOIN store_rate_card_assignments a ON a.store_id=$3
     LEFT JOIN rate_card_groups card ON card.id=a.group_id AND card.is_active=TRUE
     LEFT JOIN rate_card_group_rates gr ON gr.group_id=card.id AND gr.mapping_id=m.id
     WHERE g.id=$1 AND g.is_active=TRUE AND c.is_active=TRUE AND s.is_active=TRUE AND COALESCE(gr.is_enabled,m.is_enabled)=TRUE
     LIMIT 1`,
    [garmentId, serviceId, resolvedStoreId],
  );
  if (!rows[0]) return null;
  return {
    price: Number(rows[0].price),
    pricingUnit: normalizePricingUnit(rows[0].pricing_unit),
    turnaroundHours: Number(rows[0].turnaround_hours),
    expressAvailable: Boolean(rows[0].express_available),
    expressPrice: rows[0].express_price === null ? null : Number(rows[0].express_price),
  };
}

export async function listCustomerItemCatalog(storeId?: string | null) {
  await ensureItemMasterSchema();
  const resolvedStoreId = await resolveCatalogStoreId(storeId);
  const { rows } = await pool.query(`
    SELECT g.id AS garment_id,g.name AS garment_name,g.short_code,g.image_path AS garment_image_path,
      c.name AS category_name,c.sort_order AS category_sort_order,
      s.id AS service_id,s.name AS service_name,s.slug AS service_slug,s.image_path AS service_image_path,s.sort_order AS service_sort_order,
      COALESCE(gr.price,m.price) AS price,COALESCE(gr.pricing_unit,m.pricing_unit) AS pricing_unit,
      COALESCE(gr.turnaround_hours,m.turnaround_hours) AS turnaround_hours,
      COALESCE(gr.express_available,m.express_available) AS express_available,
      COALESCE(gr.express_price,m.express_price) AS express_price
    FROM garments g JOIN garment_categories c ON c.id=g.category_id
    JOIN garment_service_mappings m ON m.garment_id=g.id
    JOIN services s ON s.id=m.service_id AND s.is_active=TRUE
    LEFT JOIN store_rate_card_assignments a ON a.store_id=$1
    LEFT JOIN rate_card_groups card ON card.id=a.group_id AND card.is_active=TRUE
    LEFT JOIN rate_card_group_rates gr ON gr.group_id=card.id AND gr.mapping_id=m.id
    WHERE g.is_active=TRUE AND c.is_active=TRUE AND COALESCE(gr.is_enabled,m.is_enabled)=TRUE
    ORDER BY c.sort_order,c.name,g.sort_order,g.name,s.sort_order,s.name
  `, [resolvedStoreId]);
  const audienceFor = (value: string): "men" | "women" | "kid" | "other" => {
    const normalized = value.toLowerCase();
    if (normalized === "men") return "men";
    if (normalized === "women") return "women";
    if (["kids", "kid", "children"].includes(normalized)) return "kid";
    return "other";
  };
  const categories: ServiceCategory[] = [];
  const services: CatalogService[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const garmentId = String(row.garment_id);
    if (!seen.has(garmentId)) {
      seen.add(garmentId);
      categories.push({ id: garmentId, name: String(row.garment_name), slug: slugify(String(row.garment_name)), imagePath: String(row.garment_image_path ?? ""), audience: audienceFor(String(row.category_name)), displayOrder: Number(row.category_sort_order), isActive: true });
    }
    const serviceId = String(row.service_id);
    services.push({ id: serviceId, categoryId: garmentId, categoryName: String(row.garment_name), garmentId, garmentName: String(row.garment_name), garmentImagePath: String(row.garment_image_path ?? ""), name: String(row.service_name), slug: `${String(row.service_slug)}-${garmentId}`, imagePath: String(row.service_image_path ?? ""), unit: normalizePricingUnit(row.pricing_unit), regularPrice: Number(row.price), expressPrice: row.express_available && row.express_price !== null ? Number(row.express_price) : null, turnaround: `${Math.max(1, Math.ceil(Number(row.turnaround_hours) / 24))} days`, displayOrder: Number(row.service_sort_order), isActive: true, variants: [] });
  }
  return { categories, services };
}
