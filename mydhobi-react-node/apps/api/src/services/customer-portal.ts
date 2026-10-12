import type {
  PortalAddress,
  PortalOrder,
  PortalOrderEvent,
  PortalOrderItem,
} from "@mydhobi/domain/customer-portal";
import { randomUUID } from "crypto";
import { isSchemaMigration } from "../database/schema-mode";
export type {
  PortalAddress,
  PortalOrder,
  PortalOrderEvent,
  PortalOrderItem,
} from "@mydhobi/domain/customer-portal";

import { pool } from "@/lib/db";
import {
  getCustomerItemPrice,
  listCustomerItemCatalog,
} from "@/lib/item-master";
import { redeemOffer, validateOffer } from "@/lib/offers";
import { orderStatuses, type PortalOrderStatus } from "@/lib/order-lifecycle";
import {
  applyReferralDiscount,
  getPendingReferralDiscount,
} from "@/lib/referrals";
import {
  consumeSubscriptionPickup,
  lockActiveSubscription,
} from "@/lib/subscriptions";

export { orderStatuses };
export type { PortalOrderStatus };

export async function resolveCustomerStoreId(userId: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query<{ store_id: string }>(
    `SELECT COALESCE(
       (
         SELECT customers.store_id
         FROM customers
         INNER JOIN stores ON stores.id=customers.store_id AND stores.status='active'
         WHERE customers.user_id=$1
         LIMIT 1
       ),
       (
         SELECT orders.store_id
         FROM customer_orders orders
         INNER JOIN stores ON stores.id=orders.store_id AND stores.status='active'
         WHERE orders.user_id=$1 AND orders.store_id IS NOT NULL
         ORDER BY orders.created_at DESC
         LIMIT 1
       ),
       (
         SELECT stores.id FROM stores
         WHERE stores.status='active'
         ORDER BY stores.store_number ASC
         LIMIT 1
       )
     ) AS store_id`,
    [userId],
  );
  return rows[0]?.store_id ?? null;
}

let setupPromise: Promise<void> | null = null;

