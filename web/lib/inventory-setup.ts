import { pool } from "@/lib/db";
import { inventoryCategories, inventoryUnitTypes } from "@/lib/inventory-options";

export type SetupInventoryUnit = {
  id: string;
  name: string;
  categoryCount: number;
  isActive: boolean;
};

export type SetupInventoryCategory = {
  id: string;
  name: string;
  unitTypeId: string;
  unitTypeName: string;
  isActive: boolean;
};

type UnitRow = {
  id: string;
  name: string;
  category_count: string;
  is_active: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  unit_type_id: string;
  unit_type_name: string;
  is_active: boolean;
};

let setupPromise: Promise<void> | null = null;

const defaultCategoryUnits: Record<(typeof inventoryCategories)[number], string> = {
  Detergent: "Liter",
  "Fabric Softener": "Liter",
  Starch: "Kg",
  Bleach: "Liter",
  "Spot Remover": "Bottle",
  "Perfume/Fragrance": "Bottle",
  "Packaging Bag": "Piece",
  Hanger: "Piece",
  Tag: "Piece",
  "Barcode Sticker": "Roll",
  "Laundry Basket": "Piece",
  "Machine Spare Part": "Piece",
  "Cleaning Supplies": "Piece",
  "Office Supplies": "Piece",
  Uniform: "Piece",
};

export function ensureInventorySetupTables() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS setup_inventory_unit_types (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS setup_inventory_units_name_unique
        ON setup_inventory_unit_types (LOWER(name));
        CREATE TABLE IF NOT EXISTS setup_inventory_categories (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          unit_type_id BIGINT NOT NULL REFERENCES setup_inventory_unit_types(id) ON DELETE RESTRICT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS setup_inventory_categories_name_unique
        ON setup_inventory_categories (LOWER(name));
      `);

      for (const unit of inventoryUnitTypes) {
        await pool.query(
          `INSERT INTO setup_inventory_unit_types (name) VALUES ($1)
           ON CONFLICT DO NOTHING`,
          [unit],
        );
      }
      for (const category of inventoryCategories) {
        await pool.query(
          `INSERT INTO setup_inventory_categories (name, unit_type_id)
           SELECT $1, id FROM setup_inventory_unit_types WHERE LOWER(name) = LOWER($2)
           ON CONFLICT DO NOTHING`,
          [category, defaultCategoryUnits[category]],
        );
      }
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function mapUnit(row: UnitRow): SetupInventoryUnit {
  return {
    id: row.id,
    name: row.name,
    categoryCount: Number(row.category_count),
    isActive: row.is_active,
  };
}

function mapCategory(row: CategoryRow): SetupInventoryCategory {
  return {
    id: row.id,
    name: row.name,
    unitTypeId: row.unit_type_id,
    unitTypeName: row.unit_type_name,
    isActive: row.is_active,
  };
}

export function normalizeInventorySetupName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateInventorySetupName(value: string, label: "Category" | "Unit type") {
  if (!value) return `${label} name is required.`;
  if (value.length < 2 || value.length > (label === "Category" ? 100 : 50)) {
    return `${label} name is too long.`;
  }
  return null;
}

export async function listSetupInventoryUnits() {
  await ensureInventorySetupTables();
  const { rows } = await pool.query<UnitRow>(`
    SELECT units.id, units.name, units.is_active,
      COUNT(categories.id)::text AS category_count
    FROM setup_inventory_unit_types units
    LEFT JOIN setup_inventory_categories categories ON categories.unit_type_id = units.id
    GROUP BY units.id, units.name, units.is_active
    ORDER BY units.name ASC
  `);
  return rows.map(mapUnit);
}

export async function createSetupInventoryUnit(name: string) {
  await ensureInventorySetupTables();
  const { rows } = await pool.query<UnitRow>(
    `INSERT INTO setup_inventory_unit_types (name) VALUES ($1)
     RETURNING id, name, is_active, '0'::text AS category_count`,
    [name],
  );
  return mapUnit(rows[0]);
}

export async function updateSetupInventoryUnit(id: string, name: string) {
  await ensureInventorySetupTables();
  const { rows } = await pool.query<UnitRow>(
    `UPDATE setup_inventory_unit_types SET name = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, is_active,
       (SELECT COUNT(*)::text FROM setup_inventory_categories WHERE unit_type_id = setup_inventory_unit_types.id) AS category_count`,
    [id, name],
  );
  return rows[0] ? mapUnit(rows[0]) : null;
}

export async function updateSetupInventoryUnitStatus(id: string, isActive: boolean) {
  await ensureInventorySetupTables();
  if (!isActive) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM setup_inventory_categories
       WHERE unit_type_id = $1 AND is_active = TRUE LIMIT 1`,
      [id],
    );
    if ((rowCount ?? 0) > 0) {
      return { unit: null, usedByActiveCategory: true };
    }
  }
  const { rows } = await pool.query<UnitRow>(
    `UPDATE setup_inventory_unit_types SET is_active = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, is_active,
       (SELECT COUNT(*)::text FROM setup_inventory_categories WHERE unit_type_id = setup_inventory_unit_types.id) AS category_count`,
    [id, isActive],
  );
  return {
    unit: rows[0] ? mapUnit(rows[0]) : null,
    usedByActiveCategory: false,
  };
}

