import { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import bcrypt from "bcryptjs";

/** Isolated PostgreSQL engine for tests; never reads .env or the live database. */
export async function createFixtureDatabase() {
  process.env.DATABASE_URL = "postgresql://test-only@127.0.0.1/unused";
  process.env.JWT_SECRET =
    "mydhobi-isolated-test-secret-at-least-32-characters";
  process.env.APP_ORIGIN = "http://localhost:3000";
  const database = new PGlite();
  const queries: string[] = [];
  await database.waitReady;
  async function query(text: string, values?: unknown[]) {
    queries.push(text);
    // PGlite is a single-process engine; advisory locks are unnecessary here.
    if (/^SELECT pg_advisory_(?:(?:un)?lock|xact_lock)\(/.test(text))
      return { rows: [], rowCount: 1, fields: [] };
    if (values?.length) {
      const result = await database.query(text, values);
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    }
    const results = await database.exec(text);
    const result = results.at(-1);
    return {
      ...result,
      rows: result?.rows ?? [],
      rowCount: result?.affectedRows ?? result?.rows.length ?? 0,
    };
  }
  const connection = { query, release() {} };
  globalThis.mydhobiPool = {
    query,
    connect: async () => connection,
    end: () => database.close(),
  } as unknown as Pool;
  const { migrateDatabase } =
    await import("../../apps/api/src/database/migrations");
  await migrateDatabase();
  const password = await bcrypt.hash("Test-only-123!", 4);
  const store = await database.query<{ id: string }>(
    "INSERT INTO stores(name,mobile,city,state) VALUES('Test Laundry','9000000001','Pune','Maharashtra') RETURNING id",
  );
  const storeId = store.rows[0].id;
  const identities: Record<string, string> = {};
  for (const [role, mobile, name] of [
    ["admin", "9000000000", "Test Admin"],
    ["customer", "9000000002", "Test Customer"],
    ["store_manager", "9000000003", "Test Manager"],
    ["staff", "9000000004", "Test Staff"],
  ]) {
    const user = await database.query<{ id: string }>(
      "INSERT INTO app_users(email,mobile,password_hash,name,designation,role,status) VALUES($1,$2,$3,$4,$5,$5,'active') RETURNING id",
      [`${role}@test.invalid`, mobile, password, name, role],
    );
    identities[role] = user.rows[0].id;
  }
  await database.query(
    "INSERT INTO customers(store_id,full_name,mobile,whatsapp,house_flat_no,street_area,city,pincode,rate_card,user_id) VALUES($1,'Test Customer','9000000002','9000000002','12','Market Road','Pune','411001','Standard',$2)",
    [storeId, identities.customer],
  );
  await database.query(
    "INSERT INTO store_team_members(store_id,name,mobile,role,status,user_id) VALUES($1,'Test Manager','9000000003','manager','active',$2)",
    [storeId, identities.store_manager],
  );
  const category = await database.query<{ id: number }>(
    "SELECT id FROM garment_categories ORDER BY id LIMIT 1",
  );
  const garment = await database.query<{ id: number }>(
    "INSERT INTO garments(category_id,name,short_code,image_path) VALUES($1,'Test Shirt','TSHIRT','/service-icons/wash-and-iron-shirt.png') RETURNING id",
    [category.rows[0].id],
  );
  const service = await database.query<{ id: number }>(
    "INSERT INTO services(name,slug) VALUES('Wash and iron','test-wash-iron') RETURNING id",
  );
  const mapping = await database.query<{ id: number }>(
    "INSERT INTO garment_service_mappings(garment_id,service_id,price) VALUES($1,$2,50) RETURNING id",
    [garment.rows[0].id, service.rows[0].id],
  );
  const tariff = await database.query<{ id: number }>(
    "INSERT INTO rate_card_groups(name,tariff_code) VALUES('Test Price List','TEST-001') RETURNING id",
  );
  await database.query(
    "INSERT INTO rate_card_group_rates(group_id,mapping_id,price) VALUES($1,$2,50)",
    [tariff.rows[0].id, mapping.rows[0].id],
  );
  const dryClean = await database.query<{ id: number }>(
    "INSERT INTO services(name,slug) VALUES('Dry clean','test-dry-clean') RETURNING id",
  );
  const dryMapping = await database.query<{ id: number }>(
    "INSERT INTO garment_service_mappings(garment_id,service_id,price) VALUES($1,$2,80) RETURNING id",
    [garment.rows[0].id, dryClean.rows[0].id],
  );
  await database.query(
    "INSERT INTO rate_card_group_rates(group_id,mapping_id,price) VALUES($1,$2,80)",
    [tariff.rows[0].id, dryMapping.rows[0].id],
  );
  const women = await database.query<{ id: number }>(
    "SELECT id FROM garment_categories WHERE name='Women'",
  );
  for (const [categoryId, name, code, unit, price] of [
    [women.rows[0].id, "Test Saree", "TSAREE", "piece", 120],
    [category.rows[0].id, "Test Laundry", "TLAUNDRY", "kg", 60],
  ] as const) {
    const item = await database.query<{ id: number }>(
      "INSERT INTO garments(category_id,name,short_code,default_pricing_unit) VALUES($1,$2,$3,$4) RETURNING id",
      [categoryId, name, code, unit],
    );
    const itemMapping = await database.query<{ id: number }>(
      "INSERT INTO garment_service_mappings(garment_id,service_id,price,pricing_unit) VALUES($1,$2,$3,$4) RETURNING id",
      [item.rows[0].id, service.rows[0].id, price, unit],
    );
    await database.query(
      "INSERT INTO rate_card_group_rates(group_id,mapping_id,price,pricing_unit) VALUES($1,$2,$3,$4)",
      [tariff.rows[0].id, itemMapping.rows[0].id, price, unit],
    );
  }
  await database.query(
    "INSERT INTO store_rate_card_assignments(store_id,group_id) VALUES($1,$2)",
    [storeId, tariff.rows[0].id],
  );
  const customer = await database.query<{ id: number }>(
    "SELECT id FROM customers WHERE user_id=$1",
    [identities.customer],
  );
  const bookingInput = {
    customerId: String(customer.rows[0].id),
    tariffId: Number(tariff.rows[0].id),
    bookingType: "general" as const,
    pickupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    paymentMethod: "cash" as const,
    instructions: "",
    idempotencyKey: "fixture-preview-booking-001",
    items: [
      {
        garmentId: Number(garment.rows[0].id),
        serviceId: Number(service.rows[0].id),
        quantity: 2,
        packingType: "",
        brand: "",
        fabric: "",
        defect: "None",
        color: "",
        remark: "",
      },
    ],
  };
  const { createAdminBooking } =
    await import("../../apps/api/src/services/admin-order-booking");
  await createAdminBooking(bookingInput);
  return {
    database,
    identities,
    storeId,
    migrateDatabase,
    bookingInput,
    queries,
  };
}
