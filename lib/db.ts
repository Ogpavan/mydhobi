import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

declare global {
  // eslint-disable-next-line no-var
  var mydhobiPool: Pool | undefined;
}

export const pool =
  globalThis.mydhobiPool ??
  new Pool({
    connectionString,
    max: 10,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.mydhobiPool = pool;
}
