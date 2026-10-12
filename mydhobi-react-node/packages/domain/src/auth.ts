export type AuthUser = {
  id: string;
  email: string;
  mobile: string;
  name: string;
  designation: string;
  role: "admin" | "staff" | "store_manager" | "customer";
  storeId?: string | null;
};
