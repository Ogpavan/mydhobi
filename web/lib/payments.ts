import { pool } from "@/lib/db";
import { ensureCustomerPortalSchema } from "@/lib/customer-portal";

export const paymentStatuses = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentRecord = {
  id: string;
  reference: string;
  orderId: string | null;
  customerName: string;
  customerMobile: string;
  kind: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
};

export type PaymentStats = {
  collected: number;
  pending: number;
  refunded: number;
  transactions: number;
};

let setupPromise: Promise<void> | null = null;

export function ensurePaymentLedger() {
  if (!setupPromise) {
    setupPromise = ensureCustomerPortalSchema()
      .then(() =>
        pool.query(`
          INSERT INTO customer_payments
            (user_id,order_id,kind,method,status,amount,reference,created_at)
          SELECT orders.user_id,orders.id,'Order',orders.payment_method,
            orders.payment_status,orders.amount,'ORDER-' || orders.id,
            orders.created_at
          FROM customer_orders orders
          ON CONFLICT (reference) DO NOTHING;

          INSERT INTO customer_payments
            (user_id,kind,method,status,amount,reference,created_at)
          SELECT transactions.user_id,'Wallet Top-up','upi','Paid',
            transactions.amount,'WALLET-' || transactions.id,
            transactions.created_at
          FROM customer_wallet_transactions transactions
          WHERE transactions.amount > 0
          ON CONFLICT (reference) DO NOTHING;
        `),
      )
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

function statusFromValue(value: unknown): PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : "Pending";
}

export async function listPayments() {
  await ensurePaymentLedger();
  const { rows } = await pool.query(`
    SELECT payments.id,payments.reference,payments.order_id,payments.kind,
      payments.method,payments.status,payments.amount,payments.created_at,
      users.name AS customer_name,users.mobile AS customer_mobile
    FROM customer_payments payments
    INNER JOIN app_users users ON users.id=payments.user_id
    ORDER BY payments.created_at DESC
    LIMIT 500
  `);
  return rows.map(
    (row): PaymentRecord => ({
      id: String(row.id),
      reference: String(row.reference),
      orderId: row.order_id === null ? null : String(row.order_id),
      customerName: String(row.customer_name),
      customerMobile: String(row.customer_mobile),
      kind: String(row.kind),
      method: String(row.method),
      status: statusFromValue(row.status),
      amount: Number(row.amount),
      createdAt: new Date(String(row.created_at)).toISOString(),
    }),
  );
}

export async function getPaymentStats(): Promise<PaymentStats> {
  await ensurePaymentLedger();
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(amount) FILTER (
        WHERE status='Paid'
          AND (kind='Wallet Top-up' OR (kind='Order' AND method <> 'wallet'))
      ),0) AS collected,
      COALESCE(SUM(amount) FILTER (WHERE status='Pending'),0) AS pending,
      COALESCE(SUM(amount) FILTER (WHERE status='Refunded'),0) AS refunded,
      COUNT(*)::int AS transactions
    FROM customer_payments
  `);
  return {
    collected: Number(rows[0].collected),
    pending: Number(rows[0].pending),
    refunded: Number(rows[0].refunded),
    transactions: Number(rows[0].transactions),
  };
}

export async function updatePaymentStatus(
  id: string,
  nextStatus: PaymentStatus,
) {
  await ensurePaymentLedger();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      "SELECT * FROM customer_payments WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!currentResult.rows[0]) {
      await client.query("ROLLBACK");
      return { kind: "not_found" as const };
    }
    const current = currentResult.rows[0];
    const currentStatus = statusFromValue(current.status);
    const allowed =
      (currentStatus === "Pending" &&
        ["Paid", "Failed"].includes(nextStatus)) ||
      (currentStatus === "Paid" &&
        nextStatus === "Refunded" &&
        current.kind === "Order");
    if (!allowed) {
      await client.query("ROLLBACK");
      return { kind: "invalid_transition" as const, currentStatus };
    }

    await client.query(
      `UPDATE customer_payments SET status=$2,updated_at=NOW() WHERE id=$1`,
      [id, nextStatus],
    );
    if (current.order_id) {
      await client.query(
        `UPDATE customer_orders SET payment_status=$2,updated_at=NOW()
         WHERE id=$1`,
        [current.order_id, nextStatus],
      );
    }
    if (nextStatus === "Refunded") {
      await client.query(
        `INSERT INTO customer_wallets (user_id,balance)
         VALUES ($1,$2)
         ON CONFLICT (user_id) DO UPDATE
         SET balance=customer_wallets.balance + EXCLUDED.balance,
           updated_at=NOW()`,
        [current.user_id, current.amount],
      );
      await client.query(
        `INSERT INTO customer_wallet_transactions (user_id,label,amount)
         VALUES ($1,$2,$3)`,
        [
          current.user_id,
          `Refund for #${current.order_id}`,
          current.amount,
        ],
      );
    }
    await client.query(
      `INSERT INTO customer_notifications (user_id,title,message)
       VALUES ($1,$2,$3)`,
      [
        current.user_id,
        nextStatus === "Refunded" ? "Payment Refunded" : "Payment Updated",
        nextStatus === "Refunded"
          ? `₹${Number(current.amount).toFixed(2)} was added to your wallet.`
          : `Payment for order #${current.order_id} is ${nextStatus.toLowerCase()}.`,
      ],
    );
    await client.query("COMMIT");
    const payments = await listPayments();
    return {
      kind: "updated" as const,
      payment: payments.find((payment) => payment.id === id) ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
