import { pool } from "@/lib/db";
import { GARMENT_AUDIENCES, type GarmentAudience } from "@/lib/garment-audience";

export { GARMENT_AUDIENCES } from "@/lib/garment-audience";
export type { GarmentAudience } from "@/lib/garment-audience";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  imagePath: string;
  audience: GarmentAudience;
  displayOrder: number;
  isActive: boolean;
};

// Kept as an alias while the existing admin API routes are migrated. In the
// customer flow, a category is now a garment (for example, Blazer or Cap).
export type GarmentCategory = ServiceCategory;

export const CATALOG_UNITS = ["piece", "kg", "pair", "seat", "sq_ft", "set", "fixed"] as const;
export type CatalogUnit = (typeof CATALOG_UNITS)[number];

export type CatalogVariant = {
  id: string;
  serviceId: string;
  name: string;
  unit: CatalogUnit;
  regularPrice: number;
  expressPrice: number | null;
  displayOrder: number;
  isActive: boolean;
};

export type CatalogService = {
  id: string;
  categoryId: string;
  categoryName: string;
  garmentId: string;
  garmentName: string;
  garmentImagePath: string;
  name: string;
  slug: string;
  imagePath: string;
  unit: CatalogUnit;
  regularPrice: number;
  expressPrice: number | null;
  turnaround: string;
  displayOrder: number;
  isActive: boolean;
  variants: CatalogVariant[];
};

let setupPromise: Promise<void> | null = null;

export function ensureServiceCatalogSchema() {
  if (!setupPromise) {
    setupPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        slug VARCHAR(90) NOT NULL UNIQUE,
        image_path VARCHAR(250) NOT NULL DEFAULT '',
        audience VARCHAR(20) NOT NULL DEFAULT 'other',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'other';
      UPDATE service_categories SET audience='other' WHERE audience IS NULL OR audience NOT IN ('men','women','kid','other');
      ALTER TABLE service_categories DROP CONSTRAINT IF EXISTS service_categories_audience;
      ALTER TABLE service_categories ADD CONSTRAINT service_categories_audience CHECK (audience IN ('men','women','kid','other'));
      CREATE TABLE IF NOT EXISTS catalog_services (
        id BIGSERIAL PRIMARY KEY,
        category_id BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(110) NOT NULL UNIQUE,
        image_path VARCHAR(250) NOT NULL DEFAULT '',
        unit VARCHAR(20) NOT NULL,
        regular_price NUMERIC(12,2) NOT NULL,
        express_price NUMERIC(12,2),
        turnaround VARCHAR(60) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT catalog_services_unit CHECK (unit IN ('piece','kg','pair','seat','sq_ft','set','fixed','item')),
        CONSTRAINT catalog_services_regular_price CHECK (regular_price >= 0),
        CONSTRAINT catalog_services_express_price CHECK (express_price IS NULL OR express_price >= 0)
      );
      CREATE INDEX IF NOT EXISTS catalog_services_category_idx
      ON catalog_services(category_id, display_order);

      ALTER TABLE catalog_services DROP CONSTRAINT IF EXISTS catalog_services_unit;
      ALTER TABLE catalog_services
        ADD CONSTRAINT catalog_services_unit
        CHECK (unit IN ('piece','kg','pair','seat','sq_ft','set','fixed','item'));

      CREATE TABLE IF NOT EXISTS catalog_service_variants (
        id BIGSERIAL PRIMARY KEY,
        service_id BIGINT NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        regular_price NUMERIC(12,2) NOT NULL DEFAULT 0,
        express_price NUMERIC(12,2),
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT catalog_service_variants_unit CHECK (unit IN ('piece','kg','pair','seat','sq_ft','set','fixed')),
        CONSTRAINT catalog_service_variants_regular_price CHECK (regular_price >= 0),
        CONSTRAINT catalog_service_variants_express_price CHECK (express_price IS NULL OR express_price >= 0),
        UNIQUE (service_id, name)
      );
      CREATE INDEX IF NOT EXISTS catalog_service_variants_service_idx
        ON catalog_service_variants(service_id, display_order);

      CREATE TABLE IF NOT EXISTS service_catalog_images (
        id BIGSERIAL PRIMARY KEY,
        image_data BYTEA NOT NULL,
        image_mime VARCHAR(40) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

    `).then(() => undefined).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

export function slugifyCatalogName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
}

function mapCategory(row: Record<string, unknown>): ServiceCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    imagePath: String(row.image_path),
    audience: GARMENT_AUDIENCES.includes(row.audience as GarmentAudience)
      ? row.audience as GarmentAudience
      : "other",
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
  };
}

function mapUnit(value: unknown): CatalogUnit {
  return CATALOG_UNITS.includes(value as CatalogUnit) ? value as CatalogUnit : "piece";
}

function mapVariant(row: Record<string, unknown>): CatalogVariant {
  return {
    id: String(row.id),
    serviceId: String(row.service_id),
    name: String(row.name),
    unit: mapUnit(row.unit),
    regularPrice: Number(row.regular_price),
    expressPrice: row.express_price === null ? null : Number(row.express_price),
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
  };
}

function mapService(row: Record<string, unknown>, variants: CatalogVariant[] = []): CatalogService {
  const firstVariant = variants[0];
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categoryName: String(row.category_name),
    garmentId: String(row.category_id),
    garmentName: String(row.category_name),
    garmentImagePath: String(row.category_image_path ?? ""),
    name: String(row.name),
    slug: String(row.slug),
    imagePath: String(row.image_path),
    unit: variants.length ? firstVariant!.unit : mapUnit(row.unit === "item" ? "piece" : row.unit),
    regularPrice: variants.length ? firstVariant!.regularPrice : Number(row.regular_price),
    expressPrice: variants.length ? firstVariant!.expressPrice : (row.express_price === null ? null : Number(row.express_price)),
    turnaround: String(row.turnaround),
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
    variants,
  };
}

export async function listServiceCategories(includeInactive = true) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT id,name,slug,image_path,audience,display_order,is_active
     FROM service_categories
     ${includeInactive ? "" : "WHERE is_active=TRUE"}
     ORDER BY display_order,name`,
  );
  return rows.map(mapCategory);
}

export async function createServiceCategory(input: {
  name: string;
  imagePath: string;
  audience: GarmentAudience;
  displayOrder: number;
}) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `INSERT INTO service_categories (name,slug,image_path,audience,display_order)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id,name,slug,image_path,audience,display_order,is_active`,
    [input.name, slugifyCatalogName(input.name), input.imagePath, input.audience, input.displayOrder],
  );
  return mapCategory(rows[0]);
}

