import { pool } from "@/lib/db";

export type StoreStatus = "active" | "draft" | "inactive";

export type Store = {
  id: string;
  storeNumber: number;
  storeCode: string;
  name: string;
  company: string;
  email: string;
  mobile: string;
  processTime: string;
  tagDeliveryDateInterval: string;
  invoiceGenName: string;
  invoiceGenNumber: string;
  upiAccountName: string;
  upiAccountId: string;
  upiDisclaimer: string;
  notificationNote: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  landmark: string;
  pinCode: string;
  latitude: string;
  longitude: string;
  status: StoreStatus;
  createdAt: string;
  updatedAt: string;
};

export type StorePayload = {
  name: string;
  company: string;
  email: string;
  mobile: string;
  processTime: string;
  tagDeliveryDateInterval: string;
  invoiceGenName: string;
  invoiceGenNumber: string;
  upiAccountName: string;
  upiAccountId: string;
  upiDisclaimer: string;
  notificationNote: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  landmark: string;
  pinCode: string;
  latitude: string;
  longitude: string;
  status: StoreStatus;
};

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
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function normalizeStorePayload(input: Partial<StorePayload>): StorePayload {
  const status = input.status === "draft" || input.status === "inactive"
    ? input.status
    : "active";

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
    status,
  };
}

export function validateStorePayload(payload: StorePayload) {
  const missingFields = [
    ["Store name", payload.name],
    ["Email", payload.email],
    ["Mobile number", payload.mobile],
    ["Invoice generation name", payload.invoiceGenName],
    ["Invoice generation number", payload.invoiceGenNumber],
    ["Address line 1", payload.addressLine1],
    ["State", payload.state],
  ].filter(([, value]) => !value);

  if (missingFields.length > 0) {
    return `${missingFields[0][0]} is required.`;
  }

  return null;
}

export async function listStores() {
  const { rows } = await pool.query<StoreRow>(
    `SELECT ${storeColumns}
     FROM stores
     ORDER BY store_number ASC`,
  );

  return rows.map(mapStore);
}

export async function getStoreById(id: string) {
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
      status
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21
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
      payload.status,
    ],
  );

  return mapStore(rows[0]);
}

export async function updateStore(id: string, payload: StorePayload) {
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
      status = $22
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
      payload.status,
    ],
  );

  return rows[0] ? mapStore(rows[0]) : null;
}

export async function deleteStore(id: string) {
  const { rowCount } = await pool.query("DELETE FROM stores WHERE id = $1", [id]);

  return (rowCount ?? 0) > 0;
}
