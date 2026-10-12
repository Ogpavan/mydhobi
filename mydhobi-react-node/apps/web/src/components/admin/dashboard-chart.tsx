import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
export function DashboardChart({
  data,
}: {
  data: Array<{ day: string; orders: number }>;
}) {
  const totalOrders = data.reduce((total, day) => total + day.orders, 0);
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <Typography component="h2" variant="h3">
          Orders overview
        </Typography>
        <Chip
          label={`${totalOrders} ${totalOrders === 1 ? "order" : "orders"}`}
        />
      </Stack>
      <Box sx={{ height: 230, minWidth: 0 }}>
        <BarChart
          height={230}
          xAxis={[{ data: data.map((day) => day.day), scaleType: "band" }]}
          series={[
            {
              data: data.map((day) => day.orders),
              label: "Orders",
              color: "#075DFF",
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: Math.max(5, ...data.map((day) => day.orders)),
              tickMinStep: 1,
              valueFormatter: (value: number) => String(Math.round(value)),
            },
          ]}
          hideLegend
          skipAnimation
          borderRadius={3}
          grid={{ horizontal: true }}
        />
      </Box>
    </Paper>
  );
}
