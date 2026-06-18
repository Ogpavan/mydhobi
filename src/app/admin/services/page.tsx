"use client";

import { Edit3, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceCard } from "@/components/laundry/service-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { services } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function AdminServicesPage() {
  return (
    <AdminShell className="space-y-8">
      <PageHeader eyebrow="Services and pricing" title="Manage laundry catalog" description="Keep service cards, turnaround expectations, and item-level pricing ready for customer booking." actions={<Button variant="accent"><Plus className="size-4" /> Add Service</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => <ServiceCard key={service.id} service={service} compact />)}
      </div>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 p-5">
          <div><p className="text-sm font-extrabold text-primary">Pricing matrix</p><h2 className="text-2xl font-extrabold text-foreground">Item pricing</h2></div>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline"><Edit3 className="size-4" /> Edit Pricing</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Update service pricing</DialogTitle><DialogDescription>This mock dialog demonstrates the shadcn dialog setup. Database persistence can be wired later.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-2"><div className="space-y-2"><Label htmlFor="serviceName">Service</Label><Input id="serviceName" defaultValue="Wash & Iron" /></div><div className="space-y-2"><Label htmlFor="price">Starting price</Label><Input id="price" defaultValue="25" /></div></div>
              <DialogFooter><Button variant="accent">Save Changes</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/60"><TableRow><TableHead>Service</TableHead><TableHead>Turnaround</TableHead><TableHead>Start Price</TableHead><TableHead>Common Items</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}><TableCell className="font-extrabold">{service.name}</TableCell><TableCell>{service.turnaround}</TableCell><TableCell className="font-bold text-accent">{formatCurrency(service.priceFrom)}</TableCell><TableCell>{service.items.slice(0, 3).map((item) => item.name).join(", ")}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AdminShell>
  );
}
