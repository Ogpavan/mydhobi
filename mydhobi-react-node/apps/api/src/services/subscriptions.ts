import {
  findSubscriptionPlan,
  subscriptionPlans,
  type CustomerSubscription,
  type SubscriptionPlanCode,
} from "@mydhobi/domain/subscriptions";
import type { PoolClient } from "pg";
import { pool } from "./db";

type SubscriptionRow = {
  id: string;
  plan_code: string;
  plan_name: string;
  amount: string | number;
  duration_days: number;
  pickup_limit: number;
  pickup_used: number;
  discount_percent: string | number;
  started_at: string | Date;
  ends_at: string | Date;
  status: "active" | "expired";
};

function mapSubscription(row: SubscriptionRow): CustomerSubscription {
  const plan = findSubscriptionPlan(row.plan_code);
  return {
    id: String(row.id),
    planCode: (plan?.code ?? row.plan_code) as SubscriptionPlanCode,
    planName: String(row.plan_name),
    amount: Number(row.amount),
    durationDays: Number(row.duration_days),
    pickupLimit: Number(row.pickup_limit),
    pickupUsed: Number(row.pickup_used),
    discountPercent: Number(row.discount_percent),
    startedAt: new Date(row.started_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    status: row.status,
  };
}

async function expireOldSubscriptions(userId: string) {
  await pool.query(
    `UPDATE customer_subscriptions
     SET status='expired'
     WHERE user_id=$1 AND status='active' AND ends_at <= NOW()`,
    [userId],
  );
}

export async function getCustomerSubscription(userId: string) {
  await expireOldSubscriptions(userId);
  const [activeResult, historyResult, walletResult] = await Promise.all([
    pool.query<SubscriptionRow>(
      `SELECT id,plan_code,plan_name,amount,duration_days,pickup_limit,
              pickup_used,discount_percent,started_at,ends_at,status
       FROM customer_subscriptions
       WHERE user_id=$1 AND status='active' AND ends_at > NOW()
       ORDER BY ends_at DESC LIMIT 1`,
      [userId],
    ),
    pool.query<SubscriptionRow>(
      `SELECT id,plan_code,plan_name,amount,duration_days,pickup_limit,
              pickup_used,discount_percent,started_at,ends_at,status
       FROM customer_subscriptions
       WHERE user_id=$1
       ORDER BY created_at DESC LIMIT 10`,
      [userId],
    ),
    pool.query<{ balance: string }>(
      `SELECT balance FROM customer_wallets WHERE user_id=$1`,
      [userId],
    ),
  ]);
  return {
    plans: subscriptionPlans,
    active: activeResult.rows[0] ? mapSubscription(activeResult.rows[0]) : null,
    history: historyResult.rows.map(mapSubscription),
    walletBalance: Number(walletResult.rows[0]?.balance ?? 0),
  };
}

export async function lockActiveSubscription(
  client: PoolClient,
  userId: string,
) {
  const result = await client.query<SubscriptionRow>(
    `SELECT id,plan_code,plan_name,amount,duration_days,pickup_limit,
            pickup_used,discount_percent,started_at,ends_at,status
     FROM customer_subscriptions
     WHERE user_id=$1 AND status='active' AND ends_at > NOW()
     ORDER BY ends_at DESC LIMIT 1 FOR UPDATE`,
    [userId],
  );
  const row = result.rows[0];
  if (!row || Number(row.pickup_used) >= Number(row.pickup_limit)) return null;
  return mapSubscription(row);
}

export async function consumeSubscriptionPickup(
  client: PoolClient,
  subscriptionId: string,
) {
  await client.query(
    `UPDATE customer_subscriptions
     SET pickup_used=pickup_used+1
     WHERE id=$1 AND pickup_used < pickup_limit`,
    [subscriptionId],
  );
}

export async function activateCustomerSubscription(
  userId: string,
  planCode: string,
) {
  const plan = findSubscriptionPlan(planCode);
  if (!plan) throw new Error("SUBSCRIPTION_PLAN_NOT_FOUND");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE customer_subscriptions
       SET status='expired'
       WHERE user_id=$1 AND status='active' AND ends_at <= NOW()`,
      [userId],
    );
    const active = await client.query(
      `SELECT id FROM customer_subscriptions
       WHERE user_id=$1 AND status='active' AND ends_at > NOW()
       LIMIT 1 FOR UPDATE`,
      [userId],
    );
    if (active.rows.length) throw new Error("ACTIVE_SUBSCRIPTION");

    await client.query(
      `INSERT INTO customer_wallets(user_id,balance)
       VALUES($1,0) ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    const wallet = await client.query<{ balance: string }>(
      `SELECT balance FROM customer_wallets WHERE user_id=$1 FOR UPDATE`,
      [userId],
    );
    const balance = Number(wallet.rows[0]?.balance ?? 0);
    if (balance < plan.price) throw new Error("INSUFFICIENT_WALLET_BALANCE");

    const idResult = await client.query<{ id: string }>(
      "SELECT gen_random_uuid() AS id",
    );
    const id = idResult.rows[0].id;
    const startedAt = new Date();
    const endsAt = new Date(
      startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );
    await client.query(
      `UPDATE customer_wallets
       SET balance=balance-$2,updated_at=NOW()
       WHERE user_id=$1`,
      [userId, plan.price],
    );
    await client.query(
      `INSERT INTO customer_wallet_transactions(user_id,label,amount)
       VALUES($1,$2,$3)`,
      [userId, `${plan.name} subscription`, -plan.price],
    );
    await client.query(
      `INSERT INTO customer_payments
       (user_id,kind,method,status,amount,reference)
       VALUES($1,'Subscription','wallet','Paid',$2,$3)`,
      [userId, plan.price, `SUB-${id}`],
    );
    const result = await client.query<SubscriptionRow>(
      `INSERT INTO customer_subscriptions
       (id,user_id,plan_code,plan_name,amount,duration_days,pickup_limit,
        pickup_used,discount_percent,started_at,ends_at,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,'active')
       RETURNING id,plan_code,plan_name,amount,duration_days,pickup_limit,
                 pickup_used,discount_percent,started_at,ends_at,status`,
      [
        id,
        userId,
        plan.code,
        plan.name,
        plan.price,
        plan.durationDays,
        plan.pickupLimit,
        plan.discountPercent,
        startedAt,
        endsAt,
      ],
    );
    await client.query("COMMIT");
    return mapSubscription(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
