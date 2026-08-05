import { pool } from "@/lib/db";

export type InventoryCategory = string;
export type InventoryUnitType = string;

export type InventoryStatus = "active" | "inactive";
export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  brand: string;
  description: string;
  unitType: InventoryUnitType;
  packSize: string;
  openingStock: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  reorderQuantity: number | null;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number | null;
  taxPercent: number | null;
  lastPurchaseDate: string;
  warehouse: string;
  rackNumber: string;
  shelf: string;
  bin: string;
  hasExpiry: boolean;
  manufacturingDate: string;
  expiryDate: string;
  batchNumber: string;
  status: InventoryStatus;
  internalNotes: string;
  createdAt: string;
};

export type InventoryPayload = Omit<
  InventoryItem,
  "id" | "sku" | "currentStock" | "createdAt"
>;

type InventoryRow = {
  id: string;
  store_id: string | null;
  name: string;
  category: InventoryCategory;
  brand: string;
  description: string;
  unit_type: InventoryUnitType;
  pack_size: string;
  opening_stock: string;
  current_stock: string;
  minimum_stock: string;
  maximum_stock: string | null;
  reorder_quantity: string | null;
  supplier: string;
  purchase_price: string;
  selling_price: string | null;
  tax_percent: string | null;
  last_purchase_date: string | Date | null;
  warehouse: string;
  rack_number: string;
  shelf: string;
  bin: string;
  has_expiry: boolean;
  manufacturing_date: string | Date | null;
  expiry_date: string | Date | null;
  batch_number: string;
  status: InventoryStatus;
  internal_notes: string;
  created_at: Date;
};

const inventoryColumns = `
  id, store_id, name, category, brand, description, unit_type, pack_size, opening_stock,
  current_stock, minimum_stock, maximum_stock, reorder_quantity, supplier,
  purchase_price, selling_price, tax_percent, last_purchase_date, warehouse,
  rack_number, shelf, bin, has_expiry, manufacturing_date, expiry_date,
  batch_number, status, internal_notes, created_at
`;

let setupPromise: Promise<void> | null = null;

