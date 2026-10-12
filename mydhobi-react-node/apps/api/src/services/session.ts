import { currentRequest } from "@/server/request-context";
import { parse } from "cookie";

import { JWT_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getStoreMembershipByUserId } from "@/lib/store-team";
import { getUserById } from "@/lib/users";

export async function getCurrentUser() {
  const cookieStore = parse(currentRequest().headers.get("cookie") ?? "");
  const token = cookieStore[JWT_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const tokenUser = await verifyAuthToken(token);

  if (!tokenUser) {
    return null;
  }

  const dbUser = await getUserById(tokenUser.id);

  if (!dbUser || dbUser.status !== "active") {
    return null;
  }

  const membership =
    dbUser.role === "store_manager"
      ? await getStoreMembershipByUserId(dbUser.id)
      : null;
  if (
    dbUser.role === "store_manager" &&
    (!membership ||
      membership.status !== "active" ||
      membership.role !== "manager")
  ) {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    mobile: dbUser.mobile,
    name: dbUser.name,
    designation: dbUser.designation,
    role: dbUser.role,
    storeId: membership?.storeId ?? null,
  };
}