export function ensureCustomerPortalSchema() {
  if (!isSchemaMigration()) return Promise.resolve();

  if (!setupPromise) {
    setupPromise = pool
      .query(
        `
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        address_type VARCHAR(20) NOT NULL,
        full_address VARCHAR(300) NOT NULL,
        landmark VARCHAR(150) NOT NULL DEFAULT '',
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(6) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_addresses_pincode CHECK (pincode ~ '^[0-9]{6}$')
      );
      CREATE INDEX IF NOT EXISTS customer_addresses_user_idx ON customer_addresses(user_id);

      CREATE TABLE IF NOT EXISTS customer_orders (
        id VARCHAR(20) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        store_id UUID,
        status VARCHAR(30) NOT NULL DEFAULT 'New',
        service VARCHAR(80) NOT NULL,
        item_count NUMERIC(12,3) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        pickup_at TIMESTAMPTZ NOT NULL,
        delivery_at TIMESTAMPTZ,
        payment_method VARCHAR(30) NOT NULL,
        payment_status VARCHAR(20) NOT NULL,
        address_text VARCHAR(500) NOT NULL,
        instructions VARCHAR(120) NOT NULL DEFAULT '',
        coupon_code VARCHAR(30),
        discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        idempotency_key VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_orders_items_positive CHECK (item_count > 0),
        CONSTRAINT customer_orders_amount_positive CHECK (amount >= 0)
      );
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(30);
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS store_id UUID;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
      UPDATE customer_orders
      SET store_id = (SELECT id FROM stores WHERE status='active' ORDER BY store_number ASC LIMIT 1)
      WHERE store_id IS NULL;
      CREATE INDEX IF NOT EXISTS customer_orders_store_idx
      ON customer_orders(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS customer_orders_user_idx
      ON customer_orders(user_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS customer_orders_user_idempotency_unique
      ON customer_orders(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE customer_orders ALTER COLUMN status SET DEFAULT 'New';
      UPDATE customer_orders SET status = 'New' WHERE status = 'In Progress';

      CREATE TABLE IF NOT EXISTS customer_order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        quantity NUMERIC(10,3) NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        garment_id BIGINT,
        garment_name VARCHAR(100),
        service_id BIGINT,
        service_name VARCHAR(100),
        alias VARCHAR(120) NOT NULL DEFAULT '',
        packing_type VARCHAR(40) NOT NULL DEFAULT '',
        brand VARCHAR(80) NOT NULL DEFAULT '',
        fabric VARCHAR(40) NOT NULL DEFAULT '',
        defect VARCHAR(80) NOT NULL DEFAULT '',
        color VARCHAR(40) NOT NULL DEFAULT '',
        remark VARCHAR(160) NOT NULL DEFAULT '',
        CONSTRAINT customer_order_items_quantity_positive CHECK (quantity > 0),
        CONSTRAINT customer_order_items_price_positive CHECK (unit_price >= 0)
      );
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS garment_id BIGINT;
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS garment_name VARCHAR(100);
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS service_id BIGINT;
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS service_name VARCHAR(100);
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS alias VARCHAR(120) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS packing_type VARCHAR(40) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS brand VARCHAR(80) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS fabric VARCHAR(40) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS defect VARCHAR(80) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS color VARCHAR(40) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS remark VARCHAR(160) NOT NULL DEFAULT '';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS base_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) NOT NULL DEFAULT 'None';
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
      UPDATE customer_order_items SET base_unit_price=unit_price WHERE base_unit_price=0 AND unit_price>0;
      ALTER TABLE customer_orders ALTER COLUMN item_count TYPE NUMERIC(12,3) USING item_count::numeric;
      ALTER TABLE customer_order_items ALTER COLUMN quantity TYPE NUMERIC(10,3) USING quantity::numeric;

      CREATE TABLE IF NOT EXISTS customer_order_status_history (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        status VARCHAR(30) NOT NULL,
        note VARCHAR(180) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS customer_order_status_history_order_idx
      ON customer_order_status_history(order_id, created_at);
      INSERT INTO customer_order_status_history (order_id,status,note,created_at)
      SELECT orders.id,orders.status,'Order placed',orders.created_at
      FROM customer_orders orders
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_order_status_history history
        WHERE history.order_id=orders.id
      );

      CREATE TABLE IF NOT EXISTS customer_wallets (
        user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_wallet_balance_nonnegative CHECK (balance >= 0)
      );
      CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        label VARCHAR(150) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE customer_wallet_transactions
      ADD COLUMN IF NOT EXISTS note VARCHAR(200) NOT NULL DEFAULT '';
      ALTER TABLE customer_wallet_transactions
      ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'customer';
      ALTER TABLE customer_wallet_transactions
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES app_users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS customer_wallet_transactions_user_idx
      ON customer_wallet_transactions(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS customer_payments (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        order_id VARCHAR(20) REFERENCES customer_orders(id) ON DELETE SET NULL,
        kind VARCHAR(30) NOT NULL,
        method VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        reference VARCHAR(80) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_payments_amount_positive CHECK (amount >= 0)
      );
      CREATE INDEX IF NOT EXISTS customer_payments_user_idx
      ON customer_payments(user_id,created_at DESC);
      CREATE INDEX IF NOT EXISTS customer_payments_order_idx
      ON customer_payments(order_id);

      CREATE TABLE IF NOT EXISTS riders (
        id BIGSERIAL PRIMARY KEY,
        store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(10) NOT NULL UNIQUE,
        area VARCHAR(100) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT riders_mobile_format CHECK (mobile ~ '^[0-9]{10}$')
      );
      CREATE TABLE IF NOT EXISTS order_pickups (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL UNIQUE REFERENCES customer_orders(id) ON DELETE CASCADE,
        rider_id BIGINT REFERENCES riders(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
        notes VARCHAR(180) NOT NULL DEFAULT '',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS order_deliveries (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL UNIQUE REFERENCES customer_orders(id) ON DELETE CASCADE,
        rider_id BIGINT REFERENCES riders(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Ready',
        notes VARCHAR(180) NOT NULL DEFAULT '',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customer_complaints (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        store_id UUID,
        subject VARCHAR(150) NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'Open',
        response TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE customer_complaints
      ADD COLUMN IF NOT EXISTS response TEXT NOT NULL DEFAULT '';
      ALTER TABLE customer_complaints
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE customer_complaints
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
      ALTER TABLE customer_complaints ADD COLUMN IF NOT EXISTS store_id UUID;
      UPDATE customer_complaints complaints
      SET store_id = (
        SELECT orders.store_id
        FROM customer_orders orders
        WHERE orders.user_id=complaints.user_id AND orders.store_id IS NOT NULL
        ORDER BY orders.created_at DESC LIMIT 1
      )
      WHERE complaints.store_id IS NULL
        AND EXISTS (
          SELECT 1 FROM customer_orders orders
          WHERE orders.user_id=complaints.user_id AND orders.store_id IS NOT NULL
        );
      CREATE INDEX IF NOT EXISTS customer_complaints_user_idx
      ON customer_complaints(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS customer_notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        title VARCHAR(120) NOT NULL,
        message VARCHAR(300) NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS customer_notifications_user_idx
      ON customer_notifications(user_id, created_at DESC);
    `,
      )
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

function mapAddress(row: Record<string, unknown>): PortalAddress {
  return {
    id: String(row.id),
    name: String(row.contact_name ?? ""),
    phone: String(row.contact_phone ?? ""),
    ...(row.store_id ? { storeId: String(row.store_id) } : {}),
    ...(row.pickup_address_id ? { addressId: String(row.pickup_address_id) } : {}),
    type: String(row.address_type),
    fullAddress: String(row.full_address),
    landmark: String(row.landmark),
    city: String(row.city),
    pincode: String(row.pincode),
    isDefault: Boolean(row.is_default),
  };
}

export async function listPortalAddresses(userId: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT addresses.id,COALESCE(NULLIF(addresses.contact_name,''),users.name) AS contact_name,
       COALESCE(NULLIF(addresses.contact_phone,''),users.mobile,'') AS contact_phone,
       addresses.address_type,addresses.full_address,addresses.landmark,addresses.city,addresses.pincode,addresses.is_default
     FROM customer_addresses addresses INNER JOIN app_users users ON users.id=addresses.user_id
     WHERE addresses.user_id = $1
     ORDER BY addresses.is_default DESC, addresses.created_at ASC`,
    [userId],
  );
  return rows.map(mapAddress);
}

export async function getPortalAddress(userId: string, id: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT addresses.id,COALESCE(NULLIF(addresses.contact_name,''),users.name) AS contact_name,
       COALESCE(NULLIF(addresses.contact_phone,''),users.mobile,'') AS contact_phone,
       addresses.address_type,addresses.full_address,addresses.landmark,addresses.city,addresses.pincode,addresses.is_default
     FROM customer_addresses addresses INNER JOIN app_users users ON users.id=addresses.user_id
     WHERE addresses.user_id=$1 AND addresses.id=$2 LIMIT 1`,
    [userId, id],
  );
  return rows[0] ? mapAddress(rows[0]) : null;
}

export async function createPortalAddress(
  userId: string,
  input: Omit<PortalAddress, "id">,
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (input.isDefault) {
      await client.query(
        "UPDATE customer_addresses SET is_default = FALSE WHERE user_id = $1",
        [userId],
      );
    }
    const { rows } = await client.query(
      `INSERT INTO customer_addresses
       (user_id, contact_name, contact_phone, address_type, full_address, landmark, city, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, contact_name, contact_phone, address_type, full_address, landmark, city, pincode, is_default`,
      [
        userId,
        input.name,
        input.phone,
        input.type,
        input.fullAddress,
        input.landmark,
        input.city,
        input.pincode,
        input.isDefault,
      ],
    );
    await client.query("COMMIT");
    return mapAddress(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePortalAddress(
  userId: string,
  id: string,
  input: Omit<PortalAddress, "id">,
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (input.isDefault) {
      await client.query(
        "UPDATE customer_addresses SET is_default=FALSE WHERE user_id=$1",
        [userId],
      );
    }
    const { rows } = await client.query(
      `UPDATE customer_addresses SET
       contact_name=$3,contact_phone=$4,address_type=$5,full_address=$6,landmark=$7,city=$8,pincode=$9,
       is_default=$10
       WHERE id=$2 AND user_id=$1
       RETURNING id,contact_name,contact_phone,address_type,full_address,landmark,city,pincode,is_default`,
      [
        userId,
        id,
        input.name,
        input.phone,
        input.type,
        input.fullAddress,
        input.landmark,
        input.city,
        input.pincode,
        input.isDefault,
      ],
    );
    await client.query("COMMIT");
    return rows[0] ? mapAddress(rows[0]) : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePortalAddress(userId: string, id: string) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM customer_addresses WHERE id=$2 AND user_id=$1 RETURNING is_default",
      [userId, id],
    );
    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return false;
    }
    if (result.rows[0].is_default) {
      await client.query(
        `UPDATE customer_addresses SET is_default=TRUE
         WHERE id=(SELECT id FROM customer_addresses WHERE user_id=$1 ORDER BY created_at LIMIT 1)`,
        [userId],
      );
    }
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function mapOrder(
  row: Record<string, unknown>,
  items: PortalOrderItem[],
  timeline: PortalOrderEvent[],
): PortalOrder {
  const bookingKind = String(row.booking_kind ?? "items");
  const storedStatus = orderStatuses.includes(row.status as PortalOrderStatus)
    ? (row.status as PortalOrderStatus)
    : "New";
  const status = bookingKind === "quick" && storedStatus === "New"
    ? "Pickup Scheduled"
    : storedStatus;
  return {
    id: String(row.id),
    status,
    service: String(row.service),
    itemCount: Number(row.item_count),
    amount: Number(row.amount),
    subtotal: Number(row.amount) + Number(row.discount_amount ?? 0),
    bookingKind,
    requestedServices: row.requested_services as Array<{
      id: string;
      name: string;
    }>,
    pickupSlot: String(row.pickup_slot ?? ""),
    deliveryOption: String(row.delivery_option ?? "standard"),
    invoicePending: Boolean(row.invoice_pending),
    discountAmount: Number(row.discount_amount ?? 0),
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    pickupAt: new Date(String(row.pickup_at)).toISOString(),
    deliveryAt: row.delivery_at
      ? new Date(String(row.delivery_at)).toISOString()
      : null,
    paymentMethod: String(row.payment_method),
    paymentStatus: String(row.payment_status),
    address: String(row.address_text),
    instructions: String(row.instructions),
    createdAt: new Date(String(row.created_at)).toISOString(),
    items,
    timeline,
  };
}

async function orderItems(orderIds: string[]) {
  if (!orderIds.length) return new Map<string, PortalOrderItem[]>();
  const { rows } = await pool.query(
    `SELECT order_id, item_name, quantity, unit_price, base_unit_price,
       discount_type, discount_value, discount_amount, garment_id, garment_name,
       service_id, service_name, alias, packing_type, brand, fabric, defect,
       color, remark
     FROM customer_order_items WHERE order_id = ANY($1::varchar[]) ORDER BY id`,
    [orderIds],
  );
  const grouped = new Map<string, PortalOrderItem[]>();
  for (const row of rows) {
    const id = String(row.order_id);
    grouped.set(id, [
      ...(grouped.get(id) ?? []),
      {
        name: String(row.item_name),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price),
        baseUnitPrice: Number(row.base_unit_price ?? row.unit_price),
        discountType: row.discount_type ? String(row.discount_type) : null,
        discountValue: Number(row.discount_value ?? 0),
        discountAmount: Number(row.discount_amount ?? 0),
        ...(row.garment_id === null
          ? {}
          : { garmentId: String(row.garment_id) }),
        ...(row.garment_name ? { garmentName: String(row.garment_name) } : {}),
        ...(row.service_id === null
          ? {}
          : { serviceId: String(row.service_id) }),
        ...(row.service_name ? { serviceName: String(row.service_name) } : {}),
        ...(row.alias ? { alias: String(row.alias) } : {}),
        ...(row.packing_type ? { packingType: String(row.packing_type) } : {}),
        ...(row.brand ? { brand: String(row.brand) } : {}),
        ...(row.fabric ? { fabric: String(row.fabric) } : {}),
        ...(row.defect ? { defect: String(row.defect) } : {}),
        ...(row.color ? { color: String(row.color) } : {}),
        ...(row.remark ? { remark: String(row.remark) } : {}),
      },
    ]);
  }
  return grouped;
}

async function orderEvents(orderIds: string[]) {
  if (!orderIds.length) return new Map<string, PortalOrderEvent[]>();
  const { rows } = await pool.query(
    `SELECT order_id,status,note,created_at
     FROM customer_order_status_history
     WHERE order_id = ANY($1::varchar[])
     ORDER BY created_at,id`,
    [orderIds],
  );
  const grouped = new Map<string, PortalOrderEvent[]>();
  for (const row of rows) {
    const id = String(row.order_id);
    const status = orderStatuses.includes(row.status as PortalOrderStatus)
      ? (row.status as PortalOrderStatus)
      : "New";
    grouped.set(id, [
      ...(grouped.get(id) ?? []),
      {
        status,
        note: String(row.note),
        createdAt: new Date(String(row.created_at)).toISOString(),
      },
    ]);
  }
  return grouped;
}

export async function listPortalOrders(userId: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    "SELECT * FROM customer_orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  const ids = rows.map((row) => String(row.id));
  const [items, events] = await Promise.all([
    orderItems(ids),
    orderEvents(ids),
  ]);
  return rows.map((row) =>
    mapOrder(
      row,
      items.get(String(row.id)) ?? [],
      events.get(String(row.id)) ?? [],
    ),
  );
}

export async function getPortalOrder(userId: string, id: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    "SELECT * FROM customer_orders WHERE user_id = $1 AND id = $2 LIMIT 1",
    [userId, id],
  );
  if (!rows[0]) return null;
  const [items, events] = await Promise.all([
    orderItems([id]),
    orderEvents([id]),
  ]);
  return mapOrder(rows[0], items.get(id) ?? [], events.get(id) ?? []);
}

