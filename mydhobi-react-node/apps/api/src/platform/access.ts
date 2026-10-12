import { parse } from "cookie";
import type { RequestHandler } from "express";
import { JWT_COOKIE_NAME, verifyAuthToken } from "../services/auth";

const managerApis = [
  "/api/admin/page-data",
  "/api/admin/orders",
  "/api/admin/customers",
  "/api/admin/pickups",
  "/api/admin/deliveries",
  "/api/admin/riders",
  "/api/admin/payments",
  "/api/admin/offers",
  "/api/admin/reports",
  "/api/admin/complaints",
  "/api/admin/alerts",
  "/api/admin/profile",
  "/api/customers",
  "/api/inventory",
  "/api/developer/sidebar-icons",
  "/api/auth",
];
export function managerCanAccess(path: string, storeId?: string | null) {
  const routes = [
    ...managerApis,
    ...(storeId ? [`/api/stores/${storeId}/team`] : []),
  ];
  return routes.some((route) => path === route || path.startsWith(route + "/"));
}
export const enforceAccess: RequestHandler = async (req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  const token = parse(req.headers.cookie ?? "")[JWT_COOKIE_NAME];
  const user = token ? await verifyAuthToken(token) : null;
  const publicApi =
    req.path === "/api/health" ||
    req.path.startsWith("/api/auth/") ||
    req.path.startsWith("/api/service-catalog-images/");
  if (!user && !publicApi) {
    res.status(401).json({ message: "Please sign in." });
    return;
  }
  if (
    user?.role === "store_manager" &&
    !managerCanAccess(req.path, user.storeId)
  ) {
    res.status(403).json({ message: "You do not have access to this page." });
    return;
  }
  if (
    user?.role === "customer" &&
    !publicApi &&
    !req.path.startsWith("/api/customer/")
  ) {
    res.status(403).json({ message: "You do not have access to this page." });
    return;
  }
  next();
};