export async function deleteSetupInventoryUnit(id: string) {
  await ensureInventorySetupTables();
  const result = await pool.query(
    "DELETE FROM setup_inventory_unit_types WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listSetupInventoryCategories() {
  await ensureInventorySetupTables();
  const { rows } = await pool.query<CategoryRow>(`
    SELECT categories.id, categories.name, categories.unit_type_id,
      categories.is_active, units.name AS unit_type_name
    FROM setup_inventory_categories categories
    INNER JOIN setup_inventory_unit_types units ON units.id = categories.unit_type_id
    ORDER BY categories.name ASC
  `);
  return rows.map(mapCategory);
}

async function returningCategory(query: string, values: unknown[]) {
  const { rows } = await pool.query<CategoryRow>(query, values);
  return rows[0] ? mapCategory(rows[0]) : null;
}

export async function createSetupInventoryCategory(name: string, unitTypeId: string) {
  await ensureInventorySetupTables();
  return returningCategory(
    `WITH saved AS (
       INSERT INTO setup_inventory_categories (name, unit_type_id)
       SELECT $1, id FROM setup_inventory_unit_types
       WHERE id = $2 AND is_active = TRUE
       RETURNING id, name, unit_type_id, is_active
     )
     SELECT saved.id, saved.name, saved.unit_type_id, saved.is_active,
       units.name AS unit_type_name
     FROM saved INNER JOIN setup_inventory_unit_types units ON units.id = saved.unit_type_id`,
    [name, unitTypeId],
  );
}

export async function updateSetupInventoryCategory(id: string, name: string, unitTypeId: string) {
  await ensureInventorySetupTables();
  return returningCategory(
    `WITH saved AS (
       UPDATE setup_inventory_categories categories
       SET name = $2, unit_type_id = units.id, updated_at = NOW()
       FROM setup_inventory_unit_types units
       WHERE categories.id = $1 AND units.id = $3 AND units.is_active = TRUE
       RETURNING categories.id, categories.name, categories.unit_type_id, categories.is_active
     )
     SELECT saved.id, saved.name, saved.unit_type_id, saved.is_active,
       units.name AS unit_type_name
     FROM saved INNER JOIN setup_inventory_unit_types units ON units.id = saved.unit_type_id`,
    [id, name, unitTypeId],
  );
}

export async function updateSetupInventoryCategoryStatus(id: string, isActive: boolean) {
  await ensureInventorySetupTables();
  return returningCategory(
    `WITH saved AS (
       UPDATE setup_inventory_categories SET is_active = $2, updated_at = NOW()
       WHERE id = $1 RETURNING id, name, unit_type_id, is_active
     )
     SELECT saved.id, saved.name, saved.unit_type_id, saved.is_active,
       units.name AS unit_type_name
     FROM saved INNER JOIN setup_inventory_unit_types units ON units.id = saved.unit_type_id`,
    [id, isActive],
  );
}

export async function deleteSetupInventoryCategory(id: string) {
  await ensureInventorySetupTables();
  const result = await pool.query(
    "DELETE FROM setup_inventory_categories WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function isActiveInventorySelection(category: string, unitType: string) {
  await ensureInventorySetupTables();
  const { rowCount } = await pool.query(
    `SELECT 1 FROM setup_inventory_categories categories
     INNER JOIN setup_inventory_unit_types units ON units.id = categories.unit_type_id
     WHERE LOWER(categories.name) = LOWER($1) AND LOWER(units.name) = LOWER($2)
       AND categories.is_active = TRUE AND units.is_active = TRUE
     LIMIT 1`,
    [category, unitType],
  );
  return (rowCount ?? 0) > 0;
}