export async function confirmPortalOrder(
  userId: string,
  id: string,
  paymentMethod: "cash" | "wallet",
) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ amount: string; status: string }>(
      `SELECT amount,status FROM customer_orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, userId],
    );
    const current = result.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    if (current.status !== "Awaiting Confirmation") {
      await client.query("ROLLBACK");
      return { kind: "not_ready" as const };
    }
    const amount = Number(current.amount);
    if (paymentMethod === "wallet") {
      const wallet = await client.query<{ balance: string }>(
        "SELECT balance FROM customer_wallets WHERE user_id=$1 FOR UPDATE",
        [userId],
      );
      if (!wallet.rows[0] || Number(wallet.rows[0].balance) < amount) {
        await client.query("ROLLBACK");
        return { kind: "insufficient_wallet" as const };
      }
      await client.query("UPDATE customer_wallets SET balance=balance-$2,updated_at=NOW() WHERE user_id=$1", [userId, amount]);
      await client.query("INSERT INTO customer_wallet_transactions(user_id,label,amount) VALUES($1,$2,$3)", [userId, `Order #${id}`, -amount]);
      await client.query("UPDATE customer_orders SET payment_method='wallet',payment_status='Paid' WHERE id=$1", [id]);
      await client.query("UPDATE customer_payments SET method='wallet',status='Paid',amount=$2,updated_at=NOW() WHERE order_id=$1 AND kind='Order'", [id, amount]);
    } else {
      await client.query("UPDATE customer_orders SET payment_method='cash',payment_status='Pending' WHERE id=$1", [id]);
      await client.query("UPDATE customer_payments SET method='cash',status='Pending',amount=$2,updated_at=NOW() WHERE order_id=$1 AND kind='Order'", [id, amount]);
    }
    await client.query("UPDATE customer_orders SET status='Confirmed',updated_at=NOW() WHERE id=$1", [id]);
    await client.query("INSERT INTO customer_order_status_history(order_id,status,note) VALUES($1,'Confirmed','Customer confirmed final order')", [id]);
    await client.query("INSERT INTO customer_notifications(user_id,title,message) VALUES($1,'Order Confirmed',$2)", [userId, `Order #${id} is confirmed and ready for cleaning.`]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { kind: "confirmed" as const, order: await getPortalOrder(userId, id) };
}

