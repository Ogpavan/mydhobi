import { ensureCustomerPortalSchema } from "@/lib/customer-portal";
import { ensureCustomerTable } from "@/lib/customers";
import { pool } from "@/lib/db";

export type AdminWalletTransaction = {
  id: string;
  label: string;
  note: string;
  amount: number;
  createdAt: string;
};

export type AdminCustomerWallet = {
  customerId: string;
  customerName: string;
  hasLogin: boolean;
  balance: number;
  transactions: AdminWalletTransaction[];
};

type CustomerWalletRow = {
  id: string;
  full_name: string;
  user_id: string | null;
};

async function loadWalletTransactions(userId: string) {
  const { rows } = await pool.query<{
    id: string;
    label: string;
    note: string;
    amount: string;
    created_at: Date;
  }>(
    `SELECT id, label, note, amount, created_at
     FROM customer_wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    label: row.label,
    note: row.note,
    amount: Number(row.amount),
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getAdminCustomerWallet(
  customerId: string,
): Promise<AdminCustomerWallet | null> {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const { rows } = await pool.query<CustomerWalletRow>(
    `SELECT id, full_name, user_id
     FROM customers
     WHERE id = $1
     LIMIT 1`,
    [customerId],
  );
  const customer = rows[0];
  if (!customer) return null;

  if (!customer.user_id) {
    return {
      customerId: customer.id,
      customerName: customer.full_name,
      hasLogin: false,
      balance: 0,
      transactions: [],
    };
  }

  await pool.query(
    `INSERT INTO customer_wallets (user_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [customer.user_id],
  );
  const [{ rows: walletRows }, transactions] = await Promise.all([
    pool.query<{ balance: string }>(
      "SELECT balance FROM customer_wallets WHERE user_id = $1",
      [customer.user_id],
    ),
    loadWalletTransactions(customer.user_id),
  ]);

  return {
    customerId: customer.id,
    customerName: customer.full_name,
    hasLogin: true,
    balance: Number(walletRows[0]?.balance ?? 0),
    transactions,
  };
}

export async function adjustAdminCustomerWallet({
  customerId,
  adminId,
  action,
  amount,
  reason,
}: {
  customerId: string;
  adminId: string;
  action: "add" | "deduct";
  amount: number;
  reason: string;
}) {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const customerResult = await client.query<CustomerWalletRow>(
      `SELECT id, full_name, user_id
       FROM customers
       WHERE id = $1
       FOR UPDATE`,
      [customerId],
    );
    const customer = customerResult.rows[0];
    if (!customer) {
      await client.query("ROLLBACK");
      return { status: "not_found" as const };
    }
    if (!customer.user_id) {
      await client.query("ROLLBACK");
      return { status: "no_login" as const };
    }

    await client.query(
      `INSERT INTO customer_wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [customer.user_id],
    );
    const walletResult = await client.query<{ balance: string }>(
      `SELECT balance
       FROM customer_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [customer.user_id],
    );
    const currentBalance = Number(walletResult.rows[0].balance);
    if (action === "deduct" && amount > currentBalance) {
      await client.query("ROLLBACK");
      return { status: "insufficient_balance" as const, balance: currentBalance };
    }

    const signedAmount = action === "add" ? amount : -amount;
    await client.query(
      `UPDATE customer_wallets
       SET balance = balance + $2, updated_at = NOW()
       WHERE user_id = $1`,
      [customer.user_id, signedAmount],
    );
    await client.query(
      `INSERT INTO customer_wallet_transactions (
         user_id, label, note, amount, source, created_by
       )
       VALUES ($1, $2, $3, $4, 'admin', $5)`,
      [
        customer.user_id,
        action === "add" ? "Money added by admin" : "Money deducted by admin",
        reason,
        signedAmount,
        adminId,
      ],
    );
    await client.query(
      `INSERT INTO customer_notifications (user_id, title, message)
       VALUES ($1, 'Wallet Updated', $2)`,
      [
        customer.user_id,
        action === "add"
          ? `₹${amount.toFixed(2)} was added to your wallet.`
          : `₹${amount.toFixed(2)} was deducted from your wallet.`,
      ],
    );
    await client.query("COMMIT");

    return {
      status: "success" as const,
      wallet: await getAdminCustomerWallet(customerId),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
