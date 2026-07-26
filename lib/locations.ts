import { pool } from "@/lib/db";

export type SetupState = {
  id: string;
  name: string;
  cityCount: number;
  isActive: boolean;
};

export type SetupCity = {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  isActive: boolean;
};

type StateRow = {
  id: string;
  name: string;
  city_count: string;
  is_active: boolean;
};

type CityRow = {
  id: string;
  name: string;
  state_id: string;
  state_name: string;
  is_active: boolean;
};

let setupPromise: Promise<void> | null = null;

export function ensureLocationTables() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS setup_states (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS setup_states_name_unique
        ON setup_states (LOWER(name))
      `);
      await pool.query(`
        ALTER TABLE setup_states
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS setup_cities (
          id BIGSERIAL PRIMARY KEY,
          state_id BIGINT NOT NULL REFERENCES setup_states(id) ON DELETE RESTRICT,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS setup_cities_state_name_unique
        ON setup_cities (state_id, LOWER(name))
      `);
      await pool.query(`
        ALTER TABLE setup_cities
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}

function mapState(row: StateRow): SetupState {
  return {
    id: row.id,
    name: row.name,
    cityCount: Number(row.city_count),
    isActive: row.is_active,
  };
}

function mapCity(row: CityRow): SetupCity {
  return {
    id: row.id,
    name: row.name,
    stateId: row.state_id,
    stateName: row.state_name,
    isActive: row.is_active,
  };
}

export function normalizeLocationName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateLocationName(value: string, label: "State" | "City") {
  if (!value) return `${label} name is required.`;
  if (value.length < 2 || value.length > 100) {
    return `${label} name must be between 2 and 100 characters.`;
  }
  if (!/^[\p{L} .'-]+$/u.test(value)) {
    return `${label} name can use letters, spaces, dots, apostrophes, and hyphens only.`;
  }

  return null;
}

export async function listSetupStates() {
  await ensureLocationTables();
  const { rows } = await pool.query<StateRow>(`
    SELECT states.id, states.name, states.is_active,
      COUNT(cities.id)::text AS city_count
    FROM setup_states states
    LEFT JOIN setup_cities cities ON cities.state_id = states.id
    GROUP BY states.id, states.name, states.is_active
    ORDER BY states.name ASC
  `);

  return rows.map(mapState);
}

export async function createSetupState(name: string) {
  await ensureLocationTables();
  const { rows } = await pool.query<StateRow>(
    `INSERT INTO setup_states (name)
     VALUES ($1)
     RETURNING id, name, is_active, '0'::text AS city_count`,
    [name],
  );

  return mapState(rows[0]);
}

export async function updateSetupState(id: string, name: string) {
  await ensureLocationTables();
  const { rows } = await pool.query<StateRow>(
    `UPDATE setup_states
     SET name = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, is_active,
       (SELECT COUNT(*)::text FROM setup_cities WHERE state_id = setup_states.id) AS city_count`,
    [id, name],
  );

  return rows[0] ? mapState(rows[0]) : null;
}

export async function updateSetupStateStatus(id: string, isActive: boolean) {
  await ensureLocationTables();
  const { rows } = await pool.query<StateRow>(
    `UPDATE setup_states
     SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, is_active,
       (SELECT COUNT(*)::text FROM setup_cities WHERE state_id = setup_states.id) AS city_count`,
    [id, isActive],
  );

  return rows[0] ? mapState(rows[0]) : null;
}

export async function deleteSetupState(id: string) {
  await ensureLocationTables();
  const result = await pool.query("DELETE FROM setup_states WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listSetupCities() {
  await ensureLocationTables();
  const { rows } = await pool.query<CityRow>(`
    SELECT cities.id, cities.name, cities.state_id, cities.is_active,
      states.name AS state_name
    FROM setup_cities cities
    INNER JOIN setup_states states ON states.id = cities.state_id
    ORDER BY states.name ASC, cities.name ASC
  `);

  return rows.map(mapCity);
}

export async function createSetupCity(name: string, stateId: string) {
  await ensureLocationTables();
  const { rows } = await pool.query<CityRow>(
    `WITH inserted AS (
       INSERT INTO setup_cities (name, state_id)
       VALUES ($1, $2)
       RETURNING id, name, state_id, is_active
     )
     SELECT inserted.id, inserted.name, inserted.state_id, inserted.is_active,
       states.name AS state_name
     FROM inserted
     INNER JOIN setup_states states ON states.id = inserted.state_id`,
    [name, stateId],
  );

  return rows[0] ? mapCity(rows[0]) : null;
}

export async function updateSetupCity(
  id: string,
  name: string,
  stateId: string,
) {
  await ensureLocationTables();
  const { rows } = await pool.query<CityRow>(
    `WITH updated AS (
       UPDATE setup_cities
       SET name = $2, state_id = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, state_id, is_active
     )
     SELECT updated.id, updated.name, updated.state_id, updated.is_active,
       states.name AS state_name
     FROM updated
     INNER JOIN setup_states states ON states.id = updated.state_id`,
    [id, name, stateId],
  );

  return rows[0] ? mapCity(rows[0]) : null;
}

export async function updateSetupCityStatus(id: string, isActive: boolean) {
  await ensureLocationTables();
  const { rows } = await pool.query<CityRow>(
    `WITH updated AS (
       UPDATE setup_cities
       SET is_active = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, state_id, is_active
     )
     SELECT updated.id, updated.name, updated.state_id, updated.is_active,
       states.name AS state_name
     FROM updated
     INNER JOIN setup_states states ON states.id = updated.state_id`,
    [id, isActive],
  );

  return rows[0] ? mapCity(rows[0]) : null;
}

export async function deleteSetupCity(id: string) {
  await ensureLocationTables();
  const result = await pool.query("DELETE FROM setup_cities WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
