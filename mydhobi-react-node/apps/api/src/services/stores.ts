import { pool } from "@/lib/db";
import type {
  Store,
  StoreDiscountPolicy,
  StorePayload,
  StoreStatus,
} from "@mydhobi/domain/stores";
import { isSchemaMigration } from "../database/schema-mode";
export type {
  Store,
  StoreDiscountPolicy,
  StorePayload,
  StoreStatus,
} from "@mydhobi/domain/stores";

type StoreRow = {
  id: string;
  store_number: number;
  name: string;
  company: string;
  email: string;
  mobile: string;
  process_time: string;
  tag_delivery_date_interval: string;
  invoice_gen_name: string;
  invoice_gen_number: string;
  upi_account_name: string;
  upi_account_id: string;
  upi_disclaimer: string;
  notification_note: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  landmark: string;
  pin_code: string;
  latitude: string;
  longitude: string;
  discounts_enabled: boolean;
  max_discount_percent: string;
  max_discount_amount: string;
  discount_group_id: number | null;
  discount_group_name?: string | null;
  status: StoreStatus;
  created_at: Date;
  updated_at: Date;
};

const storeColumns = `
  id,
  store_number,
  name,
  company,
  email,
  mobile,
  process_time,
  tag_delivery_date_interval,
  invoice_gen_name,
  invoice_gen_number,
  upi_account_name,
  upi_account_id,
  upi_disclaimer,
  notification_note,
  address_line1,
  address_line2,
  city,
  state,
  landmark,
  pin_code,
  latitude,
  longitude,
  discounts_enabled,
  max_discount_percent,
  max_discount_amount,
  discount_group_id,
  (SELECT groups.name FROM discount_groups groups WHERE groups.id=stores.discount_group_id) AS discount_group_name,
  status,
  created_at,
  updated_at
`;

function formatStoreCode(storeNumber: number) {
  return `ST-${String(storeNumber).padStart(3, "0")}`;
}

