import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";
import pg from "pg";

const { Client } = pg;

function readArg(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const inputPath = readArg("--input");
const serviceId = readArg("--service-id");
const slug = readArg("--slug");
const outputDir = path.resolve("public/service-icons");
const outputPath = path.join(outputDir, `${slug}.png`);

const image = await sharp(inputPath)
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

if (image.length > 2 * 1024 * 1024) {
  throw new Error(`Optimized icon is still larger than 2 MB: ${image.length} bytes`);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, image);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("BEGIN");
  const inserted = await client.query(
    `INSERT INTO service_catalog_images (image_data, image_mime)
     VALUES ($1, $2)
     RETURNING id`,
    [image, "image/png"],
  );
  const imagePath = `/api/service-catalog-images/${inserted.rows[0].id}`;
  const updated = await client.query(
    `UPDATE catalog_services
     SET image_path = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [serviceId, imagePath],
  );
  if (updated.rowCount !== 1) {
    throw new Error(`Service ${serviceId} was not found; icon was not attached`);
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ serviceId, slug, imagePath, bytes: image.length, file: outputPath }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
