import { pool } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";

export type DbUser = AuthUser & {
  passwordHash: string;
  status: "active" | "disabled";
};

type UserRow = {
  id: string;
  email: string;
  mobile: string;
  password_hash: string;
  name: string;
  designation: string;
  role: "admin" | "staff" | "store_manager" | "customer";
  status: "active" | "disabled";
};

let userSetupPromise: Promise<void> | null = null;

export function ensureUserLoginSchema() {
  if (!userSetupPromise) {
    userSetupPromise = pool.query(`
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS mobile VARCHAR(10);
      UPDATE app_users users
      SET mobile = stores.mobile
      FROM stores
      WHERE users.mobile IS NULL
        AND LOWER(users.email) = LOWER(stores.email)
        AND stores.mobile ~ '^[0-9]{10}$';
      DO $$
      BEGIN
        IF to_regclass('public.store_team_members') IS NOT NULL THEN
          UPDATE app_users users
          SET mobile = team.mobile
          FROM store_team_members team
          WHERE users.mobile IS NULL
            AND LOWER(users.email) = LOWER(team.email)
            AND team.mobile ~ '^[0-9]{10}$';
        END IF;
      END $$;
      UPDATE app_users
      SET mobile = (
        SELECT mobile FROM stores
        WHERE mobile ~ '^[0-9]{10}$'
        ORDER BY store_number ASC LIMIT 1
      )
      WHERE mobile IS NULL AND (SELECT COUNT(*) FROM app_users) = 1;
      CREATE UNIQUE INDEX IF NOT EXISTS app_users_mobile_unique
      ON app_users (mobile) WHERE mobile IS NOT NULL;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'app_users_mobile_format'
        ) THEN
          ALTER TABLE app_users ADD CONSTRAINT app_users_mobile_format
          CHECK (mobile IS NULL OR mobile ~ '^[0-9]{10}$');
        END IF;
      END $$;
      DO $$
      DECLARE role_constraint RECORD;
      BEGIN
        FOR role_constraint IN
          SELECT constraints.conname
          FROM pg_constraint constraints
          INNER JOIN pg_class tables ON tables.oid = constraints.conrelid
          WHERE tables.relname = 'app_users'
            AND constraints.contype = 'c'
            AND pg_get_constraintdef(constraints.oid) ILIKE '%role%'
        LOOP
          EXECUTE format('ALTER TABLE app_users DROP CONSTRAINT %I', role_constraint.conname);
        END LOOP;
      END $$;
      ALTER TABLE app_users
      ADD CONSTRAINT app_users_role_check
      CHECK (role IN ('admin', 'staff', 'store_manager', 'customer'));
    `).then(() => undefined).catch((error) => {
      userSetupPromise = null;
      throw error;
    });
  }
  return userSetupPromise;
}

function mapUser(row: UserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    mobile: row.mobile,
    passwordHash: row.password_hash,
    name: row.name,
    designation: row.designation,
    role: row.role,
    status: row.status,
  };
}

export async function getUserByEmail(email: string) {
  await ensureUserLoginSchema();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, mobile, password_hash, name, designation, role, status
     FROM app_users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserByMobile(mobile: string) {
  await ensureUserLoginSchema();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, mobile, password_hash, name, designation, role, status
     FROM app_users WHERE mobile = $1 LIMIT 1`,
    [mobile],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserById(id: string) {
  await ensureUserLoginSchema();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, mobile, password_hash, name, designation, role, status
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}
