import type { PoolClient } from "pg";

import { pool } from "@/lib/db";

export type ReferralProfile = {
  code: string;
  shareCount: number;
  successfulReferrals: number;
  rewardsEarned: number;
};

export type ReferralRecord = {
  id: string;
  code: string;
  referrerName: string;
  referrerMobile: string;
  friendName: string;
  friendMobile: string;
  status: "Pending" | "Rewarded";
  rewardAmount: number;
  createdAt: string;
  rewardedAt: string | null;
};

let setupPromise: Promise<void> | null = null;

export function ensureReferralSchema() {
  if (!setupPromise) {
    setupPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS customer_referral_profiles (
          user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
          code VARCHAR(20) NOT NULL UNIQUE,
          share_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS customer_referrals (
          id BIGSERIAL PRIMARY KEY,
          referrer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          referred_user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
          code VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'Pending',
          reward_amount NUMERIC(12,2) NOT NULL DEFAULT 100,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          rewarded_at TIMESTAMPTZ,
          CONSTRAINT customer_referrals_not_self
            CHECK (referrer_id <> referred_user_id),
          CONSTRAINT customer_referrals_status
            CHECK (status IN ('Pending','Rewarded'))
        );
        CREATE INDEX IF NOT EXISTS customer_referrals_referrer_idx
        ON customer_referrals(referrer_id, created_at DESC);
      `)
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

function codeBase(name: string) {
  const letters = name.replace(/[^a-z]/gi, "").slice(0, 5).toUpperCase();
  return letters || "DHOBI";
}

export async function getReferralProfile(userId: string, name: string) {
  await ensureReferralSchema();
  const existing = await pool.query(
    "SELECT * FROM customer_referral_profiles WHERE user_id=$1",
    [userId],
  );
  if (!existing.rows[0]) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = `${codeBase(name)}${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        await pool.query(
          `INSERT INTO customer_referral_profiles(user_id,code)
           VALUES($1,$2)`,
          [userId, code],
        );
        break;
      } catch (error) {
        if (
          typeof error !== "object" ||
          !error ||
          !("code" in error) ||
          error.code !== "23505"
        ) {
          throw error;
        }
      }
    }
  }
  const { rows } = await pool.query(
    `SELECT profiles.code,profiles.share_count,
      COUNT(referrals.id) FILTER (WHERE referrals.status='Rewarded')::int
        AS successful_referrals,
      COALESCE(SUM(referrals.reward_amount)
        FILTER (WHERE referrals.status='Rewarded'),0) AS rewards_earned
     FROM customer_referral_profiles profiles
     LEFT JOIN customer_referrals referrals
       ON referrals.referrer_id=profiles.user_id
     WHERE profiles.user_id=$1
     GROUP BY profiles.code,profiles.share_count`,
    [userId],
  );
  const row = rows[0];
  return {
    code: String(row.code),
    shareCount: Number(row.share_count),
    successfulReferrals: Number(row.successful_referrals),
    rewardsEarned: Number(row.rewards_earned),
  } satisfies ReferralProfile;
}

export async function recordReferralShare(userId: string) {
  await ensureReferralSchema();
  await pool.query(
    `UPDATE customer_referral_profiles
     SET share_count=share_count+1 WHERE user_id=$1`,
    [userId],
  );
}

export async function redeemReferralCode(userId: string, code: string) {
  await ensureReferralSchema();
  const owner = await pool.query(
    `SELECT user_id,code FROM customer_referral_profiles
     WHERE UPPER(code)=UPPER($1)`,
    [code],
  );
  if (!owner.rows[0]) return { kind: "invalid" as const };
  if (owner.rows[0].user_id === userId) return { kind: "self" as const };
  const orders = await pool.query(
    "SELECT COUNT(*)::int AS count FROM customer_orders WHERE user_id=$1",
    [userId],
  );
  if (Number(orders.rows[0].count) > 0) return { kind: "already_ordered" as const };
  try {
    await pool.query(
      `INSERT INTO customer_referrals
       (referrer_id,referred_user_id,code)
       VALUES($1,$2,$3)`,
      [owner.rows[0].user_id, userId, owner.rows[0].code],
    );
    return { kind: "redeemed" as const };
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    ) {
      return { kind: "already_redeemed" as const };
    }
    throw error;
  }
}

export async function getPendingReferralDiscount(userId: string) {
  await ensureReferralSchema();
  const { rows } = await pool.query(
    `SELECT id FROM customer_referrals
     WHERE referred_user_id=$1 AND status='Pending' LIMIT 1`,
    [userId],
  );
  return rows[0] ? { referralId: String(rows[0].id), percent: 20 } : null;
}

export async function rewardReferral(
  client: PoolClient,
  referralId: string,
) {
  const referral = await client.query(
    `UPDATE customer_referrals SET status='Rewarded',rewarded_at=NOW()
     WHERE id=$1 AND status='Pending'
     RETURNING referrer_id,referred_user_id,reward_amount`,
    [referralId],
  );
  if (!referral.rows[0]) return;
  const row = referral.rows[0];
  await client.query(
    `INSERT INTO customer_wallets(user_id,balance) VALUES($1,$2)
     ON CONFLICT(user_id) DO UPDATE
     SET balance=customer_wallets.balance+EXCLUDED.balance,updated_at=NOW()`,
    [row.referrer_id, row.reward_amount],
  );
  await client.query(
    `INSERT INTO customer_wallet_transactions(user_id,label,amount)
     VALUES($1,'Referral Reward',$2)`,
    [row.referrer_id, row.reward_amount],
  );
  await client.query(
    `INSERT INTO customer_notifications(user_id,title,message)
     VALUES($1,'Referral Reward',$2)`,
    [row.referrer_id, `₹${Number(row.reward_amount)} was added to your wallet.`],
  );
}

export async function listReferrals(): Promise<ReferralRecord[]> {
  await ensureReferralSchema();
  const { rows } = await pool.query(`
    SELECT referrals.*,profiles.code AS profile_code,
      referrer.name AS referrer_name,referrer.mobile AS referrer_mobile,
      friend.name AS friend_name,friend.mobile AS friend_mobile
    FROM customer_referrals referrals
    INNER JOIN customer_referral_profiles profiles
      ON profiles.user_id=referrals.referrer_id
    INNER JOIN app_users referrer ON referrer.id=referrals.referrer_id
    INNER JOIN app_users friend ON friend.id=referrals.referred_user_id
    ORDER BY referrals.created_at DESC
  `);
  return rows.map((row) => ({
    id: String(row.id),
    code: String(row.profile_code),
    referrerName: String(row.referrer_name),
    referrerMobile: String(row.referrer_mobile ?? ""),
    friendName: String(row.friend_name),
    friendMobile: String(row.friend_mobile ?? ""),
    status: row.status as ReferralRecord["status"],
    rewardAmount: Number(row.reward_amount),
    createdAt: new Date(row.created_at).toISOString(),
    rewardedAt: row.rewarded_at ? new Date(row.rewarded_at).toISOString() : null,
  }));
}