export function ensureInventoryTable() {
  if (!setupPromise) {
    setupPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id BIGSERIAL PRIMARY KEY,
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        brand VARCHAR(100) NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        unit_type VARCHAR(20) NOT NULL,
        pack_size VARCHAR(50) NOT NULL DEFAULT '',
        opening_stock NUMERIC(14, 3) NOT NULL,
        current_stock NUMERIC(14, 3) NOT NULL,
        minimum_stock NUMERIC(14, 3) NOT NULL,
        maximum_stock NUMERIC(14, 3),
        reorder_quantity NUMERIC(14, 3),
        supplier VARCHAR(150) NOT NULL DEFAULT '',
        purchase_price NUMERIC(14, 2) NOT NULL,
        selling_price NUMERIC(14, 2),
        tax_percent NUMERIC(5, 2),
        last_purchase_date DATE,
        warehouse VARCHAR(100) NOT NULL DEFAULT '',
        rack_number VARCHAR(50) NOT NULL DEFAULT '',
        shelf VARCHAR(50) NOT NULL DEFAULT '',
        bin VARCHAR(50) NOT NULL DEFAULT '',
        has_expiry BOOLEAN NOT NULL DEFAULT FALSE,
        manufacturing_date DATE,
        expiry_date DATE,
        batch_number VARCHAR(100) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        internal_notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT inventory_stock_nonnegative CHECK (
          opening_stock >= 0 AND current_stock >= 0 AND minimum_stock >= 0 AND
          (maximum_stock IS NULL OR maximum_stock >= 0) AND
          (reorder_quantity IS NULL OR reorder_quantity >= 0)
        ),
        CONSTRAINT inventory_prices_nonnegative CHECK (
          purchase_price >= 0 AND (selling_price IS NULL OR selling_price >= 0)
        ),
        CONSTRAINT inventory_tax_range CHECK (tax_percent IS NULL OR (tax_percent >= 0 AND tax_percent <= 100)),
        CONSTRAINT inventory_status_values CHECK (status IN ('active', 'inactive'))
      );
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS inventory_items_store_id_idx ON inventory_items(store_id)
    `).then(() => undefined).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const normalized = text(value);
  return normalized === "" ? null : Number(normalized);
}

export function normalizeInventoryPayload(input: Record<string, unknown>): InventoryPayload {
  return {
    name: text(input.name).replace(/\s+/g, " "),
    category: text(input.category),
    brand: text(input.brand),
    description: text(input.description),
    unitType: text(input.unitType),
    packSize: text(input.packSize),
    openingStock: numberOrNull(input.openingStock) as number,
    minimumStock: numberOrNull(input.minimumStock) as number,
    maximumStock: numberOrNull(input.maximumStock),
    reorderQuantity: numberOrNull(input.reorderQuantity),
    supplier: text(input.supplier),
    purchasePrice: numberOrNull(input.purchasePrice) as number,
    sellingPrice: numberOrNull(input.sellingPrice),
    taxPercent: numberOrNull(input.taxPercent),
    lastPurchaseDate: text(input.lastPurchaseDate),
    warehouse: text(input.warehouse),
    rackNumber: text(input.rackNumber),
    shelf: text(input.shelf),
    bin: text(input.bin),
    hasExpiry: input.hasExpiry === true || input.hasExpiry === "yes",
    manufacturingDate: text(input.manufacturingDate),
    expiryDate: text(input.expiryDate),
    batchNumber: text(input.batchNumber),
    status: input.status === "inactive" ? "inactive" : "active",
    internalNotes: text(input.internalNotes),
  };
}

export function validateInventoryPayload(payload: InventoryPayload) {
  if (!payload.name) return "Item name is required.";
  if (payload.name.length > 150) return "Item name is too long.";
  if (!payload.category) return "Select a category.";
  if (!payload.unitType) return "Select a unit type.";
  const requiredNumbers: Array<[string, number]> = [
    ["Opening stock", payload.openingStock],
    ["Minimum stock level", payload.minimumStock],
    ["Purchase price", payload.purchasePrice],
  ];
  const missingNumber = requiredNumbers.find(([, value]) =>
    value === null || !Number.isFinite(value));
  if (missingNumber) return `${missingNumber[0]} is required.`;

  const nonnegativeNumbers = [
    ...requiredNumbers,
    ["Maximum stock level", payload.maximumStock],
    ["Reorder quantity", payload.reorderQuantity],
    ["Selling price", payload.sellingPrice],
  ] as Array<[string, number | null]>;
  const invalidNumber = nonnegativeNumbers.find(([, value]) =>
    value !== null && (!Number.isFinite(value) || value < 0));
  if (invalidNumber) return `${invalidNumber[0]} must be 0 or more.`;
  if (payload.maximumStock !== null && payload.maximumStock < payload.minimumStock) {
    return "Maximum stock must be equal to or more than minimum stock.";
  }
  if (payload.taxPercent !== null &&
      (!Number.isFinite(payload.taxPercent) || payload.taxPercent < 0 || payload.taxPercent > 100)) {
    return "Tax must be between 0 and 100.";
  }
  if (payload.hasExpiry && payload.manufacturingDate && payload.expiryDate &&
      payload.expiryDate < payload.manufacturingDate) {
    return "Expiry date must be after manufacturing date.";
  }
  const dates: Array<[string, string]> = [
    ["Last purchase date", payload.lastPurchaseDate],
    ["Manufacturing date", payload.manufacturingDate],
    ["Expiry date", payload.expiryDate],
  ];
  const invalidDate = dates.find(([, value]) => {
    if (!value) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value;
  });
  if (invalidDate) return `${invalidDate[0]} is not valid.`;
  const maxLengths: Array<[string, string, number]> = [
    ["Brand", payload.brand, 100],
    ["Pack size", payload.packSize, 50],
    ["Supplier", payload.supplier, 150],
    ["Warehouse", payload.warehouse, 100],
    ["Rack number", payload.rackNumber, 50],
    ["Shelf", payload.shelf, 50],
    ["Bin", payload.bin, 50],
    ["Batch number", payload.batchNumber, 100],
  ];
  const tooLong = maxLengths.find(([, value, max]) => value.length > max);
  if (tooLong) return `${tooLong[0]} is too long.`;
  return null;
}

function formatSku(id: string) {
  return `INV-${id.padStart(6, "0")}`;
}

function formatDate(value: string | Date | null) {
  if (!value) return "";
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

function mapInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    sku: formatSku(row.id),
    name: row.name,
    category: row.category,
    brand: row.brand,
    description: row.description,
    unitType: row.unit_type,
    packSize: row.pack_size,
    openingStock: Number(row.opening_stock),
    currentStock: Number(row.current_stock),
    minimumStock: Number(row.minimum_stock),
    maximumStock: row.maximum_stock === null ? null : Number(row.maximum_stock),
    reorderQuantity: row.reorder_quantity === null ? null : Number(row.reorder_quantity),
    supplier: row.supplier,
    purchasePrice: Number(row.purchase_price),
    sellingPrice: row.selling_price === null ? null : Number(row.selling_price),
    taxPercent: row.tax_percent === null ? null : Number(row.tax_percent),
    lastPurchaseDate: formatDate(row.last_purchase_date),
    warehouse: row.warehouse,
    rackNumber: row.rack_number,
    shelf: row.shelf,
    bin: row.bin,
    hasExpiry: row.has_expiry,
    manufacturingDate: formatDate(row.manufacturing_date),
    expiryDate: formatDate(row.expiry_date),
    batchNumber: row.batch_number,
    status: row.status,
    internalNotes: row.internal_notes,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listInventoryItems(storeId?: string | null) {
  await ensureInventoryTable();
  const { rows } = await pool.query<InventoryRow>(
    `SELECT ${inventoryColumns} FROM inventory_items
     WHERE ($1::uuid IS NULL OR store_id=$1)
     ORDER BY created_at DESC`,
    [storeId ?? null],
  );
  return rows.map(mapInventoryItem);
}

export async function getInventoryItemById(id: string, storeId?: string | null) {
  await ensureInventoryTable();
  const { rows } = await pool.query<InventoryRow>(
    `SELECT ${inventoryColumns} FROM inventory_items
     WHERE id = $1 AND ($2::uuid IS NULL OR store_id=$2) LIMIT 1`,
    [id, storeId ?? null],
  );
  return rows[0] ? mapInventoryItem(rows[0]) : null;
}

export async function createInventoryItem(payload: InventoryPayload, storeId?: string | null) {
  await ensureInventoryTable();
  const { rows } = await pool.query<InventoryRow>(
    `INSERT INTO inventory_items (
      store_id, name, category, brand, description, unit_type, pack_size, opening_stock,
      current_stock, minimum_stock, maximum_stock, reorder_quantity, supplier,
      purchase_price, selling_price, tax_percent, last_purchase_date, warehouse,
      rack_number, shelf, bin, has_expiry, manufacturing_date, expiry_date,
      batch_number, status, internal_notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15,
      NULLIF($16, '')::date, $17, $18, $19, $20, $21,
      NULLIF($22, '')::date, NULLIF($23, '')::date, $24, $25, $26
    ) RETURNING ${inventoryColumns}`,
    [
      storeId ?? null, payload.name, payload.category, payload.brand, payload.description,
      payload.unitType, payload.packSize, payload.openingStock,
      payload.minimumStock, payload.maximumStock, payload.reorderQuantity,
      payload.supplier, payload.purchasePrice, payload.sellingPrice,
      payload.taxPercent, payload.lastPurchaseDate, payload.warehouse,
      payload.rackNumber, payload.shelf, payload.bin, payload.hasExpiry,
      payload.hasExpiry ? payload.manufacturingDate : "",
      payload.hasExpiry ? payload.expiryDate : "",
      payload.hasExpiry ? payload.batchNumber : "",
      payload.status, payload.internalNotes,
    ],
  );
  return mapInventoryItem(rows[0]);
}

export async function updateInventoryItem(
  id: string,
  payload: InventoryPayload,
  storeId?: string | null,
) {
  await ensureInventoryTable();
  const { rows } = await pool.query<InventoryRow>(
    `UPDATE inventory_items SET
      name = $2, category = $3, brand = $4, description = $5,
      unit_type = $6, pack_size = $7, opening_stock = $8,
      minimum_stock = $9, maximum_stock = $10, reorder_quantity = $11,
      supplier = $12, purchase_price = $13, selling_price = $14,
      tax_percent = $15, last_purchase_date = NULLIF($16, '')::date,
      warehouse = $17, rack_number = $18, shelf = $19, bin = $20,
      has_expiry = $21, manufacturing_date = NULLIF($22, '')::date,
      expiry_date = NULLIF($23, '')::date, batch_number = $24,
      status = $25, internal_notes = $26, updated_at = NOW()
     WHERE id = $1 AND ($27::uuid IS NULL OR store_id=$27)
     RETURNING ${inventoryColumns}`,
    [
      id, payload.name, payload.category, payload.brand, payload.description,
      payload.unitType, payload.packSize, payload.openingStock,
      payload.minimumStock, payload.maximumStock, payload.reorderQuantity,
      payload.supplier, payload.purchasePrice, payload.sellingPrice,
      payload.taxPercent, payload.lastPurchaseDate, payload.warehouse,
      payload.rackNumber, payload.shelf, payload.bin, payload.hasExpiry,
      payload.hasExpiry ? payload.manufacturingDate : "",
      payload.hasExpiry ? payload.expiryDate : "",
      payload.hasExpiry ? payload.batchNumber : "",
      payload.status, payload.internalNotes,
      storeId ?? null,
    ],
  );
  return rows[0] ? mapInventoryItem(rows[0]) : null;
}

export async function updateInventoryItemStatus(
  id: string,
  status: InventoryStatus,
  storeId?: string | null,
) {
  await ensureInventoryTable();
  const { rows } = await pool.query<InventoryRow>(
    `UPDATE inventory_items SET status = $2, updated_at = NOW()
     WHERE id = $1 AND ($3::uuid IS NULL OR store_id=$3)
     RETURNING ${inventoryColumns}`,
    [id, status, storeId ?? null],
  );
  return rows[0] ? mapInventoryItem(rows[0]) : null;
}

export async function deleteInventoryItem(id: string, storeId?: string | null) {
  await ensureInventoryTable();
  const result = await pool.query(
    "DELETE FROM inventory_items WHERE id = $1 AND ($2::uuid IS NULL OR store_id=$2)",
    [id, storeId ?? null],
  );
  return (result.rowCount ?? 0) > 0;
}
