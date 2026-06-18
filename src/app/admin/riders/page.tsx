"use client";

import { Bike, Phone, Star, Truck } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { riders } from "@/lib/mock-data";

function riderBadge(status: string) {
  if (status === "Available") return <Badge variant="success">Available</Badge>;
  if (status === "On Route") return <Badge variant="accent">On Route</Badge>;
  return <Badge variant="outline">Offline</Badge>;
}

export default function AdminRidersPage() {
  return (
    <AdminShell className="space-y-8">
      <PageHeader eyebrow="Pickup and delivery staff" title="Rider assignment board" description="Monitor staff zones, route load, ratings, and availability for pickup and delivery planning." actions={<Button variant="accent"><Truck className="size-4" /> Assign Rider</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {riders.map((rider) => (
          <Card key={rider.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-md bg-secondary text-primary"><Bike className="size-6" /></span>
              {riderBadge(rider.status)}
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-foreground">{rider.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{rider.zone}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-secondary p-3"><p className="text-xl font-extrabold text-primary">{rider.activeOrders}</p><p className="text-xs font-bold text-muted-foreground">Active</p></div>
              <div className="rounded-md bg-secondary p-3"><p className="text-xl font-extrabold text-primary">{rider.rating}</p><p className="text-xs font-bold text-muted-foreground">Rating</p></div>
            </div>
          </Card>
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/60"><TableRow><TableHead>Rider</TableHead><TableHead>Phone</TableHead><TableHead>Zone</TableHead><TableHead>Active Orders</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {riders.map((rider) => (
                <TableRow key={rider.id}><TableCell className="font-extrabold">{rider.name}</TableCell><TableCell><span className="flex items-center gap-2"><Phone className="size-4 text-primary" />{rider.phone}</span></TableCell><TableCell>{rider.zone}</TableCell><TableCell>{rider.activeOrders}</TableCell><TableCell><span className="flex items-center gap-1"><Star className="size-4 fill-orange-400 text-orange-400" />{rider.rating}</span></TableCell><TableCell>{riderBadge(rider.status)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}
