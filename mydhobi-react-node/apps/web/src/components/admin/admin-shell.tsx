import { navItems } from "@/app/navigation";
import { SidebarItemIcon } from "./sidebar-item-icon";
import type { AuthUser } from "@/lib/auth";
import type { SidebarSetting } from "@/lib/sidebar-settings-types";
import { apiFetch } from "@/platform/http";
import { toast } from "@/platform/notifications";
import { queryClient, requestJson } from "@/platform/query-client";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu as MenuIcon,
  Search,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const permissionKeys: Record<string, string> = {
  store: "stores",
  services: "services",
};
const managerSections = new Set([
  "dashboard",
  "orders",
  "customers",
  "pickups",
  "deliveries",
  "inventory",
  "riders",
  "payments",
  "offers",
  "complaints",
  "reports",
  "settings",
]);

export function AdminShell({
  children,
  user,
  sidebarItems,
  allowedPageKeys = [],
}: {
  children: ReactNode;
  user: AuthUser;
  sidebarItems: SidebarSetting[];
  allowedPageKeys?: string[];
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const desktop = useMediaQuery(useTheme().breakpoints.up("lg"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [groups, setGroups] = useState<string[]>(() =>
    navItems
      .filter((item) => location.pathname.startsWith(item.href))
      .map((item) => item.key),
  );
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [alertAnchor, setAlertAnchor] = useState<HTMLElement | null>(null);
  const alerts = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: ({ signal }) =>
      requestJson<{
        alerts: Array<{
          id: string;
          title: string;
          message: string;
          href: string;
        }>;
      }>("/api/admin/alerts", signal),
    enabled: Boolean(alertAnchor),
  });
  const width = collapsed && desktop ? 76 : 248;
  const allLinks = navItems.flatMap((item) => [
    { href: item.href, title: item.title },
    ...(item.children ?? []),
  ]);
  const exact = allLinks.find((item) => item.href === location.pathname);
  const title =
    location.pathname === "/developer"
      ? "Menu settings"
      : location.pathname === "/admin/search"
        ? "Search"
        : (exact?.title ??
          (location.pathname.endsWith("/edit")
            ? "Edit store"
            : location.pathname === "/admin/store/create"
              ? "New store"
              : location.pathname.startsWith("/admin/orders/")
                ? "Order details"
                : location.pathname.startsWith("/admin/rate-card/")
                  ? "Edit tariffs"
                  : "Details"));
  const visible = navItems.filter(
    (item) =>
      (user.role !== "store_manager" || managerSections.has(item.key)) &&
      (user.role === "admin" ||
        item.key === "settings" ||
        allowedPageKeys.includes(permissionKeys[item.key] ?? item.key)),
  );
  async function signOut() {
    setSigningOut(true);
    try {
      const response = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      queryClient.clear();
      navigate("/", { replace: true });
    } catch {
      toast.error("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }
  function search(event: FormEvent) {
    event.preventDefault();
    navigate(`/admin/search?q=${encodeURIComponent(query.trim())}`);
  }
  const navigation = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowX: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed && desktop ? "center" : "flex-start"}
        sx={{ height: 64, px: collapsed && desktop ? 1 : 2.5, flexShrink: 0 }}
      >
        <Box
          component="img"
          src="/mydhobi_logo.png"
          alt="MyDhobi"
          sx={{
            display: "block",
            width: collapsed && desktop ? 48 : 168,
            height: 42,
            objectFit: "contain",
          }}
        />
      </Stack>
      <Divider />
      <List
        component="nav"
        aria-label="Main menu"
        dense
        sx={{ flex: 1, overflowY: "auto", py: 1, px: 1 }}
      >
        {visible.map((item) => {
          const selected =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");
          const label =
            sidebarItems.find((setting) => setting.key === item.key)?.label ??
            item.title;
          const children = item.children?.filter(
            (child) =>
              (!child.adminOnly || user.role === "admin") &&
              (user.role !== "store_manager" ||
                item.key !== "settings" ||
                child.href.endsWith("/profile")) &&
              (item.key !== "settings" ||
                child.href.endsWith("/profile") ||
                user.role === "admin" ||
                allowedPageKeys.includes("basic-setup")),
          );
          return (
            <Box key={item.key}>
              <Tooltip
                title={collapsed && desktop ? label : ""}
                placement="right"
              >
                <ListItemButton
                  component={Link}
                  to={
                    user.role === "store_manager" && item.key === "settings"
                      ? "/admin/settings/profile"
                      : item.href
                  }
                  selected={selected}
                  aria-label={label}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => {
                    setMobileOpen(false);
                    if (children?.length)
                      setGroups((value) =>
                        value.includes(item.key) ? value : [...value, item.key],
                      );
                  }}
                  sx={{
                    borderRadius: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    minHeight: 41,
                    mb: 0.25,
                    px: 1.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: selected ? "primary.main" : "text.secondary",
                    }}
                  >
                    <SidebarItemIcon
                      itemKey={item.key}
                      collapsed={collapsed && desktop}
                    />
                  </ListItemIcon>
                  {(!collapsed || !desktop) && (
                    <>
                      <ListItemText primary={label} />
                      {children?.length ? <ChevronRight size={15} /> : null}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
              {children && (!collapsed || !desktop) && (
                <Collapse in={groups.includes(item.key) || selected}>
                  <List disablePadding dense>
                    {children.map((child) => (
                      <ListItemButton
                        key={child.href}
                        component={Link}
                        to={child.href}
                        selected={location.pathname === child.href}
                        onClick={() => setMobileOpen(false)}
                        sx={{ pl: 6, py: 0.5, borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={child.title}
                          slotProps={{ primary: { fontSize: 12 } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
        {user.role === "admin" && (!collapsed || !desktop) && (
          <ListItemButton
            component={Link}
            to="/developer"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>
              <SidebarItemIcon itemKey="settings" />
            </ListItemIcon>
            <ListItemText primary="Menu settings" />
          </ListItemButton>
        )}
      </List>
      <Divider />
      <Tooltip title="Sign out">
        <Button
          startIcon={<LogOut size={17} />}
          loading={signingOut}
          onClick={signOut}
          sx={{ m: 1 }}
        >
          {(!collapsed || !desktop) && "Sign out"}
        </Button>
      </Tooltip>
    </Box>
  );
  return (
    <Box sx={{ minHeight: "100dvh", minWidth: 0 }}>
      <Drawer
        className="admin-print-hidden"
        variant={desktop ? "permanent" : "temporary"}
        open={desktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width, boxSizing: "border-box" } } }}
      >
        {navigation}
      </Drawer>
      <Box sx={{ ml: desktop ? `${width}px` : 0, minWidth: 0 }}>
        <AppBar
          className="admin-print-hidden"
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: "64px !important" }}>
            <Tooltip title="Toggle menu">
              <IconButton
                aria-label="Toggle menu"
                onClick={() =>
                  desktop
                    ? setCollapsed((value) => !value)
                    : setMobileOpen(true)
                }
              >
                <MenuIcon size={21} />
              </IconButton>
            </Tooltip>
            <Typography
              component="h1"
              variant="h3"
              noWrap
              sx={{ flex: 1, minWidth: 0 }}
            >
              {title}
            </Typography>
            <Box
              component="form"
              onSubmit={search}
              sx={{ width: 225, display: { xs: "none", md: "block" } }}
            >
              <TextField
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                slotProps={{
                  htmlInput: { "aria-label": "Search" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={17} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <Tooltip title="Alerts">
              <IconButton
                aria-label="Alerts"
                onClick={(event) => setAlertAnchor(event.currentTarget)}
              >
                <Bell size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="My profile">
              <IconButton
                component={Link}
                to="/admin/settings/profile"
                aria-label="My profile"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    bgcolor: "primary.main",
                  }}
                >
                  {user.name.slice(0, 1)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          className="admin-print-main"
          sx={{
            p: { xs: 1.5, md: 2.5 },
            minWidth: 0,
            minHeight: "calc(100dvh - 64px)",
            overflowX: "clip",
            backgroundColor: "#F3F4F6",
          }}
        >
          {children}
        </Box>
      </Box>
      <Menu
        anchorEl={alertAnchor}
        open={Boolean(alertAnchor)}
        onClose={() => setAlertAnchor(null)}
        slotProps={{
          paper: { sx: { width: 340, maxWidth: "calc(100vw - 24px)" } },
        }}
      >
        {alerts.isPending ? (
          <Box p={2}>
            <LinearProgress aria-label="Loading alerts" />
          </Box>
        ) : alerts.error ? (
          <MenuItem onClick={() => void alerts.refetch()}>
            Unable to load. Retry
          </MenuItem>
        ) : !alerts.data?.alerts.length ? (
          <MenuItem disabled>No alerts</MenuItem>
        ) : (
          alerts.data.alerts.map((item) => (
            <MenuItem
              key={item.id}
              component={Link}
              to={item.href}
              onClick={() => setAlertAnchor(null)}
              sx={{ whiteSpace: "normal" }}
            >
              <ListItemText primary={item.title} secondary={item.message} />
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
