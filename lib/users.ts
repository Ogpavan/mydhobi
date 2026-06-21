import { pool } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";

export type DbUser = AuthUser & {
  passwordHash: string;
  status: "active" | "disabled";
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  designation: string;
  role: "admin" | "staff";
  status: "active" | "disabled";
};

function mapUser(row: UserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    designation: row.designation,
    role: row.role,
    status: row.status,
  };
}

export async function getUserByEmail(email: string) {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, designation, role, status
     FROM app_users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserById(id: string) {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, designation, role, status
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}
