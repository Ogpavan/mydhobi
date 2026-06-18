"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PriceSummary } from "@/components/laundry/price-summary";
import { QuantitySelector } from "@/components/laundry/quantity-selector";
import { ServiceCard } from "@/components/laundry/service-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PICKUP_SLOTS, type ServiceId } from "@/lib/constants";
import { services } from "@/lib/mock-data";
import { useBookingStore } from "@/store/booking-store";

export default function BookPage() {
  const router = useRouter();
  const store = useBookingStore();
  const selectedService = services.find((service) => service.id === store.selectedServiceId) ?? services[0];
  const selectedItems = useMemo(
    () => selectedService.items.filter((item) => (store.quantities[item.id] ?? 0) > 0),
    [selectedService, store.quantities],
  );
  const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * (store.quantities[item.id] ?? 0), 0);
  const deliveryCharge = subtotal > 499 || subtotal === 0 ? 0 : 25;
  const total = subtotal + deliveryCharge;
  const totalItems = selectedItems.reduce((sum, item) => sum + (store.quantities[item.id] ?? 0), 0);

  async function placeOrder() {
    if (!totalItems) {
      toast.error("Add at least one item", { description: "Select item quantities before placing an order." });
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        items: selectedItems.map((item) => ({ id: item.id, quantity: store.quantities[item.id] })),
        pickupDate: store.pickupDate,
        pickupSlot: store.pickupSlot,
        address: store.address,
      }),
    });

    if (!response.ok) {
      toast.error("Could not place order", { description: "Please review the booking details." });
      return;
    }

    toast.success("Pickup booked", { description: "Your laundry order has been created." });
    router.push("/orders");
  }

  return (
    <AppShell className="space-y-8">
      <PageHeader
        eyebrow="Book laundry service"
        title="Schedule a fresh pickup"
        description="Select a service, confirm item counts, choose a pickup window, and place your order in one responsive flow."
        actions={<Button variant="accent" onClick={placeOrder}>Place Order</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground">Choose service</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} active={service.id === selectedService.id} compact onClick={() => store.setService(service.id as ServiceId)} />
              ))}
            </div>
          </section>

          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-primary">Add details</p>
                <h2 className="text-2xl font-extrabold text-foreground">Items for {selectedService.name}</h2>
              </div>
              <span className="rounded-md bg-secondary px-4 py-2 text-sm font-extrabold text-primary">{totalItems} items</span>
            </div>
            <div className="space-y-3">
              {selectedService.items.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-md border border-border bg-white p-3 shadow-sm">
                  <span className="grid size-12 place-items-center rounded-md bg-secondary text-primary"><PackageCheck className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-foreground">{item.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{item.category} - ₹{item.unitPrice}</p>
                  </div>
                  <QuantitySelector value={store.quantities[item.id] ?? 0} onChange={(value) => store.setQuantity(item.id, value)} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-extrabold text-primary">Pickup details</p>
              <h2 className="text-2xl font-extrabold text-foreground">Date, slot, and address</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup date</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pickupDate" type="date" className="pl-11" value={store.pickupDate} onChange={(event) => store.setPickupDate(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup slot</Label>
                <Select value={store.pickupSlot} onValueChange={store.setPickupSlot}>
                  <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                  <SelectContent>
                    {PICKUP_SLOTS.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 size-4 text-muted-foreground" />
                  <Textarea id="address" className="pl-11" value={store.address} onChange={(event) => store.setAddress(event.target.value)} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PriceSummary subtotal={subtotal} deliveryCharge={deliveryCharge} total={total} />
          <Button variant="accent" size="lg" className="w-full" onClick={placeOrder} disabled={!totalItems}>Continue / Place Order</Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">Free delivery unlocks above ₹499. Garments are inspected at pickup before final billing.</p>
        </aside>
      </div>
    </AppShell>
  );
}