export async function createPortalOrder(
  userId: string,
  input: {
    service: string;
    pickupAt: string;
    paymentMethod: string;
    address: string;
    instructions: string;
    idempotencyKey: string;
    couponCode?: string;
    items: PortalOrderItem[];
    bookingKind?: "items" | "quick";
    serviceIds?: string[];
    quickItemCount?: number;
    pickupSlot?: string;
    deliveryOption?: string;
    storeId?: string;
    addressId?: string;
  },
) {
  await ensureCustomerPortalSchema();
  const storeId = await resolveCustomerStoreId(userId);
  if (!storeId) throw new Error("STORE_NOT_AVAILABLE");
  if (input.storeId && input.storeId !== storeId)
    throw new Error("STORE_NOT_AVAILABLE");
  const quick = input.bookingKind === "quick";
  const requestedServices: Array<{ id: string; name: string }> = [];
  if (quick) {
    const catalog = await listCustomerItemCatalog(storeId);
    for (const id of input.serviceIds ?? []) {
      const service = catalog.services.find((item) => item.id === id);
      if (!service) throw new Error("ITEM_SERVICE_PRICE_NOT_FOUND");
      requestedServices.push({ id, name: service.name });
    }
    if (
      input.items.length ||
      input.paymentMethod !== "cash" ||
      input.couponCode
    )
      throw new Error("ITEM_SERVICE_PRICE_NOT_FOUND");
  }
  const pricedItems = await Promise.all(
    input.items.map(async (item) => {
      const garmentId = Number(item.garmentId);
      const serviceId = Number(item.serviceId);
      if (
        !item.garmentId ||
        !item.serviceId ||
        !Number.isInteger(garmentId) ||
        !Number.isInteger(serviceId)
      ) {
        throw new Error("ITEM_SERVICE_PRICE_NOT_FOUND");
      }
      const pricing = await getCustomerItemPrice(garmentId, serviceId, storeId);
      if (!pricing) throw new Error("ITEM_SERVICE_PRICE_NOT_FOUND");
      return {
        ...item,
        name: `${pricing.garmentName} · ${pricing.serviceName}`,
        garmentName: pricing.garmentName,
        serviceName: pricing.serviceName,
        unitPrice: pricing.price,
      };
    }),
  );
  const itemCount = quick
    ? Math.max(0, Math.trunc(input.quickItemCount ?? 0))
    : pricedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = pricedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const coupon = input.couponCode
    ? await validateOffer(input.couponCode, subtotal, storeId)
    : null;
  if (coupon && !coupon.valid) throw new Error("INVALID_COUPON");
  const referral = quick ? null : await getPendingReferralDiscount(userId);
  const referralDiscount = referral
    ? Math.round(subtotal * (referral.percent / 100) * 100) / 100
    : 0;
  const couponDiscount = coupon?.valid ? coupon.discount : 0;
  const useReferral = referralDiscount >= couponDiscount && referral !== null;
  const id = `ORD${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const paymentStatus = quick
    ? "Unpaid"
    : input.paymentMethod === "wallet"
      ? "Paid"
      : "Pending";
  const serviceNames = [
    ...new Set(pricedItems.map((item) => item.serviceName)),
  ];
  const orderService = quick
    ? requestedServices.length
      ? requestedServices
        .map((item) => item.name)
        .join(", ")
        .slice(0, 80)
      : "Pickup request"
    : serviceNames.length === 1
      ? String(serviceNames[0])
      : "Multiple Services";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `${userId}:${input.idempotencyKey}`,
    ]);
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM customer_orders
       WHERE user_id=$1 AND idempotency_key=$2 LIMIT 1`,
      [userId, input.idempotencyKey],
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return getPortalOrder(userId, existing.rows[0].id);
    }
    const subscription = await lockActiveSubscription(client, userId);
    const subscriptionDiscount =
      !quick && subscription
        ? Math.round(subtotal * (subscription.discountPercent / 100) * 100) /
          100
        : 0;
    const offerDiscount = useReferral ? referralDiscount : couponDiscount;
    const useSubscription =
      subscription !== null && subscriptionDiscount >= offerDiscount;
    const redeemedCoupon =
      !useReferral && !useSubscription && input.couponCode
        ? await redeemOffer(client, input.couponCode, subtotal, storeId)
        : null;
    if (redeemedCoupon && !redeemedCoupon.valid)
      throw new Error("INVALID_COUPON");
    const redeemedOfferDiscount = useReferral
      ? referralDiscount
      : redeemedCoupon?.valid
        ? redeemedCoupon.discount
        : 0;
    const discount = Math.max(redeemedOfferDiscount, subscriptionDiscount);
    const amount = subtotal - discount;
    if (input.paymentMethod === "wallet") {
      const wallet = await client.query(
        "SELECT balance FROM customer_wallets WHERE user_id = $1 FOR UPDATE",
        [userId],
      );
      if (!wallet.rows[0] || Number(wallet.rows[0].balance) < amount) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }
      await client.query(
        "UPDATE customer_wallets SET balance = balance - $2, updated_at = NOW() WHERE user_id = $1",
        [userId, amount],
      );
      await client.query(
        "INSERT INTO customer_wallet_transactions (user_id, label, amount) VALUES ($1,$2,$3)",
        [userId, `Order #${id}`, -amount],
      );
    }
    const { rows } = await client.query(
      `INSERT INTO customer_orders
       (id,user_id,store_id,pickup_address_id,status,service,item_count,amount,pickup_at,payment_method,payment_status,address_text,instructions,coupon_code,discount_amount,idempotency_key)
       VALUES ($1,$2,$3,$4,'New',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        id,
        userId,
        storeId,
        input.addressId ?? null,
        orderService,
        itemCount,
        amount,
        input.pickupAt,
        input.paymentMethod,
        paymentStatus,
        input.address,
        input.instructions,
        redeemedCoupon?.valid
          ? redeemedCoupon.offer.code
          : useReferral
            ? "REFERRAL20"
            : useSubscription
              ? `SUB-${subscription.planCode}`
              : null,
        discount,
        input.idempotencyKey,
      ],
    );
    await client.query(
      `UPDATE customer_orders SET booking_kind=$2, requested_services=$3::jsonb,
      pickup_slot=$4, delivery_option=$5, invoice_pending=$6 WHERE id=$1`,
      [
        id,
        quick ? "quick" : "items",
        JSON.stringify(requestedServices),
        input.pickupSlot ?? "",
        input.deliveryOption ?? "standard",
        quick,
      ],
    );
    if (storeId) {
      await client.query(
        "UPDATE customers SET store_id=$2, updated_at=NOW() WHERE user_id=$1",
        [userId, storeId],
      );
    }
    if (useReferral && referral) {
      await applyReferralDiscount(client, referral.referralId, id);
    }
    if (subscription) await consumeSubscriptionPickup(client, subscription.id);
    for (const item of pricedItems) {
      await client.query(
        `INSERT INTO customer_order_items
         (order_id,item_name,quantity,unit_price,base_unit_price,discount_type,discount_value,discount_amount,garment_id,garment_name,service_id,service_name,alias,packing_type,brand,fabric,defect,color,remark)
         VALUES ($1,$2,$3,$4,$5,'None',0,0,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          id,
          item.name,
          item.quantity,
          item.unitPrice,
          item.unitPrice,
          item.garmentId ?? null,
          item.garmentName ?? null,
          item.serviceId ?? null,
          item.serviceName ?? null,
          item.alias ?? "",
          item.packingType ?? "",
          item.brand ?? "",
          item.fabric ?? "",
          item.defect ?? "",
          item.color ?? "",
          item.remark ?? "",
        ],
      );
    }
    if (!quick) {
      await client.query(
        `INSERT INTO customer_payments
         (user_id,order_id,kind,method,status,amount,reference)
         VALUES ($1,$2,'Order',$3,$4,$5,$6)`,
        [userId, id, input.paymentMethod, paymentStatus, amount, `ORDER-${id}`],
      );
    }
    await client.query(
      `INSERT INTO order_pickups (order_id,scheduled_at,status,notes)
       VALUES ($1,$2,'Scheduled',$3)`,
      [id, input.pickupAt, input.instructions],
    );
    await client.query(
      `INSERT INTO customer_order_status_history (order_id,status,note)
       VALUES ($1,'New','Order placed')`,
      [id],
    );
    await client.query(
      `INSERT INTO customer_notifications (user_id,title,message)
       VALUES ($1,$2,$3)`,
      [
        userId,
        quick ? "Pickup Scheduled" : "Order Confirmed",
        quick
          ? `Your pickup #${id} has been scheduled.`
          : `Your order #${id} has been confirmed.`,
      ],
    );
    await client.query("COMMIT");
    return mapOrder(
      {
        ...rows[0],
        booking_kind: quick ? "quick" : "items",
        requested_services: requestedServices,
        pickup_slot: input.pickupSlot,
        delivery_option: input.deliveryOption,
        invoice_pending: quick,
      },
      pricedItems,
      [
        {
          status: "New",
          note: "Order placed",
          createdAt: new Date().toISOString(),
        },
      ],
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPortalWallet(userId: string) {
  await ensureCustomerPortalSchema();
  await pool.query(
    "INSERT INTO customer_wallets (user_id,balance) VALUES ($1,0) ON CONFLICT (user_id) DO NOTHING",
    [userId],
  );
  const wallet = await pool.query(
    "SELECT balance FROM customer_wallets WHERE user_id = $1",
    [userId],
  );
  const transactions = await pool.query(
    `SELECT id,label,amount,created_at FROM customer_wallet_transactions
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  return {
    balance: Number(wallet.rows[0].balance),
    transactions: transactions.rows.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      amount: Number(row.amount),
      createdAt: new Date(row.created_at).toISOString(),
    })),
  };
}

export async function addPortalMoney(userId: string, amount: number) {
  await ensureCustomerPortalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO customer_wallets (user_id,balance) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET balance = customer_wallets.balance + EXCLUDED.balance, updated_at = NOW()`,
      [userId, amount],
    );
    const transaction = await client.query(
      `INSERT INTO customer_wallet_transactions (user_id,label,amount)
       VALUES ($1,'Added Money',$2) RETURNING id`,
      [userId, amount],
    );
    await client.query(
      `INSERT INTO customer_payments
       (user_id,kind,method,status,amount,reference)
       VALUES ($1,'Wallet Top-up','upi','Paid',$2,$3)`,
      [userId, amount, `WALLET-${transaction.rows[0].id}`],
    );
    await client.query("COMMIT");
    return getPortalWallet(userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPortalComplaints(userId: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT id,subject,details,response,status,created_at,updated_at,resolved_at
     FROM customer_complaints WHERE user_id=$1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    reference: `COMP${String(row.id).padStart(4, "0")}`,
    subject: String(row.subject),
    details: String(row.details),
    response: String(row.response),
    status: String(row.status),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    resolvedAt: row.resolved_at
      ? new Date(row.resolved_at).toISOString()
      : null,
  }));
}

