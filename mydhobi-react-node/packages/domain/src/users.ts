import type { AuthUser } from "./auth";
export type DbUser = AuthUser & {
  passwordHash: string;
  status: "active" | "disabled";
};
type UserRow = {
  id: string;
  email: string;
  mobile: string;
  password_hash: string;
  name: string;
  designation: string;
  role: "admin" | "staff" | "store_manager" | "customer";
  status: "active" | "disabled";
};
