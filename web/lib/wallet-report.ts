import { ensureCustomerPortalSchema } from "@/lib/customer-portal";
import { ensureCustomerTable } from "@/lib/customers";
import { pool } from "@/lib/db";

export type WalletReportTransaction = {
  id: string;
  customerName: string;
  mobile: string;
  label: string;
  reason: string;
  amount: number;
  source: string;
  addedBy: string;
  createdAt: string;
};

export type WalletReportData = {
  summary: {
    currentBalance: number;
    totalCredited: number;
    totalDeducted: number;
    walletCustomers: number;
  };
  transactions: WalletReportTransaction[];
};

export async function getWalletReport(): Promise<WalletReportData> {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const [summaryResult, transactionResult] = await Promise.all([
    pool.query<{
      current_balance: string;
      total_credited: string;
      total_deducted: string;
      wallet_customers: string;
    }>(`
      SELECT
        COALESCE((SELECT SUM(balance) FROM customer_wallets), 0) AS current_balance,
        COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) AS total_credited,
        ABS(COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0)) AS total_deducted,
        (SELECT COUNT(*) FROM customer_wallets) AS wallet_customers
      FROM customer_wallet_transactions
    `),
    pool.query<{
      id: string;
      customer_name: string;
      mobile: string;
      label: string;
      note: string;
      amount: string;
      source: string;
      added_by: string | null;
      created_at: Date;
    }>(`
      SELECT
        transactions.id,
        COALESCE(customers.full_name, customer_users.name) AS customer_name,
        COALESCE(customers.mobile, customer_users.mobile, '') AS mobile,
        transactions.label,
        transactions.note,
        transactions.amount,
        transactions.source,
        actor.name AS added_by,
        transactions.created_at
      FROM customer_wallet_transactions transactions
      INNER JOIN app_users customer_users
        ON customer_users.id = transactions.user_id
      LEFT JOIN customers
        ON customers.user_id = customer_users.id
      LEFT JOIN app_users actor
        ON actor.id = transactions.created_by
      ORDER BY transactions.created_at DESC
      LIMIT 2000
    `),
  ]);
  const summary = summaryResult.rows[0];

  return {
    summary: {
      currentBalance: Number(summary.current_balance),
      totalCredited: Number(summary.total_credited),
      totalDeducted: Number(summary.total_deducted),
      walletCustomers: Number(summary.wallet_customers),
    },
    transactions: transactionResult.rows.map((row) => ({
      id: String(row.id),
      customerName: row.customer_name,
      mobile: row.mobile,
      label: row.label,
      reason: row.note,
      amount: Number(row.amount),
      source: row.source,
      addedBy: row.added_by ??
        (row.source === "admin" ? "Admin" : "Customer/App"),
      createdAt: row.created_at.toISOString(),
    })),
  };
}