export async function createPortalComplaint(
  userId: string,
  subject: string,
  details: string,
) {
  await ensureCustomerPortalSchema();
  const storeResult = await pool.query<{ store_id: string }>(
    `SELECT store_id FROM customer_orders
     WHERE user_id=$1 AND store_id IS NOT NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const storeId = storeResult.rows[0]?.store_id ?? null;
  const { rows } = await pool.query(
    `INSERT INTO customer_complaints (user_id,store_id,subject,details)
     VALUES ($1,$2,$3,$4)
     RETURNING id,subject,details,response,status,created_at,updated_at,resolved_at`,
    [userId, storeId, subject, details],
  );
  const row = rows[0];
  return {
    id: String(row.id),
    reference: `COMP${String(row.id).padStart(4, "0")}`,
    subject: String(row.subject),
    details: String(row.details),
    response: String(row.response),
    status: String(row.status),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    resolvedAt: null,
  };
}

export async function listPortalNotifications(userId: string) {
  await ensureCustomerPortalSchema();
  const { rows } = await pool.query(
    `SELECT id,title,message,is_read,created_at FROM customer_notifications
     WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function markPortalNotificationsRead(userId: string) {
  await ensureCustomerPortalSchema();
  await pool.query(
    `UPDATE customer_notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
}
