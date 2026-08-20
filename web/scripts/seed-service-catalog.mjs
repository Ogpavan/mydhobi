import { Client } from "pg";

const services = [
  { name: "Dry Clean", slug: "dry-clean", unit: "piece", regularPrice: 150 },
  { name: "Wash", slug: "wash", unit: "piece", regularPrice: 80 },
  { name: "Laundry", slug: "laundry", unit: "piece", regularPrice: 100 },
  { name: "Rafu", slug: "rafu", unit: "piece", regularPrice: 60 },
];

const garments = [
  { name: "Apron", slug: "apron", audience: "other", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Blazer", slug: "blazer", audience: "men", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Cap", slug: "cap", audience: "other", services: ["dry-clean", "wash", "laundry"] },
  { name: "Dress", slug: "dress", audience: "women", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Jacket", slug: "jacket", audience: "other", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Kurta", slug: "kurta", audience: "other", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Saree", slug: "saree", audience: "women", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Shirt", slug: "shirt", audience: "men", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "T-shirt", slug: "t-shirt", audience: "kid", services: ["dry-clean", "wash", "laundry"] },
  { name: "Trousers", slug: "trousers", audience: "men", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Bedsheet", slug: "bedsheet", audience: "other", services: ["dry-clean", "wash", "laundry", "rafu"] },
  { name: "Shoe", slug: "shoe", audience: "other", services: ["dry-clean", "wash", "laundry"] },
];

async function createTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      slug VARCHAR(90) NOT NULL UNIQUE,
      image_path VARCHAR(250) NOT NULL DEFAULT '',
      audience VARCHAR(20) NOT NULL DEFAULT 'other',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'other';
    CREATE TABLE IF NOT EXISTS catalog_services (
      id BIGSERIAL PRIMARY KEY,
      category_id BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(110) NOT NULL UNIQUE,
      image_path VARCHAR(250) NOT NULL DEFAULT '',
      unit VARCHAR(20) NOT NULL,
      regular_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      express_price NUMERIC(12,2),
      turnaround VARCHAR(60) NOT NULL DEFAULT '2-3 Days',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS catalog_service_variants (
      id BIGSERIAL PRIMARY KEY,
      service_id BIGINT NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      unit VARCHAR(20) NOT NULL,
      regular_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      express_price NUMERIC(12,2),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (service_id, name)
    );
  `);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const replace = process.argv.includes("--replace");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    await createTables(client);
    const existing = await client.query("SELECT (SELECT COUNT(*) FROM service_categories)::int AS categories, (SELECT COUNT(*) FROM catalog_services)::int AS services");
    const counts = existing.rows[0];
    if ((counts.categories > 0 || counts.services > 0) && !replace) {
      throw new Error("Catalog is not empty. Review the data, then run with --replace to replace it with the garment-first catalog.");
    }
    if (replace) {
      await client.query("TRUNCATE TABLE catalog_service_variants, catalog_services, service_categories RESTART IDENTITY CASCADE");
    }

    let serviceOrder = 1;
    for (const [garmentIndex, garment] of garments.entries()) {
      const categoryResult = await client.query(
        `INSERT INTO service_categories (name,slug,image_path,audience,display_order)
         VALUES ($1,$2,'',$3,$4) RETURNING id`,
        [garment.name, garment.slug, garment.audience, garmentIndex + 1],
      );
      const categoryId = categoryResult.rows[0].id;
      for (const serviceSlug of garment.services) {
        const service = services.find((item) => item.slug === serviceSlug);
        if (!service) throw new Error(`Unknown service: ${serviceSlug}`);
        const serviceResult = await client.query(
          `INSERT INTO catalog_services
           (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
           VALUES ($1,$2,$3,'',$4,$5,NULL,'2-3 Days',$6) RETURNING id`,
          [categoryId, service.name, `${garment.slug}-${service.slug}`, service.unit, service.regularPrice, serviceOrder++],
        );
        await client.query(
          `INSERT INTO catalog_service_variants
           (service_id,name,unit,regular_price,express_price,display_order)
           VALUES ($1,'Standard',$2,$3,NULL,1)`,
          [serviceResult.rows[0].id, service.unit, service.regularPrice],
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Seeded ${garments.length} garments with ${serviceOrder - 1} garment services.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
