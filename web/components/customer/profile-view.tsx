"use client";

import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  Gift,
  Info,
  FileText,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { invalidateCustomerData } from "@/components/customer/customer-client-data";
import { startNavigationProgress } from "@/components/navigation-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuthUser } from "@/lib/auth";

export function ProfileView({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [profile,setProfile]=useState(user);
  const [editOpen,setEditOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleteOpen,setDeleteOpen]=useState(false);
  const [deleteText,setDeleteText]=useState("");
  const [deleting,setDeleting]=useState(false);
  const initials = profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menu = [
    { label: "My Addresses", icon: MapPin, href: "/customer/addresses" },
    { label: "Payment Methods", icon: WalletCards, href: "/customer/payment" },
    { label: "My Orders", icon: SlidersHorizontal, href: "/customer/orders" },
    { label: "Notifications", icon: Bell, href: "/customer/notifications" },
    { label: "Refer & Earn", icon: Gift, href: "/customer/refer" },
    { label: "Offers & Coupons", icon: Gift, href: "/customer/offers" },
    { label: "Help & Support", icon: CircleHelp, href: "/customer/help" },
    { label: "Settings", icon: Settings, href: "/customer/settings" },
    { label: "About Us", icon: Info, href: "/customer/about" },
    { label: "Privacy Policy", icon: ShieldCheck, href: "/customer/privacy" },
    { label: "Terms & Conditions", icon: FileText, href: "/customer/terms" },
  ];

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Could not log out");
      return;
    }
    invalidateCustomerData();
    startNavigationProgress();
    router.replace("/");
  }

  async function saveProfile(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);const form=new FormData(event.currentTarget);
    const response=await fetch("/api/customer/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),mobile:form.get("mobile")})});
    const data=await response.json() as {user?:AuthUser;message?:string};setSaving(false);
    if(!response.ok||!data.user){toast.error(data.message??"Unable to update profile");return;}
    setProfile(data.user);invalidateCustomerData("/api/auth/me","/api/customer/home");setEditOpen(false);toast.success("Profile updated");
  }

  async function deleteAccount(){
    if(deleteText!=="DELETE"){toast.error("Type DELETE to confirm");return;}
    setDeleting(true);const response=await fetch("/api/customer/profile",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirmation:deleteText})});const data=await response.json() as {message?:string};if(!response.ok){toast.error(data.message??"Unable to delete account");setDeleting(false);return;}invalidateCustomerData();startNavigationProgress();router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link href="/customer" aria-label="Back to home" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">My Profile</h1>
          <Link href="/customer/settings" aria-label="Profile settings" title="Profile settings" className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <section className="flex items-center gap-3 rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#9ad8ff,#d8c2ff)] text-[17px] font-bold text-[#3e3f58]">{initials}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-bold">{profile.name}</h2>
            <p className="mt-1 text-[10px] text-[#77798a]">+91 {profile.mobile}</p>
            <button type="button" onClick={() => setEditOpen(true)} className="mt-1 text-[10px] font-bold text-[#7440dc]">Edit Profile</button>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-[12px] border border-[#e4e1ea] bg-white">
          {menu.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="h-4 w-4 text-[#666879]" />
                <span className="min-w-0 flex-1 text-[11px] font-semibold">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-[#9a9ba7]" />
              </>
            );
            return <Link key={item.label} href={item.href} className="flex h-12 items-center gap-3 border-b border-[#eeecf2] px-3 hover:bg-[#faf9fd]">{content}</Link>;
          })}
          <button type="button" onClick={logout} className="flex h-12 w-full items-center gap-3 px-3 text-left text-[#d94c57] hover:bg-[#fff8f8]">
            <LogOut className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Logout</span>
          </button>
          <button type="button" onClick={()=>setDeleteOpen(true)} className="flex h-12 w-full items-center gap-3 border-t px-3 text-left text-[#d94c57] hover:bg-[#fff8f8]"><Trash2 className="h-4 w-4" /><span className="text-[11px] font-semibold">Delete Account</span></button>
        </section>
      </main>

      <CustomerBottomNav active="profile" />
      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-w-[420px] rounded-[12px]"><DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader><form onSubmit={saveProfile} className="space-y-4 p-4"><label className="block text-[10px] font-bold">Name<input name="name" defaultValue={profile.name} minLength={2} maxLength={100} required className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-[#7440dc]" /></label><label className="block text-[10px] font-bold">Mobile Number<input name="mobile" defaultValue={profile.mobile} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required onInput={event=>{event.currentTarget.value=event.currentTarget.value.replace(/\D/g,"").slice(0,10)}} className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-[#7440dc]" /></label><button disabled={saving} className="h-11 w-full rounded-[12px] bg-[#7440dc] text-[11px] font-bold text-white disabled:opacity-60">{saving?"Saving...":"Save"}</button></form></DialogContent></Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="max-w-[420px] rounded-[12px]"><DialogHeader><DialogTitle>Delete Account</DialogTitle></DialogHeader><div className="space-y-4 p-4"><p className="text-[10px] leading-5 text-[#77798a]">This permanently removes your orders, addresses, wallet, complaints, and login. Type DELETE to continue.</p><input value={deleteText} onChange={event=>setDeleteText(event.target.value.toUpperCase().slice(0,6))} className="h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-red-500" /><button type="button" disabled={deleting||deleteText!=="DELETE"} onClick={()=>void deleteAccount()} className="h-11 w-full rounded-[12px] bg-red-600 text-[11px] font-bold text-white disabled:opacity-50">{deleting?"Deleting...":"Delete My Account"}</button></div></DialogContent></Dialog>
    </div>
  );
}
