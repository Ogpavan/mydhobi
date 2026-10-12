import { MuiAction, MuiInput } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Link, { useRouter } from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import { queryClient } from "@/platform/query-client";
import {
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Gift,
  LogOut,
  MapPin,
  Package,
  ReceiptText,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { invalidateCustomerData } from "@/components/customer/customer-client-data";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerBackButton } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthUser } from "@/lib/auth";

export function ProfileView({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [profile, setProfile] = useState(user);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const initials = profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menu = [
    { label: "My Orders", icon: ClipboardList, href: "/customer/orders" },
    { label: "Laundry Packages", icon: Package, href: "/customer/packages" },
    { label: "Offers & Coupons", icon: Gift, href: "/customer/offers" },
    { label: "Price List", icon: ReceiptText, href: "/customer/calculator" },
    { label: "Manage Addresses", icon: MapPin, href: "/customer/addresses" },
    { label: "Help & Support", icon: CircleHelp, href: "/customer/help" },
    { label: "Settings", icon: Settings, href: "/customer/settings" },
  ];

  const legalLinks = [
    { label: "About", href: "/customer/about" },
    { label: "Privacy", href: "/customer/privacy" },
    { label: "Terms", href: "/customer/terms" },
  ];

  async function logout() {
    const response = await apiFetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Could not log out");
      return;
    }
    queryClient.clear();
    startNavigationProgress();
    router.replace("/");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await apiFetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        mobile: form.get("mobile"),
      }),
    });
    const data = (await response.json()) as {
      user?: AuthUser;
      message?: string;
    };
    setSaving(false);
    if (!response.ok || !data.user) {
      toast.error(data.message ?? "Unable to update profile");
      return;
    }
    setProfile(data.user);
    invalidateCustomerData("/api/auth/me", "/api/customer/home");
    setEditOpen(false);
    toast.success("Profile updated");
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setDeleting(true);
    const response = await apiFetch("/api/customer/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: deleteText }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "Unable to delete account");
      setDeleting(false);
      return;
    }
    invalidateCustomerData();
    startNavigationProgress();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <CustomerBackButton fallback="/customer" ariaLabel="Back to home" />
          <h1 className="text-[15px] font-bold">My Profile</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] space-y-4 px-4 py-4">
        <section className="flex items-center gap-3 rounded-2xl border border-[#e7e3ed] bg-white p-4 shadow-[0_2px_8px_rgba(40,29,66,0.035)]">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[17px] font-bold text-[#6033c7]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold text-[#292438]">
              {profile.name}
            </h2>
            <p className="mt-1 text-[12px] text-[#716b7b]">
              +91 {profile.mobile}
            </p>
            <MuiAction
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-2 min-h-9 rounded-lg px-2 text-[12px] font-bold text-[#6033c7] normal-case hover:bg-[#f4f0fc]"
            >
              Edit profile
            </MuiAction>
          </div>
        </section>

        <section
          aria-label="Profile links"
          className="overflow-hidden rounded-2xl border border-[#e7e3ed] bg-white"
        >
          {menu.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f4f0fc] text-[#7040dc]">
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#393447]">
                  {item.label}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-[#9a9ba7]"
                />
              </>
            );
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-h-[54px] items-center gap-3 border-b border-[#eeecf2] px-3 py-2 hover:bg-[#faf9fd] last:border-0"
              >
                {content}
              </Link>
            );
          })}
          <MuiAction
            type="button"
            onClick={logout}
            className="flex min-h-[54px] w-full items-center justify-start gap-3 px-3 py-2 text-left text-[#bd3535] shadow-[inset_0_1px_0_#eeecf2] hover:bg-[#fff8f8] normal-case"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0f0]">
              <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[13px] font-semibold">Log out</span>
          </MuiAction>
          <MuiAction
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex min-h-[54px] w-full items-center justify-start gap-3 px-3 py-2 text-left text-[#bd3535] shadow-[inset_0_1px_0_#eeecf2] hover:bg-[#fff8f8] normal-case"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0f0]">
              <Trash2 aria-hidden="true" className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[13px] font-semibold">Delete account</span>
          </MuiAction>
        </section>
        <nav
          aria-label="Legal pages"
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-1"
        >
          {legalLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="min-h-10 px-1 py-3 text-[11px] font-medium text-[#716b7b] underline-offset-2 hover:text-[#6033c7] hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </main>
      <CustomerBottomNav active="profile" />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[420px] rounded-[12px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4 p-4">
            <label className="block text-[10px] font-bold">
              Name
              <MuiInput
                name="name"
                defaultValue={profile.name}
                minLength={2}
                maxLength={100}
                required
                className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-[#7440dc]"
              />
            </label>
            <label className="block text-[10px] font-bold">
              Mobile Number
              <MuiInput
                name="mobile"
                defaultValue={profile.mobile}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                }}
                className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-[#7440dc]"
              />
            </label>
            <MuiAction
              disabled={saving}
              className="h-11 w-full rounded-[12px] bg-[#7440dc] text-[11px] font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </MuiAction>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[420px] rounded-[12px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-[10px] leading-5 text-[#77798a]">
              This permanently removes your orders, addresses, wallet,
              complaints, and login. Type DELETE to continue.
            </p>
            <MuiInput
              value={deleteText}
              onChange={(event) =>
                setDeleteText(event.target.value.toUpperCase().slice(0, 6))
              }
              className="h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-red-500"
            />
            <MuiAction
              type="button"
              disabled={deleting || deleteText !== "DELETE"}
              onClick={() => void deleteAccount()}
              className="h-11 w-full rounded-[12px] bg-red-600 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete My Account"}
            </MuiAction>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
