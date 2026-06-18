"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import type { Order } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/laundry/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminOrderTable({ orders }: { orders: Order[] }) {
  const [rows, setRows] = useState(orders);

  function updateStatus(id: string, status: OrderStatus) {
    setRows((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    toast.success("Order status updated", { description: `#${id} is now ${ORDER_STATUS_META[status].label}.` });
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/60">
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="min-w-52">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-extrabold">#{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.serviceName}</TableCell>
                <TableCell><StatusBadge status={order.status} /></TableCell>
                <TableCell className="font-bold text-accent">{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}>
                    <SelectTrigger className="h-10 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{ORDER_STATUS_META[status].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
