"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Invalid email or password.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");

      router.replace(
        redirectTo?.startsWith("/admin") ? redirectTo : "/admin/dashboard",
      );
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-[#F6F9FF] text-[#071333]">
      <div className="grid h-full w-full overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col overflow-hidden bg-[#F4F8FF] px-5 py-5 sm:px-6 sm:py-6 lg:flex lg:px-8 lg:py-7">
          <Image
            src="/login-illustration.png"
            alt=""
            fill
            priority
            aria-hidden="true"
            className="object-cover object-center opacity-100"
          />
          <div className="absolute inset-0 bg-[#F4F8FF]/18" />
          <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-white/35 blur-3xl" />
          <div className="absolute right-14 top-16 h-16 w-16 rounded-full border border-white/50 bg-white/20 blur-[0.5px]" />
          <div className="absolute right-32 top-28 h-8 w-8 rounded-full border border-[#CFE0FF] bg-white/35" />
          <div className="absolute left-20 top-40 h-10 w-10 rounded-full border border-[#D5E6FF] bg-white/35" />

          <div className="relative z-10 flex items-center gap-3">
            <Image src="/logo.png" alt="MyDhobi logo" width={52} height={52} className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[21px] font-semibold leading-none tracking-normal text-[#0B1E57]">
                MyDhobi
              </p>
              <p className="mt-1 text-[13px] font-normal text-[#5A6B8C]">
                Laundry & Dry Cleaning Management
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-7 hidden max-w-[560px] lg:block">
            <h1 className="max-w-[430px] text-[44px] font-semibold leading-[0.98] tracking-normal text-[#0B1E57] xl:text-[48px]">
              Run your dhobi business easily
            </h1>
            <p className="mt-3 max-w-[500px] text-[14px] font-normal leading-[1.5] text-[#5A6B8C]">
              Manage orders, pickups, deliveries, and payments from one simple dashboard.
            </p>
          </div>

          <div className="relative z-10 flex-1" />
        </section>

        <section className="flex items-center justify-center bg-[#F7FAFF] px-4 py-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[440px] px-2 py-2 sm:px-0 lg:px-0">
            <div className="flex flex-col items-center text-center">
              <h2 className="mt-2 text-[34px] font-semibold leading-[1] tracking-normal text-[#0B1E57]">
                Welcome back
              </h2>
              <p className="mt-2 text-[14px] font-normal text-[#5A6B8C]">
                Sign in to continue to your dashboard
              </p>
            </div>

            <form
              className="mt-8 space-y-4"
              onSubmit={handleSubmit}
            >
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#0B1E57]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A95]" />
                  <Input
                    name="email"
                    type="email"
                    className="h-[36px] rounded border-[#DCE6F2] pl-11 pr-4 text-sm font-normal shadow-none focus-visible:border-[#075DFF] focus-visible:ring-1 focus-visible:ring-[#075DFF]/20"
                    placeholder="Enter email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#0B1E57]">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A95]" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="h-[36px] rounded border-[#DCE6F2] pl-11 pr-12 text-sm font-normal shadow-none focus-visible:border-[#075DFF] focus-visible:ring-1 focus-visible:ring-[#075DFF]/20"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7A95] transition-colors hover:text-[#075DFF]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-[13px]">
                <label className="flex items-center gap-2 text-[#0B1E57]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-[#BFD0FF] text-[#075DFF] focus:ring-[#075DFF]"
                  />
                  Remember me
                </label>
                <button type="button" className="font-medium text-[#075DFF] hover:underline">
                  Forgot password?
                </button>
              </div>

              {error ? (
                <p className="rounded border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-normal text-red-700">
                  {error}
                </p>
              ) : null}

              <Button
                disabled={isSubmitting}
                className="h-[34px] w-full rounded bg-[#075DFF] px-3 text-[13px] font-medium shadow-[0_8px_18px_rgba(7,93,255,0.2)] hover:bg-[#064FEB]"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-[#5A6B8C]">
              <span>Need help?</span>
              <button type="button" className="font-medium text-[#075DFF] hover:underline">
                Contact support
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
