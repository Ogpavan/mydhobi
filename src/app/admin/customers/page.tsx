"use client";

import { Mail, Phone, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customers } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function AdminCustomersPage() {
  return (
    <AdminShell className="space-y-8">
      <PageHeader eyebrow="Customer management" title="Customer profiles and value" description="View customer contact details, loyalty tier, order count, and total spend for support workflows." actions={<Button variant="accent">Add Customer</Button>} />
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-11" placeholder="Search customers" />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id} className="p-5">
            <div className="flex items-center gap-4">
              <Avatar><AvatarImage src={customer.avatarUrl} alt={customer.name} /><AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div><p className="font-extrabold text-foreground">{customer.name}</p><p className="text-sm text-muted-foreground">{customer.loyaltyTier} member</p></div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Phone className="size-4 text-primary" />{customer.phone}</p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-primary" />{customer.email}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/60"><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Orders</TableHead><TableHead>Total Spend</TableHead><TableHead>Tier</TableHead></TableRow></TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}><TableCell className="font-extrabold">{customer.name}</TableCell><TableCell>{customer.phone}</TableCell><TableCell>{customer.ordersCount}</TableCell><TableCell className="font-bold text-accent">{formatCurrency(customer.totalSpend)}</TableCell><TableCell>{customer.loyaltyTier}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}
