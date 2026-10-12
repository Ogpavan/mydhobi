import bcrypt from "bcryptjs";
import { pool } from "../services/db";
const mobile = process.env.ADMIN_MOBILE ?? "";
const name = process.env.ADMIN_NAME?.trim() ?? "";
const password = process.env.ADMIN_PASSWORD ?? "";
try {
  if (!/^\d{10}$/.test(mobile))
    throw new Error("Set ADMIN_MOBILE to exactly 10 digits.");
  if (name.length < 2 || name.length > 100)
    throw new Error("Set ADMIN_NAME to 2–100 characters.");
  if (password.length < 12)
    throw new Error("Set ADMIN_PASSWORD to at least 12 characters.");
  await pool.query(
    "INSERT INTO app_users(name,email,mobile,password_hash,designation,role,status) VALUES($1,$2,$3,$4,'Admin','admin','active')",
    [
      name,
      `admin.${mobile}@mydhobi.local`,
      mobile,
      await bcrypt.hash(password, 12),
    ],
  );
  console.info("Admin account created.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unable to create admin.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
