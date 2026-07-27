import { pool } from "@/lib/db";
import { ensureCustomerPortalSchema } from "@/lib/customer-portal";
import { ensureUserLoginSchema } from "@/lib/users";

export type CustomerStatus = "active" | "inactive";
export type CustomerType = "individual" | "business";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

export type Customer = {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp: string;
  customerType: CustomerType;
  houseFlatNo: string;
  streetArea: string;
  landmark: string;
  city: string;
  pincode: string;
  googleMapsPin: string;
  pickupFrequency: string;
  assignedRider: string;
  assignedRoute: string;
  rateCard: string;
  paymentMethod: PaymentMethod;
  creditCustomer: boolean;
  creditLimit: number | null;
  pickupInstructions: string;
  internalNotes: string;
  status: CustomerStatus;
  hasLogin: boolean;
  walletBalance: number;
  createdAt: string;
};

export type CustomerPayload = Omit<
  Customer,
  "id" | "hasLogin" | "walletBalance" | "createdAt"
>;

type CustomerRow = {
  id: string;
  full_name: string;
  mobile: string;
  whatsapp: string;
  customer_type: CustomerType;
  house_flat_no: string;
  street_area: string;
  landmark: string;
  city: string;
  pincode: string;
  google_maps_pin: string;
  pickup_frequency: string;
  assigned_rider: string;
  assigned_route: string;
  rate_card: string;
  payment_method: PaymentMethod;
  credit_customer: boolean;
  credit_limit: string | null;
  pickup_instructions: string;
  internal_notes: string;
  status: CustomerStatus;
  user_id: string | null;
  wallet_balance?: string | null;
  created_at: Date;
};

const customerColumns = `
  id, full_name, mobile, whatsapp, customer_type, house_flat_no, street_area,
  landmark, city, pincode, google_maps_pin, pickup_frequency, assigned_rider,
  assigned_route, rate_card, payment_method, credit_customer, credit_limit,
  pickup_instructions, internal_notes, status, user_id, created_at
`;

let setupPromise: Promise<void> | null = null;

