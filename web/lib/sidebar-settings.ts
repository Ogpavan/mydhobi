import { pool } from "@/lib/db";
import {
  SIDEBAR_ITEM_DEFINITIONS,
  type SidebarItemKey,
  type SidebarSetting,
} from "@/lib/sidebar-settings-types";

type SidebarSettingRow = {
  item_key: string;
  label: string;
  has_icon: boolean;
  updated_at: Date;
};

let setupPromise: Promise<void> | null = null;

export function ensureSidebarSettingsTable() {
  if (!setupPromise) {
    setupPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS developer_sidebar_settings (
          item_key VARCHAR(40) PRIMARY KEY,
          label VARCHAR(40) NOT NULL,
          icon_data BYTEA,
          icon_mime VARCHAR(40),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        setupPromise = null;
        throw error;
      });
  }

  return setupPromise;
}

export function isSidebarItemKey(value: string): value is SidebarItemKey {
  return SIDEBAR_ITEM_DEFINITIONS.some((item) => item.key === value);
}

export function normalizeSidebarLabel(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateSidebarLabel(value: string) {
  if (!value) return "Name is required.";
  if (value.length > 40) return "Name must have 40 characters or less.";
  return null;
}

export async function listSidebarSettings(): Promise<SidebarSetting[]> {
  await ensureSidebarSettingsTable();
  const { rows } = await pool.query<SidebarSettingRow>(`
    SELECT item_key, label, icon_data IS NOT NULL AS has_icon, updated_at
    FROM developer_sidebar_settings
  `);
  const saved = new Map(rows.map((row) => [row.item_key, row]));

  return SIDEBAR_ITEM_DEFINITIONS.map((item) => {
    const row = saved.get(item.key);
    return {
      key: item.key,
      label: row?.label || item.defaultLabel,
      iconUrl: row?.has_icon
        ? `/api/developer/sidebar-icons/${item.key}?v=${row.updated_at.getTime()}`
        : null,
    };
  });
}

export async function saveSidebarSettings(
  labels: Record<SidebarItemKey, string>,
  icons: Partial<Record<SidebarItemKey, { data: Buffer; mime: string }>>,
  removedIconKeys: SidebarItemKey[],
) {
  await ensureSidebarSettingsTable();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of SIDEBAR_ITEM_DEFINITIONS) {
      const icon = icons[item.key];
      const removeIcon = removedIconKeys.includes(item.key);

      await client.query(
        `INSERT INTO developer_sidebar_settings (
           item_key, label, icon_data, icon_mime
         )
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (item_key) DO UPDATE SET
           label = EXCLUDED.label,
           icon_data = CASE
             WHEN $5::boolean THEN NULL
             WHEN $3::bytea IS NOT NULL THEN $3::bytea
             ELSE developer_sidebar_settings.icon_data
           END,
           icon_mime = CASE
             WHEN $5::boolean THEN NULL
             WHEN $4::text IS NOT NULL THEN $4::text
             ELSE developer_sidebar_settings.icon_mime
           END,
           updated_at = NOW()`,
        [
          item.key,
          labels[item.key],
          icon?.data ?? null,
          icon?.mime ?? null,
          removeIcon,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return listSidebarSettings();
}

export async function getSidebarIcon(key: SidebarItemKey) {
  await ensureSidebarSettingsTable();
  const { rows } = await pool.query<{
    icon_data: Buffer;
    icon_mime: string;
    updated_at: Date;
  }>(
    `SELECT icon_data, icon_mime, updated_at
     FROM developer_sidebar_settings
     WHERE item_key = $1 AND icon_data IS NOT NULL AND icon_mime IS NOT NULL`,
    [key],
  );

  return rows[0] ?? null;
}
