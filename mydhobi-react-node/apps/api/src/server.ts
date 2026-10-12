import { createApp } from "./app";
import { SCHEMA_VERSION } from "./database/migrations";
import { pool } from "./services/db";

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT is not valid.");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters.");
try {
  const result = await pool.query(
    "SELECT version FROM mydhobi_schema_versions WHERE version=$1",
    [SCHEMA_VERSION],
  );
  if (!result.rows.length) throw new Error("Migration required.");
} catch {
  await pool.end();
  throw new Error(
    "Database is not ready. Check DATABASE_URL and run npm run db:migrate.",
  );
}
const host =
  process.env.HOST ??
  (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const server = createApp().listen(port, host, () =>
  console.info(`MyDhobi API: http://localhost:${port}`),
);
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