export function ensureCustomerTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await ensureUserLoginSchema();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
        id BIGSERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        mobile VARCHAR(10) NOT NULL,
        whatsapp VARCHAR(10) NOT NULL DEFAULT '',
        customer_type VARCHAR(20) NOT NULL DEFAULT 'individual',
        house_flat_no VARCHAR(100) NOT NULL,
        street_area VARCHAR(200) NOT NULL,
        landmark VARCHAR(150) NOT NULL DEFAULT '',
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(6) NOT NULL,
        google_maps_pin TEXT NOT NULL DEFAULT '',
        pickup_frequency VARCHAR(50) NOT NULL DEFAULT '',
        assigned_rider VARCHAR(150) NOT NULL DEFAULT '',
        assigned_route VARCHAR(150) NOT NULL DEFAULT '',
        rate_card VARCHAR(150) NOT NULL,
        payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
        credit_customer BOOLEAN NOT NULL DEFAULT FALSE,
        credit_limit NUMERIC(12, 2),
        pickup_instructions TEXT NOT NULL DEFAULT '',
        internal_notes TEXT NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customers_mobile_format CHECK (mobile ~ '^[0-9]{10}$'),
        CONSTRAINT customers_whatsapp_format CHECK (whatsapp = '' OR whatsapp ~ '^[0-9]{10}$'),
        CONSTRAINT customers_pincode_format CHECK (pincode ~ '^[0-9]{6}$'),
        CONSTRAINT customers_type_values CHECK (customer_type IN ('individual', 'business')),
        CONSTRAINT customers_payment_values CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer')),
        CONSTRAINT customers_status_values CHECK (status IN ('active', 'inactive')),
        CONSTRAINT customers_credit_limit_positive CHECK (credit_limit IS NULL OR credit_limit >= 0)
        );
        ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS customers_mobile_unique ON customers (mobile);
        CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique
        ON customers (user_id) WHERE user_id IS NOT NULL;
      `);
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeCustomerPayload(input: Record<string, unknown>): CustomerPayload {
  const creditCustomer = input.creditCustomer === true || input.creditCustomer === "yes";
  const rawCreditLimit = typeof input.creditLimit === "number"
    ? input.creditLimit
    : Number(text(input.creditLimit));

  return {
    fullName: text(input.fullName).replace(/\s+/g, " "),
    mobile: text(input.mobile),
    whatsapp: text(input.whatsapp),
    customerType: input.customerType === "business" ? "business" : "individual",
    houseFlatNo: text(input.houseFlatNo),
    streetArea: text(input.streetArea),
    landmark: text(input.landmark),
    city: text(input.city).replace(/\s+/g, " "),
    pincode: text(input.pincode),
    googleMapsPin: text(input.googleMapsPin),
    pickupFrequency: text(input.pickupFrequency),
    assignedRider: text(input.assignedRider),
    assignedRoute: text(input.assignedRoute),
    rateCard: text(input.rateCard),
    paymentMethod: input.paymentMethod === "upi" || input.paymentMethod === "card" ||
        input.paymentMethod === "bank_transfer"
      ? input.paymentMethod
      : "cash",
    creditCustomer,
    creditLimit: creditCustomer && text(input.creditLimit) ? rawCreditLimit : null,
    pickupInstructions: text(input.pickupInstructions),
    internalNotes: text(input.internalNotes),
    status: input.status === "inactive" ? "inactive" : "active",
  };
}

export function validateCustomerPayload(payload: CustomerPayload) {
  const required = [
    ["Full name", payload.fullName],
    ["Mobile number", payload.mobile],
    ["House/Flat no.", payload.houseFlatNo],
    ["Street/Area", payload.streetArea],
    ["City", payload.city],
    ["Pincode", payload.pincode],
  ];
  const missing = required.find(([, value]) => !value);
  if (missing) return `${missing[0]} is required.`;
  if (!/^\d{10}$/.test(payload.mobile)) return "Enter a 10-digit mobile number.";
  if (payload.whatsapp && !/^\d{10}$/.test(payload.whatsapp)) {
    return "Enter a 10-digit WhatsApp number.";
  }
  if (!/^\d{6}$/.test(payload.pincode)) return "Enter a 6-digit pincode.";
  if (payload.fullName.length > 150) return "Full name is too long.";
  if (payload.creditLimit !== null && (!Number.isFinite(payload.creditLimit) || payload.creditLimit < 0)) {
    return "Enter a valid credit limit.";
  }
  const maxLengths: Array<[string, string, number]> = [
    ["House/Flat no.", payload.houseFlatNo, 100],
    ["Street/Area", payload.streetArea, 200],
    ["Landmark", payload.landmark, 150],
    ["City", payload.city, 100],
  ];
  const tooLong = maxLengths.find(([, value, max]) => value.length > max);
  if (tooLong) return `${tooLong[0]} is too long.`;
  return null;
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    mobile: row.mobile,
    whatsapp: row.whatsapp,
    customerType: row.customer_type,
    houseFlatNo: row.house_flat_no,
    streetArea: row.street_area,
    landmark: row.landmark,
    city: row.city,
    pincode: row.pincode,
    googleMapsPin: row.google_maps_pin,
    pickupFrequency: row.pickup_frequency,
    assignedRider: row.assigned_rider,
    assignedRoute: row.assigned_route,
    rateCard: row.rate_card,
    paymentMethod: row.payment_method,
    creditCustomer: row.credit_customer,
    creditLimit: row.credit_limit === null ? null : Number(row.credit_limit),
    pickupInstructions: row.pickup_instructions,
    internalNotes: row.internal_notes,
    status: row.status,
    hasLogin: Boolean(row.user_id),
    walletBalance: Number(row.wallet_balance ?? 0),
    createdAt: row.created_at.toISOString(),
  };
}

export async function listCustomers() {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const { rows } = await pool.query<CustomerRow>(
    `SELECT ${customerColumns},
       COALESCE((
         SELECT wallet.balance
         FROM customer_wallets wallet
         WHERE wallet.user_id = customers.user_id
       ), 0)::text AS wallet_balance
     FROM customers
     ORDER BY created_at DESC`,
  );
  return rows.map(mapCustomer);
}

export async function getCustomerById(id: string) {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const { rows } = await pool.query<CustomerRow>(
    `SELECT ${customerColumns},
       COALESCE((
         SELECT wallet.balance
         FROM customer_wallets wallet
         WHERE wallet.user_id = customers.user_id
       ), 0)::text AS wallet_balance
     FROM customers
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function createCustomer(payload: CustomerPayload, passwordHash: string | null) {
  await ensureCustomerTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let userId: string | null = null;
    if (passwordHash) {
      const userResult = await client.query<{ id: string }>(
        `INSERT INTO app_users (
          email, mobile, password_hash, name, designation, role, status
        ) VALUES ($1, $2, $3, $4, 'Customer', 'customer', $5)
        RETURNING id`,
        [
          `customer.${payload.mobile}@mydhobi.local`,
          payload.mobile,
          passwordHash,
          payload.fullName,
          payload.status === "active" ? "active" : "disabled",
        ],
      );
      userId = userResult.rows[0].id;
    }

    const { rows } = await client.query<CustomerRow>(
      `INSERT INTO customers (
        full_name, mobile, whatsapp, customer_type, house_flat_no, street_area,
        landmark, city, pincode, google_maps_pin, pickup_frequency, assigned_rider,
        assigned_route, rate_card, payment_method, credit_customer, credit_limit,
        pickup_instructions, internal_notes, status, user_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      ) RETURNING ${customerColumns}`,
      [
        payload.fullName, payload.mobile, payload.whatsapp, payload.customerType,
        payload.houseFlatNo, payload.streetArea, payload.landmark, payload.city,
        payload.pincode, payload.googleMapsPin, payload.pickupFrequency,
        payload.assignedRider, payload.assignedRoute, payload.rateCard,
        payload.paymentMethod, payload.creditCustomer, payload.creditLimit,
        payload.pickupInstructions, payload.internalNotes, payload.status, userId,
      ],
    );
    await client.query("COMMIT");
    return mapCustomer(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateCustomer(
  id: string,
  payload: CustomerPayload,
  passwordHash: string | null,
) {
  await ensureCustomerTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ user_id: string | null }>(
      "SELECT user_id FROM customers WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    let userId = existing.rows[0].user_id;
    const loginStatus = payload.status === "active" ? "active" : "disabled";
    if (!userId && passwordHash) {
      const userResult = await client.query<{ id: string }>(
        `INSERT INTO app_users (
          email, mobile, password_hash, name, designation, role, status
        ) VALUES ($1, $2, $3, $4, 'Customer', 'customer', $5)
        RETURNING id`,
        [
          `customer.${payload.mobile}@mydhobi.local`,
          payload.mobile,
          passwordHash,
          payload.fullName,
          loginStatus,
        ],
      );
      userId = userResult.rows[0].id;
    } else if (userId) {
      if (passwordHash) {
        await client.query(
          `UPDATE app_users SET
            mobile = $2, name = $3, status = $4, password_hash = $5
           WHERE id = $1`,
          [userId, payload.mobile, payload.fullName, loginStatus, passwordHash],
        );
      } else {
        await client.query(
          "UPDATE app_users SET mobile = $2, name = $3, status = $4 WHERE id = $1",
          [userId, payload.mobile, payload.fullName, loginStatus],
        );
      }
    }

    await client.query(
      `UPDATE customers SET
        full_name = $2, mobile = $3, whatsapp = $4, customer_type = $5,
        house_flat_no = $6, street_area = $7, landmark = $8, city = $9,
        pincode = $10, google_maps_pin = $11, pickup_frequency = $12,
        assigned_rider = $13, assigned_route = $14, rate_card = $15,
        payment_method = $16, credit_customer = $17, credit_limit = $18,
        pickup_instructions = $19, internal_notes = $20, status = $21,
        user_id = $22, updated_at = NOW()
       WHERE id = $1`,
      [
        id, payload.fullName, payload.mobile, payload.whatsapp,
        payload.customerType, payload.houseFlatNo, payload.streetArea,
        payload.landmark, payload.city, payload.pincode, payload.googleMapsPin,
        payload.pickupFrequency, payload.assignedRider, payload.assignedRoute,
        payload.rateCard, payload.paymentMethod, payload.creditCustomer,
        payload.creditLimit, payload.pickupInstructions, payload.internalNotes,
        payload.status, userId,
      ],
    );
    await client.query("COMMIT");
    return getCustomerById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateCustomerStatus(id: string, status: CustomerStatus) {
  await ensureCustomerTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<CustomerRow>(
      `UPDATE customers SET status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING ${customerColumns}`,
      [id, status],
    );
    if (rows[0]?.user_id) {
      await client.query("UPDATE app_users SET status = $2 WHERE id = $1", [
        rows[0].user_id,
        status === "active" ? "active" : "disabled",
      ]);
    }
    await client.query("COMMIT");
    return rows[0] ? getCustomerById(id) : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCustomer(id: string) {
  await ensureCustomerTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ user_id: string | null }>(
      "DELETE FROM customers WHERE id = $1 RETURNING user_id",
      [id],
    );
    const userId = result.rows[0]?.user_id;
    if (userId) await client.query("DELETE FROM app_users WHERE id = $1", [userId]);
    await client.query("COMMIT");
    return Boolean(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
