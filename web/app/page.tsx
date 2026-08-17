"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Smartphone } from "lucide-react";
import { type FormEvent, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { startNavigationProgress } from "@/components/navigation-loader";

const inputClassName =
  "h-12 w-full rounded-[10px] border border-[#ddd9e8] bg-white text-sm text-[#25213a] outline-none transition placeholder:text-[#a09bad] focus:border-[#7440dc] focus:ring-2 focus:ring-[#7440dc]/10";

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
    const mobile = String(formData.get("mobile") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = (await response.json()) as {
        message?: string;
        user?: { role: "admin" | "staff" | "store_manager" | "customer" };
      };

      if (!response.ok) {
        setError(data.message ?? "Invalid mobile number or password.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      const isCustomer = data.user?.role === "customer";
      const safeRedirect = isCustomer
        ? redirectTo?.startsWith("/customer") ? redirectTo : "/customer"
        : redirectTo?.startsWith("/admin") ? redirectTo : "/admin/dashboard";
      startNavigationProgress();
      router.replace(safeRedirect);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome Back 👋" subtitle="Sign In" cardless>

      <form className="mt-12 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-[#4d485c]">
          Mobile Number
          <span className="relative mt-2 flex">
            <span className="absolute inset-y-0 left-0 flex w-[106px] items-center gap-2 border-r border-[#e5e1eb] pl-4 text-sm font-medium text-[#403a50]">
              <Smartphone className="h-4 w-4 text-[#716b82]" />
              +91
            </span>
            <input
              name="mobile"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
              }}
              className={`${inputClassName} h-12 rounded-[10px] pl-[122px] pr-3`}
              placeholder="Enter mobile number"
              autoComplete="tel"
              required
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-[#4d485c]">
          Password
          <span className="relative mt-2 flex">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#716b82]" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              className={`${inputClassName} h-12 rounded-[10px] pl-10 pr-11`}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#716b82] hover:bg-[#f4f0fb] hover:text-[#7440dc]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-[#7440dc] hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error ? (
          <p className="rounded-[8px] bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <button
          disabled={isSubmitting}
          className="h-12 w-full rounded-[10px] bg-[linear-gradient(100deg,#9454f4,#7040dc)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(116,64,220,0.25)] transition hover:brightness-95 disabled:opacity-60"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[#777184]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-[#7440dc] hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthShell>
  );
}
