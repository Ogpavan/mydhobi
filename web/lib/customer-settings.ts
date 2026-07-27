import { pool } from "@/lib/db";
import { ensureCustomerPortalSchema } from "@/lib/customer-portal";

export type CustomerSettings = {
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: "English";
  updatedAt: string;
};

let setupPromise: Promise<void> | null = null;

export function ensureCustomerSettingsSchema() {
  if (!setupPromise) {
    setupPromise = ensureCustomerPortalSchema()
      .then(() => pool.query(`
        CREATE TABLE IF NOT EXISTS customer_settings (
          user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
          notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
          language VARCHAR(20) NOT NULL DEFAULT 'English',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT customer_settings_language CHECK (language = 'English')
        );
        CREATE OR REPLACE FUNCTION respect_customer_notification_setting()
        RETURNS TRIGGER AS $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM customer_settings
            WHERE user_id = NEW.user_id
              AND notifications_enabled = FALSE
          ) THEN
            RETURN NULL;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS customer_notifications_preference
        ON customer_notifications;
        CREATE TRIGGER customer_notifications_preference
        BEFORE INSERT ON customer_notifications
        FOR EACH ROW EXECUTE FUNCTION respect_customer_notification_setting();
      `))
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }
  return setupPromise;
}

function mapSettings(row: Record<string, unknown>): CustomerSettings {
  return {
    notificationsEnabled: Boolean(row.notifications_enabled),
    darkMode: Boolean(row.dark_mode),
    language: "English",
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function getCustomerSettings(userId: string) {
  await ensureCustomerSettingsSchema();
  const { rows } = await pool.query(
    `INSERT INTO customer_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId],
  );
  return mapSettings(rows[0]);
}

export async function updateCustomerSettings(
  userId: string,
  input: Pick<CustomerSettings, "notificationsEnabled" | "darkMode">,
) {
  await ensureCustomerSettingsSchema();
  const { rows } = await pool.query(
    `INSERT INTO customer_settings
       (user_id,notifications_enabled,dark_mode)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET
       notifications_enabled = EXCLUDED.notifications_enabled,
       dark_mode = EXCLUDED.dark_mode,
       updated_at = NOW()
     RETURNING *`,
    [userId, input.notificationsEnabled, input.darkMode],
  );
  return mapSettings(rows[0]);
}