export async function createServiceCatalogImage(data: Buffer, mime: string) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO service_catalog_images (image_data, image_mime)
     VALUES ($1, $2) RETURNING id`,
    [data, mime],
  );
  return String(rows[0].id);
}

export async function getServiceCatalogImage(id: string) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query<{
    image_data: Buffer;
    image_mime: string;
  }>(
    `SELECT image_data, image_mime
     FROM service_catalog_images
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateServiceCategory(
  id: string,
  input: Partial<Pick<ServiceCategory, "name" | "imagePath" | "audience" | "displayOrder" | "isActive">>,
) {
  await ensureServiceCatalogSchema();
  const current = await pool.query("SELECT * FROM service_categories WHERE id=$1", [id]);
  if (!current.rows[0]) return null;
  const row = current.rows[0];
  const name = input.name ?? String(row.name);
  const { rows } = await pool.query(
    `UPDATE service_categories SET name=$2,slug=$3,image_path=$4,audience=$5,display_order=$6,is_active=$7,updated_at=NOW()
     WHERE id=$1 RETURNING id,name,slug,image_path,audience,display_order,is_active`,
    [id, name, slugifyCatalogName(name), input.imagePath ?? row.image_path, input.audience ?? row.audience ?? "other", input.displayOrder ?? row.display_order, input.isActive ?? row.is_active],
  );
  return mapCategory(rows[0]);
}

