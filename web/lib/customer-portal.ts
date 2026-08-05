import { randomUUID } from "crypto";

import { pool } from "@/lib/db";
import {
  orderStatuses,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import { validateOffer } from "@/lib/offers";
import {
  getPendingReferralDiscount,
  rewardReferral,
} from "@/lib/referrals";

export { orderStatuses };
export type { PortalOrderStatus };

export type PortalAddress = {
  id: string;
  type: string;
  fullAddress: string;
  landmark: string;
  city: string;
  pincode: string;
  isDefault: boolean;
};

export type PortalOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type PortalOrderEvent = {
  status: PortalOrderStatus;
  note: string;
  createdAt: string;
};

export type PortalOrder = {
  id: string;
  status: PortalOrderStatus;
  service: string;
  itemCount: number;
  amount: number;
  pickupAt: string;
  deliveryAt: string | null;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  instructions: string;
  createdAt: string;
  items: PortalOrderItem[];
  timeline: PortalOrderEvent[];
};

let setupPromise: Promise<void> | null = null;

export function ensureCustomerPortalSchema() {
  if (!setupPromise) {
    setupPromise = pool.query(`
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
        item_count INTEGER NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        pickup_at TIMESTAMPTZ NOT NULL,
        delivery_at TIMESTAMPTZ,
        payment_method VARCHAR(30) NOT NULL,
        payment_status VARCHAR(20) NOT NULL,
        address_text VARCHAR(500) NOT NULL,
        instructions VARCHAR(120) NOT NULL DEFAULT '',
        coupon_code VARCHAR(30),
        discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_orders_items_positive CHECK (item_count > 0),
        CONSTRAINT customer_orders_amount_positive CHECK (amount >= 0)
      );
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(30);
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS store_id UUID;
      UPDATE customer_orders
      SET store_id = (SELECT id FROM stores WHERE status='active' ORDER BY store_number ASC LIMIT 1)
      WHERE store_id IS NULL;
      CREATE INDEX IF NOT EXISTS customer_orders_store_idx
      ON customer_orders(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS customer_orders_user_idx
      ON customer_orders(user_id, created_at DESC);
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE customer_orders ALTER COLUMN status SET DEFAULT 'New';
      UPDATE customer_orders SET status = 'New' WHERE status = 'In Progress';

      CREATE TABLE IF NOT EXISTS customer_order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        CONSTRAINT customer_order_items_quantity_positive CHECK (quantity > 0),
        CONSTRAINT customer_order_items_price_positive CHECK (unit_price >= 0)
      );

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
    `).then(() => undefined).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

function mapAddress(row: Record<string, unknown>): PortalAddress {
  return {
    id: String(row.id),
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
    `SELECT id, address_type, full_address, landmark, city, pincode, is_default
     FROM customer_addresses WHERE user_id = $1
     ORDER BY is_default DESC, created_at ASC`,
    [userId],
  );
  return rows.map(mapAddress);
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
       (user_id, address_type, full_address, landmark, city, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, address_type, full_address, landmark, city, pincode, is_default`,
      [userId, input.type, input.fullAddress, input.landmark, input.city, input.pincode, input.isDefault],
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
       address_type=$3,full_address=$4,landmark=$5,city=$6,pincode=$7,
       is_default=$8
       WHERE id=$2 AND user_id=$1
       RETURNING id,address_type,full_address,landmark,city,pincode,is_default`,
      [userId,id,input.type,input.fullAddress,input.landmark,input.city,input.pincode,input.isDefault],
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
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const result=await client.query(
      "DELETE FROM customer_addresses WHERE id=$2 AND user_id=$1 RETURNING is_default",
      [userId,id],
    );
    if(!result.rows[0]){await client.query("ROLLBACK");return false;}
    if(result.rows[0].is_default){
      await client.query(
        `UPDATE customer_addresses SET is_default=TRUE
         WHERE id=(SELECT id FROM customer_addresses WHERE user_id=$1 ORDER BY created_at LIMIT 1)`,
        [userId],
      );
    }
    await client.query("COMMIT");return true;
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}

function mapOrder(
  row: Record<string, unknown>,
  items: PortalOrderItem[],
  timeline: PortalOrderEvent[],
): PortalOrder {
  const status = orderStatuses.includes(row.status as PortalOrderStatus)
    ? (row.status as PortalOrderStatus)
    : "New";
  return {
    id: String(row.id),
    status,
    service: String(row.service),
    itemCount: Number(row.item_count),
    amount: Number(row.amount),
    pickupAt: new Date(String(row.pickup_at)).toISOString(),
    deliveryAt: row.delivery_at ? new Date(String(row.delivery_at)).toISOString() : null,
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
    `SELECT order_id, item_name, quantity, unit_price
     FROM customer_order_items WHERE order_id = ANY($1::varchar[]) ORDER BY id`,
    [orderIds],
  );
  const grouped = new Map<string, PortalOrderItem[]>();
  for (const row of rows) {
    const id = String(row.order_id);
    grouped.set(id, [
      ...(grouped.get(id) ?? []),
      { name: String(row.item_name), quantity: Number(row.quantity), unitPrice: Number(row.unit_price) },
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
  const [items, events] = await Promise.all([orderItems(ids), orderEvents(ids)]);
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

export async function createPortalOrder(
  userId: string,
  input: {
    service: string;
    pickupAt: string;
    paymentMethod: string;
    address: string;
    instructions: string;
    couponCode?: string;
    items: PortalOrderItem[];
  },
) {
  await ensureCustomerPortalSchema();
  const itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const coupon = input.couponCode
    ? await validateOffer(input.couponCode, subtotal)
    : null;
  if (coupon && !coupon.valid) throw new Error("INVALID_COUPON");
  const referral = await getPendingReferralDiscount(userId);
  const referralDiscount = referral
    ? Math.round(subtotal * (referral.percent / 100) * 100) / 100
    : 0;
  const couponDiscount = coupon?.valid ? coupon.discount : 0;
  const useReferral = referralDiscount >= couponDiscount && referral !== null;
  const discount = Math.max(referralDiscount, couponDiscount);
  const amount = subtotal - discount;
  const storeResult = await pool.query<{ id: string }>(
    `SELECT id FROM stores WHERE status='active' ORDER BY store_number ASC LIMIT 1`,
  );
  const storeId = storeResult.rows[0]?.id ?? null;
  const id = `ORD${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const paymentStatus =
    input.paymentMethod === "cash" ? "Pending" : "Paid";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
       (id,user_id,store_id,status,service,item_count,amount,pickup_at,payment_method,payment_status,address_text,instructions,coupon_code,discount_amount)
       VALUES ($1,$2,$3,'New',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, userId, storeId, input.service, itemCount, amount, input.pickupAt, input.paymentMethod, paymentStatus, input.address, input.instructions, !useReferral && coupon?.valid ? coupon.offer.code : useReferral ? "REFERRAL20" : null, discount],
    );
    if (!useReferral && coupon?.valid) {
      await client.query(
        "UPDATE promo_offers SET usage_count=usage_count+1 WHERE id=$1",
        [coupon.offer.id],
      );
    }
    if (useReferral && referral) {
      await rewardReferral(client, referral.referralId);
    }
    for (const item of input.items) {
      await client.query(
        `INSERT INTO customer_order_items (order_id,item_name,quantity,unit_price)
         VALUES ($1,$2,$3,$4)`,
        [id, item.name, item.quantity, item.unitPrice],
      );
    }
    await client.query(
      `INSERT INTO customer_payments
       (user_id,order_id,kind,method,status,amount,reference)
       VALUES ($1,$2,'Order',$3,$4,$5,$6)`,
      [
        userId,
        id,
        input.paymentMethod,
        paymentStatus,
        amount,
        `ORDER-${id}`,
      ],
    );
    await client.query(
      `INSERT INTO customer_order_status_history (order_id,status,note)
       VALUES ($1,'New','Order placed')`,
      [id],
    );
    await client.query(
      `INSERT INTO customer_notifications (user_id,title,message)
       VALUES ($1,'Order Confirmed',$2)`,
      [userId, `Your order #${id} has been confirmed.`],
    );
    await client.query("COMMIT");
    return mapOrder(rows[0], input.items, [
      {
        status: "New",
        note: "Order placed",
        createdAt: new Date().toISOString(),
      },
    ]);
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
  const wallet = await pool.query("SELECT balance FROM customer_wallets WHERE user_id = $1", [userId]);
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

export async function createPortalComplaint(userId: string, subject: string, details: string) {
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
  return rows.map((row) => ({ ...row, id: String(row.id), createdAt: new Date(row.created_at).toISOString() }));
}

export async function markPortalNotificationsRead(userId: string) {
  await ensureCustomerPortalSchema();
  await pool.query(
    `UPDATE customer_notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
}
