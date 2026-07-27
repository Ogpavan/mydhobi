import { pool } from "@/lib/db";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  imagePath: string;
  displayOrder: number;
  isActive: boolean;
};

export type CatalogService = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  imagePath: string;
  unit: "kg" | "item";
  regularPrice: number;
  expressPrice: number | null;
  turnaround: string;
  displayOrder: number;
  isActive: boolean;
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
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
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
        CONSTRAINT catalog_services_unit CHECK (unit IN ('kg','item')),
        CONSTRAINT catalog_services_regular_price CHECK (regular_price >= 0),
        CONSTRAINT catalog_services_express_price CHECK (express_price IS NULL OR express_price >= 0)
      );
      CREATE INDEX IF NOT EXISTS catalog_services_category_idx
      ON catalog_services(category_id, display_order);

      INSERT INTO service_categories (name,slug,image_path,display_order)
      VALUES
        ('Laundry','laundry','/wash_fold.png',1),
        ('Dry Clean','dry-clean','/dryclean.png',2),
        ('Ironing','ironing','/stream.png',3),
        ('Special Care','special-care','',4)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO catalog_services
        (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
      SELECT id,'Wash & Fold','wash-fold','/wash_fold.png','kg',40,60,'1-2 Days',1
      FROM service_categories WHERE slug='laundry'
      ON CONFLICT (slug) DO NOTHING;
      INSERT INTO catalog_services
        (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
      SELECT id,'Wash & Iron','wash-iron','/ironwashing.png','kg',60,85,'1-2 Days',2
      FROM service_categories WHERE slug='laundry'
      ON CONFLICT (slug) DO NOTHING;
      INSERT INTO catalog_services
        (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
      SELECT id,'Dry Clean','dry-clean','/dryclean.png','kg',120,180,'2-3 Days',1
      FROM service_categories WHERE slug='dry-clean'
      ON CONFLICT (slug) DO NOTHING;
      INSERT INTO catalog_services
        (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
      SELECT id,'Steam Iron','steam-iron','/stream.png','item',50,75,'Same Day',1
      FROM service_categories WHERE slug='ironing'
      ON CONFLICT (slug) DO NOTHING;
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
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
  };
}

function mapService(row: Record<string, unknown>): CatalogService {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categoryName: String(row.category_name),
    name: String(row.name),
    slug: String(row.slug),
    imagePath: String(row.image_path),
    unit: row.unit === "item" ? "item" : "kg",
    regularPrice: Number(row.regular_price),
    expressPrice: row.express_price === null ? null : Number(row.express_price),
    turnaround: String(row.turnaround),
    displayOrder: Number(row.display_order),
    isActive: Boolean(row.is_active),
  };
}

export async function listServiceCategories(includeInactive = true) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT id,name,slug,image_path,display_order,is_active
     FROM service_categories
     ${includeInactive ? "" : "WHERE is_active=TRUE"}
     ORDER BY display_order,name`,
  );
  return rows.map(mapCategory);
}

export async function createServiceCategory(input: {
  name: string;
  imagePath: string;
  displayOrder: number;
}) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `INSERT INTO service_categories (name,slug,image_path,display_order)
     VALUES ($1,$2,$3,$4)
     RETURNING id,name,slug,image_path,display_order,is_active`,
    [input.name, slugifyCatalogName(input.name), input.imagePath, input.displayOrder],
  );
  return mapCategory(rows[0]);
}

export async function updateServiceCategory(
  id: string,
  input: Partial<Pick<ServiceCategory, "name" | "imagePath" | "displayOrder" | "isActive">>,
) {
  await ensureServiceCatalogSchema();
  const current = await pool.query("SELECT * FROM service_categories WHERE id=$1", [id]);
  if (!current.rows[0]) return null;
  const row = current.rows[0];
  const name = input.name ?? String(row.name);
  const { rows } = await pool.query(
    `UPDATE service_categories SET name=$2,slug=$3,image_path=$4,display_order=$5,is_active=$6,updated_at=NOW()
     WHERE id=$1 RETURNING id,name,slug,image_path,display_order,is_active`,
    [id, name, slugifyCatalogName(name), input.imagePath ?? row.image_path, input.displayOrder ?? row.display_order, input.isActive ?? row.is_active],
  );
  return mapCategory(rows[0]);
}

const serviceSelect = `
  services.id,services.category_id,categories.name AS category_name,
  services.name,services.slug,services.image_path,services.unit,
  services.regular_price,services.express_price,services.turnaround,
  services.display_order,services.is_active
`;

export async function listCatalogServices(includeInactive = true) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT ${serviceSelect}
     FROM catalog_services services
     INNER JOIN service_categories categories ON categories.id=services.category_id
     ${includeInactive ? "" : "WHERE services.is_active=TRUE AND categories.is_active=TRUE"}
     ORDER BY categories.display_order,services.display_order,services.name`,
  );
  return rows.map(mapService);
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
  return rows[0] ? mapService(rows[0]) : null;
}

export async function createCatalogService(input: {
  categoryId: string;
  name: string;
  imagePath: string;
  unit: "kg" | "item";
  regularPrice: number;
  expressPrice: number | null;
  turnaround: string;
  displayOrder: number;
}) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `INSERT INTO catalog_services
     (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [input.categoryId, input.name, slugifyCatalogName(input.name), input.imagePath, input.unit, input.regularPrice, input.expressPrice, input.turnaround, input.displayOrder],
  );
  return (await getCatalogServiceById(String(rows[0].id)))!;
}

export async function getCatalogServiceById(id: string) {
  await ensureServiceCatalogSchema();
  const { rows } = await pool.query(
    `SELECT ${serviceSelect} FROM catalog_services services
     INNER JOIN service_categories categories ON categories.id=services.category_id
     WHERE services.id=$1 LIMIT 1`,
    [id],
  );
  return rows[0] ? mapService(rows[0]) : null;
}

export async function updateCatalogService(
  id: string,
  input: Partial<Omit<CatalogService, "id" | "categoryName" | "slug">>,
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
  return getCatalogServiceById(id);
}
