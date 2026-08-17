"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Smartphone, UserRound } from "lucide-react";
import { type FormEvent, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { startNavigationProgress } from "@/components/navigation-loader";

const inputClassName =
  "h-12 w-full rounded-[10px] border border-[#ddd9e8] bg-white text-sm text-[#25213a] outline-none transition placeholder:text-[#a09bad] focus:border-[#7440dc] focus:ring-2 focus:ring-[#7440dc]/10";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const request = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          mobile: form.get("mobile"),
          password,
        }),
      });
      const data = (await request.json()) as { message?: string };
      if (!request.ok) {
        setError(data.message ?? "Unable to create account.");
        return;
      }
      startNavigationProgress();
      router.replace("/permissions");
      router.refresh();
    } catch {
      setError("Unable to create account right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Create Account ✨" backHref="/" className="pt-16" cardless showHero={false}>
      <h2 className="text-center text-lg font-bold">Sign Up</h2>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-[#4d485c]">
          Full Name
          <span className="relative mt-1.5 flex">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#716b82]" />
            <input
              name="name"
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder="Enter your full name"
              required
              className={`${inputClassName} pl-10 pr-3`}
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-[#4d485c]">
          Mobile Number
          <span className="relative mt-1.5 flex">
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
              autoComplete="tel"
              placeholder="Enter mobile number"
              required
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
              }}
              className={`${inputClassName} pl-[122px] pr-3`}
            />
          </span>
        </label>

        <PasswordField
          name="password"
          label="Password"
          placeholder="Create a password"
          shown={showPassword}
          toggle={() => setShowPassword((value) => !value)}
          autoComplete="new-password"
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          shown={showConfirmPassword}
          toggle={() => setShowConfirmPassword((value) => !value)}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-xs text-[#625d70]">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-3.5 w-3.5 rounded border-[#cfc9dc] accent-[#7440dc]"
          />
          <span>I agree to the Terms and Privacy Policy.</span>
        </label>

        {error ? (
          <p className="rounded-[8px] bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <button
          disabled={saving}
          className="h-12 w-full rounded-[10px] bg-[linear-gradient(100deg,#9454f4,#7040dc)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(116,64,220,0.22)] transition hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[#777184]">
        Already have an account?{" "}
        <Link href="/" className="font-bold text-[#7440dc] hover:underline">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

function PasswordField({
  name,
  label,
  placeholder,
  shown,
  toggle,
  autoComplete,
}: {
  name: string;
  label: string;
  placeholder: string;
  shown: boolean;
  toggle: () => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#4d485c]">
      {label}
      <span className="relative mt-1.5 flex">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#716b82]" />
        <input
          name={name}
          type={shown ? "text" : "password"}
          minLength={8}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className={`${inputClassName} pl-10 pr-11`}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#716b82] hover:bg-[#f4f0fb] hover:text-[#7440dc]"
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
