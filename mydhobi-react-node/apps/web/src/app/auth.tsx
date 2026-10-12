import { CustomerThemeSync } from "@/components/customer/customer-theme-sync";
import type { AuthUser } from "@/lib/auth";
import type { SidebarSetting } from "@/lib/sidebar-settings-types";
import { queryClient, requestJson } from "@/platform/query-client";
import { Alert, Box, Button, LinearProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
const AdminShell = lazy(() =>
  import("@/components/admin/admin-shell").then((module) => ({
    default: module.AdminShell,
  })),
);
export type Bootstrap = {
  user: AuthUser;
  sidebarItems: SidebarSetting[];
  allowedPageKeys: string[];
};
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: ({ signal }) =>
      requestJson<Bootstrap>("/api/auth/bootstrap", signal),
    retry: false,
    staleTime: 60000,
  });
}
export function SessionEvents() {
  const navigate = useNavigate();
  useEffect(() => {
    const expired = () => {
      localStorage.removeItem('mydhobi_ordering');
      queryClient.clear();
      navigate("/", { replace: true });
    };
    window.addEventListener("mydhobi:session-expired", expired);
    return () => window.removeEventListener("mydhobi:session-expired", expired);
  }, [navigate]);
  return null;
}
export function ProtectedLayout({
  children,
  area,
}: {
  children: ReactNode;
  area: "admin" | "customer" | "developer";
}) {
  const session = useSession();
  const location = useLocation();
  if (session.isPending) return <LinearProgress aria-label="Loading account" />;
  if (session.error)
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={<Button onClick={() => void session.refetch()}>Retry</Button>}
        >
          {session.error.message}
        </Alert>
      </Box>
    );
  if (!session.data)
    return (
      <Navigate
        to={`/?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const { user, sidebarItems, allowedPageKeys } = session.data;
  if (area === "customer" && user.role !== "customer")
    return <Navigate to="/admin/dashboard" replace />;
  if (area !== "customer" && user.role === "customer")
    return <Navigate to="/customer" replace />;
  if (area === "developer" && user.role !== "admin")
    return <Navigate to="/admin/dashboard" replace />;
  if (area === "customer")
    return (
      <Box className="customer-app">
        <CustomerThemeSync />
        {children}
      </Box>
    );
  return (
    <AdminShell
      user={user}
      sidebarItems={sidebarItems}
      allowedPageKeys={allowedPageKeys}
    >
      {children}
    </AdminShell>
  );
}
