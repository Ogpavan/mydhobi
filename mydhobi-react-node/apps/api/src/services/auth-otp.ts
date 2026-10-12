import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { pool } from "@/lib/db";

export type AuthOtpPurpose = "login" | "password_reset";

export const AUTH_OTP_TTL_MINUTES = 5;
const AUTH_OTP_MAX_ATTEMPTS = 5;

function otpSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

function hashOtp(mobile: string, purpose: AuthOtpPurpose, code: string) {
  return createHmac("sha256", otpSecret())
    .update(`${purpose}:${mobile}:${code}`)
    .digest("hex");
}

function matchesOtp(
  mobile: string,
  purpose: AuthOtpPurpose,
  code: string,
  storedHash: string,
) {
  const expected = Buffer.from(hashOtp(mobile, purpose, code), "hex");
  const actual = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createAuthOtp(mobile: string, purpose: AuthOtpPurpose) {
  const code = String(randomInt(100000, 1000000));
  await pool.query(
    `UPDATE auth_otp_challenges
     SET consumed_at = NOW()
     WHERE mobile = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [mobile, purpose],
  );
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO auth_otp_challenges
       (mobile, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
     RETURNING id`,
    [mobile, purpose, hashOtp(mobile, purpose, code)],
  );

  return { id: rows[0].id, code };
}

export async function invalidateAuthOtp(id: string) {
  await pool.query(
    "UPDATE auth_otp_challenges SET consumed_at=NOW() WHERE id=$1 AND consumed_at IS NULL",
    [id],
  );
}

export async function consumeAuthOtp(
  mobile: string,
  purpose: AuthOtpPurpose,
  code: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{
      id: string;
      code_hash: string;
      attempts: number;
      expires_at: Date | string;
    }>(
      `SELECT id, code_hash, attempts, expires_at
       FROM auth_otp_challenges
       WHERE mobile=$1 AND purpose=$2 AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [mobile, purpose],
    );
    const challenge = result.rows[0];
    if (!challenge) {
      await client.query("COMMIT");
      return false;
    }

    const expired = new Date(challenge.expires_at).getTime() <= Date.now();
    const valid =
      !expired &&
      challenge.attempts < AUTH_OTP_MAX_ATTEMPTS &&
      matchesOtp(mobile, purpose, code, challenge.code_hash);

    if (!valid) {
      const nextAttempts = challenge.attempts + 1;
      await client.query(
        `UPDATE auth_otp_challenges
         SET attempts=$2,
             consumed_at=CASE WHEN $2 >= $3 OR $4 THEN NOW() ELSE consumed_at END
         WHERE id=$1`,
        [challenge.id, nextAttempts, AUTH_OTP_MAX_ATTEMPTS, expired],
      );
      await client.query("COMMIT");
      return false;
    }

    await client.query(
      "UPDATE auth_otp_challenges SET consumed_at=NOW() WHERE id=$1",
      [challenge.id],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
