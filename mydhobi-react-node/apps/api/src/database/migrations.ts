import { pool } from "../services/db";
import { withSchemaMigration } from "./schema-mode";
import { setupFeatureSchema } from "./setup";
export const SCHEMA_VERSION = 7;

export async function migrateDatabase() {
  // Only the explicit migration command runs DDL/backfills. Requests never do.
  const lock = await pool.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(72635190)");
    await pool.query(
      `CREATE TABLE IF NOT EXISTS mydhobi_schema_versions (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    );
    const existing = await pool.query(
      "SELECT version FROM mydhobi_schema_versions WHERE version=$1",
      [SCHEMA_VERSION],
    );
    if (existing.rows.length) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
        mobile varchar(10), password_hash text NOT NULL, name text NOT NULL,
        designation text NOT NULL DEFAULT '', role text NOT NULL DEFAULT 'customer',
        status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS stores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_number bigserial UNIQUE,
        name text NOT NULL, company text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', mobile varchar(10) NOT NULL,
        process_time text NOT NULL DEFAULT '', tag_delivery_date_interval text NOT NULL DEFAULT '',
        invoice_gen_name text NOT NULL DEFAULT '', invoice_gen_number text NOT NULL DEFAULT '',
        upi_account_name text NOT NULL DEFAULT '', upi_account_id text NOT NULL DEFAULT '', upi_disclaimer text NOT NULL DEFAULT '', notification_note text NOT NULL DEFAULT '',
        address_line1 text NOT NULL DEFAULT '', address_line2 text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '', state text NOT NULL DEFAULT '', landmark text NOT NULL DEFAULT '',
        pin_code text NOT NULL DEFAULT '', latitude text NOT NULL DEFAULT '', longitude text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await withSchemaMigration(setupFeatureSchema);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_otp_challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile VARCHAR(10) NOT NULL,
        purpose TEXT NOT NULL CHECK (purpose IN ('login', 'password_reset')),
        code_hash TEXT NOT NULL,
        attempts SMALLINT NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS auth_otp_challenges_lookup_idx
      ON auth_otp_challenges (mobile, purpose, created_at DESC)
      WHERE consumed_at IS NULL;
    `);
    await pool.query(`ALTER TABLE customer_orders
      ADD COLUMN IF NOT EXISTS booking_kind text NOT NULL DEFAULT 'items',
      ADD COLUMN IF NOT EXISTS requested_services jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS pickup_slot text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS delivery_option text NOT NULL DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS invoice_pending boolean NOT NULL DEFAULT false`);
    await pool.query(`
      ALTER TABLE customer_orders DROP CONSTRAINT IF EXISTS customer_orders_items_positive;
      ALTER TABLE customer_orders ADD CONSTRAINT customer_orders_items_nonnegative
        CHECK (item_count >= 0);
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS pickup_charge NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS pickup_address_id BIGINT REFERENCES customer_addresses(id) ON DELETE SET NULL;
      ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100) NOT NULL DEFAULT '';
      ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(10) NOT NULL DEFAULT '';
      ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_phone_format;
      ALTER TABLE customer_addresses ADD CONSTRAINT customer_addresses_phone_format
        CHECK (contact_phone = '' OR contact_phone ~ '^[0-9]{10}$');
      CREATE TABLE IF NOT EXISTS customer_order_inspection_notes (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        order_item_id BIGINT REFERENCES customer_order_items(id) ON DELETE CASCADE,
        note_type VARCHAR(30) NOT NULL DEFAULT 'care',
        note TEXT NOT NULL,
        created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS customer_order_inspection_notes_order_idx
        ON customer_order_inspection_notes(order_id, created_at);
      CREATE TABLE IF NOT EXISTS customer_order_item_photos (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
        order_item_id BIGINT REFERENCES customer_order_items(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        caption VARCHAR(180) NOT NULL DEFAULT '',
        created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS mydhobi_orders_store_created_idx ON customer_orders(store_id,created_at DESC);
      CREATE INDEX IF NOT EXISTS mydhobi_orders_status_idx ON customer_orders(status);
      CREATE INDEX IF NOT EXISTS mydhobi_pickups_day_idx ON order_pickups(((scheduled_at AT TIME ZONE 'Asia/Kolkata')::date));
      CREATE INDEX IF NOT EXISTS mydhobi_deliveries_day_idx ON order_deliveries(((scheduled_at AT TIME ZONE 'Asia/Kolkata')::date));
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        plan_code VARCHAR(40) NOT NULL,
        plan_name VARCHAR(80) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        duration_days INTEGER NOT NULL,
        pickup_limit INTEGER NOT NULL,
        pickup_used INTEGER NOT NULL DEFAULT 0,
        discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
        started_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT customer_subscriptions_status_check CHECK (status IN ('active','expired')),
        CONSTRAINT customer_subscriptions_amount_check CHECK (amount >= 0),
        CONSTRAINT customer_subscriptions_dates_check CHECK (ends_at > started_at)
      );
      CREATE INDEX IF NOT EXISTS customer_subscriptions_user_idx
      ON customer_subscriptions(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS customer_subscriptions_active_idx
      ON customer_subscriptions(user_id, status, ends_at);
      ALTER TABLE customer_subscriptions
      ADD COLUMN IF NOT EXISTS pickup_used INTEGER NOT NULL DEFAULT 0;
    `);
    await pool.query(
      "INSERT INTO mydhobi_schema_versions(version) VALUES($1)",
      [SCHEMA_VERSION],
    );
  } finally {
    await lock.query("SELECT pg_advisory_unlock(72635190)");
    lock.release();
  }
}
