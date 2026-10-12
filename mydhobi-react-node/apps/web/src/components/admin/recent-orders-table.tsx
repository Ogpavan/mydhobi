import Link from "@/platform/navigation";
import { Paper, Typography } from "@mui/material";
import { Eye } from "lucide-react";

import { PaymentBadge } from "@/components/admin/payment-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RecentOrder } from "@/lib/admin-dashboard-types";

type RecentOrdersTableProps = {
  orders: RecentOrder[];
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (!orders.length)
    return (
      <Paper sx={{ p: 2 }}>
        <Typography component="h2" variant="h3">
          Recent orders
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No orders yet.
        </Typography>
      </Paper>
    );
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <Table className="min-w-[940px]">
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-slate-950">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-normal text-slate-700">
                    {order.customer}
                  </TableCell>
                  <TableCell className="font-normal text-slate-600">
                    {order.service}
                  </TableCell>
                  <TableCell className="font-normal text-slate-600">
                    {order.pickupDate}
                  </TableCell>
                  <TableCell className="font-normal text-slate-600">
                    {order.deliveryDate}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={order.payment} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-950">
                    {order.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