function mapStore(row: StoreRow): Store {
  return {
    id: row.id,
    storeNumber: row.store_number,
    storeCode: formatStoreCode(row.store_number),
    name: row.name,
    company: row.company,
    email: row.email,
    mobile: row.mobile,
    processTime: row.process_time,
    tagDeliveryDateInterval: row.tag_delivery_date_interval,
    invoiceGenName: row.invoice_gen_name,
    invoiceGenNumber: row.invoice_gen_number,
    upiAccountName: row.upi_account_name,
    upiAccountId: row.upi_account_id,
    upiDisclaimer: row.upi_disclaimer,
    notificationNote: row.notification_note,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    landmark: row.landmark,
    pinCode: row.pin_code,
    latitude: row.latitude,
    longitude: row.longitude,
    discountsEnabled: row.discounts_enabled,
    maxDiscountPercent: Number(row.max_discount_percent),
    maxDiscountAmount: Number(row.max_discount_amount),
    discountGroupId:
      row.discount_group_id === null ? null : Number(row.discount_group_id),
    discountGroupName: row.discount_group_name
      ? String(row.discount_group_name)
      : null,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function normalizeStorePayload(
  input: Partial<StorePayload>,
): StorePayload {
  const status =
    input.status === "draft" || input.status === "inactive"
      ? input.status
      : "active";
  const discountsEnabled = input.discountsEnabled === true;
  const maxDiscountPercent = Number(input.maxDiscountPercent ?? 0);
  const maxDiscountAmount = Number(input.maxDiscountAmount ?? 0);
  const discountGroupId =
    input.discountGroupId === null || input.discountGroupId === undefined
      ? null
      : Number(input.discountGroupId);

  return {
    name: input.name?.trim() ?? "",
    company: input.company?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    mobile: input.mobile?.trim() ?? "",
    processTime: input.processTime?.trim() ?? "",
    tagDeliveryDateInterval: input.tagDeliveryDateInterval?.trim() ?? "",
    invoiceGenName: input.invoiceGenName?.trim() ?? "",
    invoiceGenNumber: input.invoiceGenNumber?.trim() ?? "",
    upiAccountName: input.upiAccountName?.trim() ?? "",
    upiAccountId: input.upiAccountId?.trim() ?? "",
    upiDisclaimer: input.upiDisclaimer?.trim() ?? "",
    notificationNote: input.notificationNote?.trim() ?? "",
    addressLine1: input.addressLine1?.trim() ?? "",
    addressLine2: input.addressLine2?.trim() ?? "",
    city: input.city?.trim() ?? "",
    state: input.state?.trim() ?? "",
    landmark: input.landmark?.trim() ?? "",
    pinCode: input.pinCode?.trim() ?? "",
    latitude: input.latitude?.trim() ?? "",
    longitude: input.longitude?.trim() ?? "",
    discountsEnabled,
    maxDiscountPercent: discountsEnabled ? maxDiscountPercent : 0,
    maxDiscountAmount: discountsEnabled ? maxDiscountAmount : 0,
    discountGroupId:
      discountGroupId !== null && Number.isInteger(discountGroupId)
        ? discountGroupId
        : null,
    status,
  };
}

export function validateStorePayload(payload: StorePayload) {
  const missingFields = [
    ["Store name", payload.name],
    ["Email", payload.email],
    ["Mobile number", payload.mobile],
    ["Name on invoice", payload.invoiceGenName],
    ["Starting invoice number", payload.invoiceGenNumber],
    ["Address line 1", payload.addressLine1],
    ["State", payload.state],
  ].filter(([, value]) => !value);

  if (missingFields.length > 0) {
    return `${missingFields[0][0]} is required.`;
  }

  if (!/^\d{10}$/.test(payload.mobile)) {
    return "Enter a 10-digit mobile number.";
  }

  if (
    payload.discountsEnabled &&
    (!Number.isFinite(payload.maxDiscountPercent) ||
      payload.maxDiscountPercent <= 0 ||
      payload.maxDiscountPercent > 100)
  ) {
    return "Maximum discount must be between 1% and 100%.";
  }

  if (
    payload.discountsEnabled &&
    (!Number.isFinite(payload.maxDiscountAmount) ||
      payload.maxDiscountAmount <= 0)
  ) {
    return "Enter a maximum discount amount.";
  }

  const durationFields = [
    ["Process time", payload.processTime],
    ["Delivery time", payload.tagDeliveryDateInterval],
  ];

  for (const [label, value] of durationFields) {
    if (value && !/^[1-9]\d* (hours|minutes)$/.test(value)) {
      return `${label} must use a number with hours or minutes.`;
    }
  }

  return null;
}

let storeDiscountSetupPromise: Promise<void> | null = null;

export function ensureStoreDiscountPolicySchema() {
  if (!isSchemaMigration()) return Promise.resolve();

  if (!storeDiscountSetupPromise) {
    storeDiscountSetupPromise = pool
      .query(
        `
      ALTER TABLE stores
        ADD COLUMN IF NOT EXISTS discounts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS max_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
    `,
      )
      .then(() => undefined)
      .catch((error) => {
        storeDiscountSetupPromise = null;
        throw error;
      });
  }
  return storeDiscountSetupPromise;
}

export async function listStores() {
  await ensureStoreDiscountPolicySchema();
  const { rows } = await pool.query<StoreRow>(
    `SELECT ${storeColumns}
     FROM stores
     ORDER BY store_number ASC`,
  );

  return rows.map(mapStore);
}

export async function getStoreById(id: string) {
  await ensureStoreDiscountPolicySchema();
  const { rows } = await pool.query<StoreRow>(
    `SELECT ${storeColumns}
     FROM stores
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return rows[0] ? mapStore(rows[0]) : null;
}

export async function createStore(payload: StorePayload) {
  await ensureStoreDiscountPolicySchema();
  if (payload.discountGroupId !== null) {
    const group = await pool.query(
      "SELECT 1 FROM discount_groups WHERE id=$1 AND is_active=TRUE",
      [payload.discountGroupId],
    );
    if (!group.rows[0]) throw new Error("DISCOUNT_GROUP_NOT_FOUND");
  }
  const { rows } = await pool.query<StoreRow>(
    `INSERT INTO stores (
      name,
      company,
      email,
      mobile,
      process_time,
      tag_delivery_date_interval,
      invoice_gen_name,
      invoice_gen_number,
      upi_account_name,
      upi_account_id,
      upi_disclaimer,
      notification_note,
      address_line1,
      address_line2,
      city,
      state,
      landmark,
      pin_code,
      latitude,
      longitude,
      discounts_enabled,
      max_discount_percent,
      max_discount_amount,
      discount_group_id,
      status
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
    )
    RETURNING ${storeColumns}`,
    [
      payload.name,
      payload.company,
      payload.email,
      payload.mobile,
      payload.processTime,
      payload.tagDeliveryDateInterval,
      payload.invoiceGenName,
      payload.invoiceGenNumber,
      payload.upiAccountName,
      payload.upiAccountId,
      payload.upiDisclaimer,
      payload.notificationNote,
      payload.addressLine1,
      payload.addressLine2,
      payload.city,
      payload.state,
      payload.landmark,
      payload.pinCode,
      payload.latitude,
      payload.longitude,
      payload.discountsEnabled,
      payload.maxDiscountPercent,
      payload.maxDiscountAmount,
      payload.discountGroupId,
      payload.status,
    ],
  );

  return mapStore(rows[0]);
}

export async function updateStore(id: string, payload: StorePayload) {
  await ensureStoreDiscountPolicySchema();
  if (payload.discountGroupId !== null) {
    const group = await pool.query(
      "SELECT 1 FROM discount_groups WHERE id=$1 AND is_active=TRUE",
      [payload.discountGroupId],
    );
    if (!group.rows[0]) throw new Error("DISCOUNT_GROUP_NOT_FOUND");
  }
  const { rows } = await pool.query<StoreRow>(
    `UPDATE stores
     SET
      name = $2,
      company = $3,
      email = $4,
      mobile = $5,
      process_time = $6,
      tag_delivery_date_interval = $7,
      invoice_gen_name = $8,
      invoice_gen_number = $9,
      upi_account_name = $10,
      upi_account_id = $11,
      upi_disclaimer = $12,
      notification_note = $13,
      address_line1 = $14,
      address_line2 = $15,
      city = $16,
      state = $17,
      landmark = $18,
      pin_code = $19,
      latitude = $20,
      longitude = $21,
      discounts_enabled = $22,
      max_discount_percent = $23,
      max_discount_amount = $24,
      discount_group_id = $25,
      status = $26
     WHERE id = $1
     RETURNING ${storeColumns}`,
    [
      id,
      payload.name,
      payload.company,
      payload.email,
      payload.mobile,
      payload.processTime,
      payload.tagDeliveryDateInterval,
      payload.invoiceGenName,
      payload.invoiceGenNumber,
      payload.upiAccountName,
      payload.upiAccountId,
      payload.upiDisclaimer,
      payload.notificationNote,
      payload.addressLine1,
      payload.addressLine2,
      payload.city,
      payload.state,
      payload.landmark,
      payload.pinCode,
      payload.latitude,
      payload.longitude,
      payload.discountsEnabled,
      payload.maxDiscountPercent,
      payload.maxDiscountAmount,
      payload.discountGroupId,
      payload.status,
    ],
  );

  return rows[0] ? mapStore(rows[0]) : null;
}

export async function updateStoreStatus(id: string, status: StoreStatus) {
  await ensureStoreDiscountPolicySchema();
  const { rows } = await pool.query<StoreRow>(
    `UPDATE stores SET status = $2 WHERE id = $1 RETURNING ${storeColumns}`,
    [id, status],
  );
  return rows[0] ? mapStore(rows[0]) : null;
}

export async function getStoreDiscountPolicy(
  id: string,
): Promise<StoreDiscountPolicy | null> {
  await ensureStoreDiscountPolicySchema();
  const { rows } = await pool.query<{
    discounts_enabled: boolean;
    max_discount_percent: string;
    max_discount_amount: string;
  }>(
    `SELECT discounts_enabled, max_discount_percent, max_discount_amount
     FROM stores WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0]
    ? {
        discountsEnabled: rows[0].discounts_enabled,
        maxDiscountPercent: Number(rows[0].max_discount_percent),
        maxDiscountAmount: Number(rows[0].max_discount_amount),
      }
    : null;
}

export async function deleteStore(id: string) {
  const { rowCount } = await pool.query("DELETE FROM stores WHERE id = $1", [
    id,
  ]);

  return (rowCount ?? 0) > 0;
}
