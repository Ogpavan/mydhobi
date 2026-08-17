import process from "node:process";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const services = await client.query(
    `SELECT id, name
     FROM catalog_services
     WHERE image_path = ''
     ORDER BY id`,
  );
  let linked = 0;
  for (const service of services.rows) {
    const source = await client.query(
      `SELECT image_path
       FROM catalog_services
       WHERE name = $1 AND image_path <> ''
       ORDER BY id
       LIMIT 1`,
      [service.name],
    );
    if (source.rowCount !== 1) continue;
    await client.query(
      `UPDATE catalog_services
       SET image_path = $2, updated_at = NOW()
       WHERE id = $1`,
      [service.id, source.rows[0].image_path],
    );
    linked += 1;
  }
  console.log(JSON.stringify({ linked }));
} finally {
  await client.end();
}
