import { useAdminPageData } from "@/components/admin/admin-client-data";
import {
  AdminPageError,
  AdminPageLoading,
} from "@/components/admin/admin-page-state";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import type { OperationOrder } from "@/lib/admin-dashboard-types";
import type { DashboardData } from "@/lib/dashboard";
import {
  Box,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Shirt,
  Truck,
  Wallet,
} from "lucide-react";

function TaskList({
  title,
  orders,
}: {
  title: string;
  orders: OperationOrder[];
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="h3">
          {title}
        </Typography>
        <Chip label={orders.length} />
      </Stack>
      {!orders.length ? (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          No scheduled orders.
        </Typography>
      ) : (
        <List disablePadding>
          {orders.map((order) => (
            <ListItem key={order.id} disableGutters divider>
              <ListItemText
                primary={order.customer}
                secondary={[order.area, order.time].filter(Boolean).join(" · ")}
              />
              <Chip label={order.status} variant="outlined" />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
export function AdminDashboardClient() {
  const result = useAdminPageData<DashboardData>("key=dashboard", 15000);
  if (!result.data)
    return result.error ? (
      <AdminPageError message={result.error} retry={result.retry} />
    ) : (
      <AdminPageLoading />
    );
  const data = result.data;
  const stats = [
    {
      label: "Today pickups",
      value: data.stats.todayPickups.toLocaleString("en-IN"),
      change: data.trends.pickups,
      Icon: Package,
      color: "primary.main",
    },
    {
      label: "Today deliveries",
      value: data.stats.todayDeliveries.toLocaleString("en-IN"),
      change: data.trends.deliveries,
      Icon: Truck,
      color: "success.main",
    },
    {
      label: "Orders in process",
      value: data.stats.ordersInProcess.toLocaleString("en-IN"),
      change: data.trends.orders,
      Icon: Shirt,
      color: "warning.main",
    },
    {
      label: "Pending payments",
      value: `₹${data.stats.pendingPayments.toLocaleString("en-IN")}`,
      change: data.trends.payments,
      Icon: Wallet,
      color: "secondary.main",
    },
  ];
  const total = Math.max(
    1,
    data.orderStatuses.reduce((sum, status) => sum + status.value, 0),
  );
  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            lg: "repeat(4,minmax(0,1fr))",
          },
          gap: 1.5,
        }}
      >
        {stats.map(({ label, value, change, Icon, color }) => (
          <Paper
            variant="outlined"
            key={label}
            sx={{ p: { xs: 1.5, md: 2 }, minWidth: 0 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography fontSize={12} color="text.secondary">
                {label}
              </Typography>
              <Box sx={{ color, display: "flex", flexShrink: 0 }}>
                <Icon size={20} />
              </Box>
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: 24, md: 28 },
                fontWeight: 600,
                color,
                mt: 1,
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mt: 1 }}
            >
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                {change < 0 ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
              </Box>
              <Typography fontSize={11} color="text.secondary">
                {Math.abs(change)}% from yesterday
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0,1fr)",
            lg: "minmax(0,1.5fr) minmax(0,1fr)",
          },
          gap: 2,
        }}
      >
        <DashboardChart data={data.ordersOverview} />
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography component="h2" variant="h3" sx={{ mb: 2 }}>
            Order status
          </Typography>
          <Stack spacing={1.75}>
            {data.orderStatuses.map((status) => (
              <Box key={status.label}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.75 }}
                >
                  <Typography fontSize={12}>{status.label}</Typography>
                  <Typography fontSize={12}>{status.value}</Typography>
                </Stack>
                <LinearProgress
                  aria-label={`${status.label} orders`}
                  variant="determinate"
                  value={(status.value / total) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0,1fr)",
            md: "repeat(2,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        <TaskList title="Today's pickups" orders={data.todayPickups} />
        <TaskList title="Today's deliveries" orders={data.todayDeliveries} />
      </Box>
      <Divider />
      <RecentOrdersTable orders={data.recentOrders} />
    </Stack>
  );
}
