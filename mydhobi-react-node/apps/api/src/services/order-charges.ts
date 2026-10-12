import type {
  OrderCharge,
  OrderChargeInput,
  OrderChargeType,
} from "@mydhobi/domain/order-charges";
import {
  normalizeOrderChargeCode,
  normalizeOrderChargeName,
  orderChargeCodeFromName,
  validateOrderChargeInput,
} from "@mydhobi/domain/order-charges";
import { pool } from "@/lib/db";
import { isSchemaMigration } from "../database/schema-mode";
export type {
  OrderCharge,
  OrderChargeInput,
  OrderChargeType,
} from "@mydhobi/domain/order-charges";

type OrderChargeRow = {
  id: string;
  code: string;
  name: string;
  charge_type: OrderChargeType;
  amount: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

const defaultCharges: Array<{
  code: string;
  name: string;
  type: OrderChargeType;
  amount: number;
}> = [
  { code: "packing", name: "Packing charge", type: "extra", amount: 30 },
  {
    code: "express",
    name: "Express handling",
    type: "extra",
    amount: 100,
  },
  {
    code: "home_delivery",
    name: "Home delivery",
    type: "delivery",
    amount: 80,
  },
  {
    code: "urgent_delivery",
    name: "Urgent delivery",
    type: "delivery",
    amount: 100,
  },
  { code: "gst", name: "GST", type: "tax", amount: 5 },
];

let setupPromise: Promise<void> | null = null;

export function ensureOrderChargeSchema() {
  if (!isSchemaMigration()) return Promise.resolve();
  if (!setupPromise) {
    setupPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_charges (
          id BIGSERIAL PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(80) NOT NULL,
          charge_type VARCHAR(20) NOT NULL,
          amount NUMERIC(12,2) NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT order_charges_type CHECK (charge_type IN ('extra','delivery','tax')),
          CONSTRAINT order_charges_amount CHECK (amount >= 0)
        );
        CREATE INDEX IF NOT EXISTS order_charges_active_idx
          ON order_charges(is_active, charge_type, name);
      `);
      for (const charge of defaultCharges) {
        await pool.query(
          `INSERT INTO order_charges(code,name,charge_type,amount)
           VALUES($1,$2,$3,$4) ON CONFLICT(code) DO NOTHING`,
          [charge.code, charge.name, charge.type, charge.amount],
        );
      }
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function mapOrderCharge(row: OrderChargeRow): OrderCharge {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    type: row.charge_type,
    amount: Number(row.amount),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function parseOrderChargeInput(
  body: Record<string, unknown>,
  existingCode?: string,
): OrderChargeInput | null {
  const name = normalizeOrderChargeName(body.name);
  const code = normalizeOrderChargeCode(
    existingCode ?? body.code ?? orderChargeCodeFromName(name),
  );
  const type = body.type;
  const amount = Number(body.amount);
  if (type !== "extra" && type !== "delivery" && type !== "tax") return null;
  const input: OrderChargeInput = {
    code,
    name,
    type,
    amount,
    isActive: body.isActive !== false,
  };
  return validateOrderChargeInput(input) ? null : input;
}

export async function listOrderCharges(includeInactive = false) {
  await ensureOrderChargeSchema();
  const { rows } = await pool.query<OrderChargeRow>(
    `SELECT id,code,name,charge_type,amount,is_active,created_at,updated_at
     FROM order_charges
     ${includeInactive ? "" : "WHERE is_active=TRUE"}
     ORDER BY charge_type,name,id`,
  );
  return rows.map(mapOrderCharge);
}

export async function getOrderChargeById(id: string) {
  await ensureOrderChargeSchema();
  const { rows } = await pool.query<OrderChargeRow>(
    `SELECT id,code,name,charge_type,amount,is_active,created_at,updated_at
     FROM order_charges WHERE id=$1 LIMIT 1`,
    [id],
  );
  return rows[0] ? mapOrderCharge(rows[0]) : null;
}

export async function createOrderCharge(input: OrderChargeInput) {
  await ensureOrderChargeSchema();
  const { rows } = await pool.query<OrderChargeRow>(
    `INSERT INTO order_charges(code,name,charge_type,amount,is_active)
     VALUES($1,$2,$3,$4,$5)
     RETURNING id,code,name,charge_type,amount,is_active,created_at,updated_at`,
    [input.code, input.name, input.type, input.amount, input.isActive],
  );
  return mapOrderCharge(rows[0]);
}

export async function updateOrderCharge(id: string, input: OrderChargeInput) {
  await ensureOrderChargeSchema();
  const { rows } = await pool.query<OrderChargeRow>(
    `UPDATE order_charges
     SET name=$2,charge_type=$3,amount=$4,is_active=$5,updated_at=NOW()
     WHERE id=$1
     RETURNING id,code,name,charge_type,amount,is_active,created_at,updated_at`,
    [id, input.name, input.type, input.amount, input.isActive],
  );
  return rows[0] ? mapOrderCharge(rows[0]) : null;
}
