"use client";

import { Mail, MapPin, Phone, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { customers } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function ProfilePage() {
  const customer = customers[0];

  return (
    <AppShell className="space-y-8">
      <PageHeader eyebrow="Customer profile" title="Account and preferences" description="Manage customer details, saved address, loyalty tier, and payment defaults for the mock login user." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="p-6 text-center">
          <Avatar className="mx-auto size-24 border-4 border-white shadow-soft">
            <AvatarImage src={customer.avatarUrl} alt={customer.name} />
            <AvatarFallback>PS</AvatarFallback>
          </Avatar>
          <h2 className="mt-5 text-2xl font-extrabold text-foreground">{customer.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{customer.loyaltyTier} member</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-secondary p-4"><p className="text-2xl font-extrabold text-primary">{customer.ordersCount}</p><p className="text-xs font-bold text-muted-foreground">Orders</p></div>
            <div className="rounded-md bg-secondary p-4"><p className="text-2xl font-extrabold text-primary">{formatCurrency(customer.totalSpend)}</p><p className="text-xs font-bold text-muted-foreground">Spend</p></div>
          </div>
          <Button variant="accent" className="mt-6 w-full">Edit Profile</Button>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <h3 className="text-xl font-extrabold text-foreground">Contact details</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border p-4"><Phone className="mb-3 size-5 text-primary" /><p className="font-bold">Phone</p><p className="mt-1 text-sm text-muted-foreground">{customer.phone}</p></div>
              <div className="rounded-md border border-border p-4"><Mail className="mb-3 size-5 text-primary" /><p className="font-bold">Email</p><p className="mt-1 text-sm text-muted-foreground">{customer.email}</p></div>
              <div className="rounded-md border border-border p-4 md:col-span-2"><MapPin className="mb-3 size-5 text-primary" /><p className="font-bold">Default address</p><p className="mt-1 text-sm text-muted-foreground">{customer.address}</p></div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-extrabold text-foreground">Preferences</h3>
            <Separator className="my-5" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-4 rounded-md bg-secondary/70 p-4"><ShieldCheck className="size-5 text-primary" /><div><p className="font-bold">Fabric alerts</p><p className="mt-1 text-sm text-muted-foreground">Notify before dry-cleaning delicate garments.</p></div></div>
              <div className="flex items-start gap-4 rounded-md bg-secondary/70 p-4"><Wallet className="size-5 text-primary" /><div><p className="font-bold">Payment</p><p className="mt-1 text-sm text-muted-foreground">UPI preferred, cash enabled at delivery.</p></div></div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