export async function deleteServiceCategory(id: string) {
  await ensureServiceCatalogSchema();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const category = await client.query(
      "SELECT id FROM service_categories WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!category.rows[0]) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("DELETE FROM catalog_services WHERE category_id=$1", [id]);
    await client.query("DELETE FROM service_categories WHERE id=$1", [id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCatalogService(id: string) {
  await ensureServiceCatalogSchema();
  const result = await pool.query("DELETE FROM catalog_services WHERE id=$1 RETURNING id", [id]);
  return Boolean(result.rows[0]);
}

const serviceSelect = `
  services.id,services.category_id,categories.name AS category_name,categories.image_path AS category_image_path,
  services.name,services.slug,services.image_path,services.unit,
  services.regular_price,services.express_price,services.turnaround,
  services.display_order,services.is_active
`;

const variantSelect = `
  variants.id,variants.service_id,variants.name,variants.unit,
  variants.regular_price,variants.express_price,variants.display_order,
  variants.is_active
`;

async function attachVariants(rows: Record<string, unknown>[]) {
  if (!rows.length) return [] as CatalogService[];
  const variantResult = await pool.query(
    `SELECT ${variantSelect}
     FROM catalog_service_variants variants
     WHERE variants.service_id = ANY($1::bigint[])
     ORDER BY variants.display_order,variants.name`,
    [rows.map((row) => String(row.id))],
  );
  const variantsByService = new Map<string, CatalogVariant[]>();
  for (const row of variantResult.rows) {
    const variant = mapVariant(row);
    const current = variantsByService.get(variant.serviceId) ?? [];
    current.push(variant);
    variantsByService.set(variant.serviceId, current);
  }
  return rows.map((row) => mapService(row, variantsByService.get(String(row.id)) ?? []));
}

export async function listCatalogServices(includeInactive = true) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT ${serviceSelect}
     FROM catalog_services services
     INNER JOIN service_categories categories ON categories.id=services.category_id
     ${includeInactive ? "" : "WHERE services.is_active=TRUE AND categories.is_active=TRUE"}
     ORDER BY categories.display_order,services.display_order,services.name`,
  );
  return attachVariants(rows);
}

export async function getCatalogServiceBySlug(slug: string) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT ${serviceSelect}
     FROM catalog_services services
     INNER JOIN service_categories categories ON categories.id=services.category_id
     WHERE services.slug=$1 AND services.is_active=TRUE AND categories.is_active=TRUE LIMIT 1`,
    [slug],
  );
  if (!rows[0]) return null;
  const services = await attachVariants(rows);
  return services[0] ?? null;
}

export async function createCatalogService(input: {
  categoryId: string;
  name: string;
  imagePath: string;
  unit: CatalogUnit;
  regularPrice: number;
  expressPrice: number | null;
  turnaround: string;
  displayOrder: number;
  variantName?: string;
}) {
  await ensureServiceCatalogSchema();
  const client = await pool.connect();
  let id = "";
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO catalog_services
       (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [input.categoryId, input.name, slugifyCatalogName(input.name), input.imagePath, input.unit, input.regularPrice, input.expressPrice, input.turnaround, input.displayOrder],
    );
    id = String(rows[0].id);
    await client.query(
      `INSERT INTO catalog_service_variants
       (service_id,name,unit,regular_price,express_price,display_order)
       VALUES ($1,$2,$3,$4,$5,0)`,
      [id, input.variantName?.trim() || "Standard", input.unit, input.regularPrice, input.expressPrice],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return (await getCatalogServiceById(id))!;
}

export async function getCatalogServiceById(id: string) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT ${serviceSelect} FROM catalog_services services
     INNER JOIN service_categories categories ON categories.id=services.category_id
     WHERE services.id=$1 LIMIT 1`,
    [id],
  );
  if (!rows[0]) return null;
  const services = await attachVariants(rows);
  return services[0] ?? null;
}

export async function updateCatalogService(
  id: string,
  input: Partial<Pick<CatalogService, "categoryId" | "name" | "imagePath" | "unit" | "regularPrice" | "expressPrice" | "turnaround" | "displayOrder" | "isActive">> & { variantName?: string },
) {
  await ensureServiceCatalogSchema();
  const current = await getCatalogServiceById(id);
  if (!current) return null;
  const name = input.name ?? current.name;
  await pool.query(
    `UPDATE catalog_services SET category_id=$2,name=$3,slug=$4,image_path=$5,unit=$6,
     regular_price=$7,express_price=$8,turnaround=$9,display_order=$10,is_active=$11,updated_at=NOW()
     WHERE id=$1`,
    [id, input.categoryId ?? current.categoryId, name, slugifyCatalogName(name), input.imagePath ?? current.imagePath, input.unit ?? current.unit, input.regularPrice ?? current.regularPrice, input.expressPrice === undefined ? current.expressPrice : input.expressPrice, input.turnaround ?? current.turnaround, input.displayOrder ?? current.displayOrder, input.isActive ?? current.isActive],
  );
  const variant = await pool.query(
    `SELECT id,name FROM catalog_service_variants WHERE service_id=$1 ORDER BY display_order,id LIMIT 1`,
    [id],
  );
  if (variant.rows[0]) {
    await pool.query(
      `UPDATE catalog_service_variants
       SET name=$2,unit=$3,regular_price=$4,express_price=$5,updated_at=NOW()
       WHERE id=$1`,
      [variant.rows[0].id, input.variantName ?? variant.rows[0].name, input.unit ?? current.unit, input.regularPrice ?? current.regularPrice, input.expressPrice === undefined ? current.expressPrice : input.expressPrice],
    );
  }
  return getCatalogServiceById(id);
}

export async function updateCatalogServiceVariant(
  id: string,
  input: Partial<Pick<CatalogVariant, "name" | "unit" | "regularPrice" | "expressPrice" | "displayOrder" | "isActive">>,
) {
  await ensureServiceCatalogSchema();
  const current = await pool.query(
    `SELECT ${variantSelect} FROM catalog_service_variants variants WHERE variants.id=$1`,
    [id],
  );
  if (!current.rows[0]) return null;
  const row = current.rows[0];
  const { rows } = await pool.query(
    `UPDATE catalog_service_variants
     SET name=$2,unit=$3,regular_price=$4,express_price=$5,display_order=$6,is_active=$7,updated_at=NOW()
     WHERE id=$1
     RETURNING id,service_id,name,unit,regular_price,express_price,display_order,is_active`,
    [
      id,
      input.name ?? row.name,
      input.unit ?? row.unit,
      input.regularPrice ?? row.regular_price,
      input.expressPrice === undefined ? row.express_price : input.expressPrice,
      input.displayOrder ?? row.display_order,
      input.isActive ?? row.is_active,
    ],
  );
  return mapVariant(rows[0]);
}
