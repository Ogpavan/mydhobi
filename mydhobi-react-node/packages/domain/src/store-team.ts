export type StoreTeamRole = string;
export type StoreTeamStatus = "active" | "disabled";
export type StoreTeamMember = {
  id: string;
  storeId: string;
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  userId: string | null;
  createdAt: string;
};
export type StoreTeamPayload = {
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  password?: string;
};
type StoreTeamRow = {
  id: string;
  store_id: string;
  name: string;
  mobile: string;
  email: string;
  role: StoreTeamRole;
  status: StoreTeamStatus;
  user_id: string | null;
  created_at: Date;
};
