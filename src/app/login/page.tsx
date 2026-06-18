"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LaundryIllustration } from "@/components/laundry/laundry-illustration";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  phone: z.string().min(10, "Enter a valid mobile number"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "+91 98765 43210" },
  });

  async function onSubmit(values: LoginValues) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      toast.error("Could not sign in", { description: "Please check your mobile number." });
      return;
    }

    toast.success("Signed in", { description: "Welcome back to Cleanly." });
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative flex min-h-[42vh] items-center justify-center overflow-hidden bg-primary p-6 lg:min-h-screen">
        <div className="organic-blob absolute right-6 top-6 size-44 bg-white/12" />
        <div className="organic-blob absolute -bottom-12 left-12 size-52 bg-emerald-300/15" />
        <div className="relative z-10 w-full max-w-md text-primary-foreground">
          <LaundryIllustration />
          <h1 className="mt-8 text-4xl font-extrabold">Sign in to continue</h1>
          <p className="mt-3 leading-7 text-emerald-50/80">Book, track, and manage every order from one polished dashboard.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-md bg-secondary text-primary"><ShieldCheck className="size-6" /></span>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">Use your mobile number to continue.</p>
            </div>
          </div>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" className="pl-11" {...form.register("phone")} />
              </div>
              {form.formState.errors.phone && <p className="text-sm font-semibold text-destructive">{form.formState.errors.phone.message}</p>}
            </div>
            <Button type="submit" variant="accent" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in with Mobile"}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            <Separator className="flex-1" /> or continue with <Separator className="flex-1" />
          </div>
          <div className="grid gap-3">
            {[
              ["f", "Continue with Facebook"],
              ["G", "Continue with Google"],
              ["A", "Continue with Apple"],
            ].map(([mark, label]) => (
              <Button key={label} variant="outline" className="w-full justify-start gap-4">
                <span className="grid size-7 place-items-center rounded-md bg-secondary text-sm font-extrabold text-primary">{mark}</span>
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to our <Link href="/" className="font-bold text-accent">Terms</Link> and <Link href="/" className="font-bold text-accent">Privacy Policy</Link>.
          </p>
        </Card>
      </section>
    </main>
  );
}
