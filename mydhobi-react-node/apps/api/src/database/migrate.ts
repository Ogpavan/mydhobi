import { pool } from "../services/db";
import { migrateDatabase } from "./migrations";
try {
  await migrateDatabase();
  console.info("Database is ready.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
