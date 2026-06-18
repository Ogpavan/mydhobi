"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LaundryIllustration } from "@/components/laundry/laundry-illustration";
import { ServiceCard } from "@/components/laundry/service-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { services } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

const highlights = [
  { icon: Clock3, label: "24h turnaround", text: "Fast pickup, cleaning, and delivery for everyday garments." },
  { icon: ShieldCheck, label: "Premium care", text: "Sorted workflows for delicate, home, and office wear." },
  { icon: Truck, label: "Doorstep delivery", text: "Live updates from pickup assignment to delivery." },
];

const steps = [
  { title: "Choose service", text: "Pick wash, iron, dry clean, or repair from a refined service catalog." },
  { title: "Schedule pickup", text: "Select a pickup slot and share any fabric care notes." },
  { title: "Track delivery", text: "Follow every status update until your clothes arrive fresh." },
];

export default function Home() {
  return (
    <AppShell showMobileNav={false} className="space-y-16 pb-12">
      <section className="grid items-center gap-8 overflow-hidden rounded-md bg-primary p-5 text-primary-foreground shadow-soft md:grid-cols-[1.05fr_0.95fr] md:p-8 lg:p-10">
        <div className="relative z-10 max-w-2xl py-4 md:py-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-white/12 px-4 py-2 text-sm font-bold text-emerald-50">
            <Sparkles className="size-4 text-orange-300" /> Modern laundry care
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Clean clothes, delivered fast</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-emerald-50/85 sm:text-lg">
            Premium pickup laundry built for busy homes. Book doorstep service, track every step, and get fresh clothes back without friction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href="/book">Book Pickup <ArrowRight className="size-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/25 bg-white/10 text-white hover:bg-white/18">
              <Link href="#services">View Services</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-md bg-white/10 p-4">
                <item.icon className="mb-3 size-5 text-orange-300" />
                <p className="font-extrabold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-50/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <LaundryIllustration />
      </section>

      <section id="services" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-extrabold text-primary">Service highlights</p>
            <h2 className="mt-2 text-3xl font-extrabold text-foreground">Laundry care for every fabric</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="relative overflow-hidden bg-primary p-7 text-primary-foreground">
          <div className="organic-blob absolute -right-10 -top-14 size-44 bg-white/12" />
          <PackageCheck className="relative z-10 size-9 text-orange-300" />
          <h2 className="relative z-10 mt-5 text-3xl font-extrabold">How it works</h2>
          <p className="relative z-10 mt-3 max-w-md leading-7 text-emerald-50/85">A mobile-app-like ordering flow adapted for web, with clean service selection and a live order journey.</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="p-6">
              <span className="grid size-11 place-items-center rounded-md bg-orange-100 text-sm font-extrabold text-orange-700">0{index + 1}</span>
              <h3 className="mt-5 text-lg font-extrabold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm font-extrabold text-primary">Pricing preview</p>
          <h2 className="mt-2 text-3xl font-extrabold text-foreground">Transparent starting prices</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Card key={service.id} className="p-6">
              <p className="font-extrabold text-foreground">{service.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.turnaround} standard turnaround</p>
              <p className="mt-6 text-3xl font-extrabold text-accent">{formatCurrency(service.priceFrom)}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">starting per item</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-4 border-t border-border py-8 text-sm text-muted-foreground md:flex-row md:items-center">
        <p>(c) 2026 Cleanly Laundry Service. Mock production-ready starter.</p>
        <div className="flex gap-4 font-bold text-foreground">
          <Link href="/login">Login</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/orders">Orders</Link>
        </div>
      </footer>
    </AppShell>
  );
}
