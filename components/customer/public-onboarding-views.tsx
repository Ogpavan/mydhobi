"use client";

import { Bell, Check, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { startNavigationProgress } from "@/components/navigation-loader";
import { cn } from "@/lib/utils";

export function WelcomeView() {
  return <div className="min-h-screen bg-[linear-gradient(180deg,#eee7ff,#fff_70%)] px-5 py-8"><main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[420px] flex-col items-center justify-center text-center"><Image src="/wash_fold.png" alt="" width={250} height={250} priority className="h-[250px] w-[250px] object-contain" /><h1 className="mt-4 text-[27px] font-bold text-[#251f58]">MyDhobi</h1><p className="mt-3 text-[12px] text-[#66617c]">Fresh clothes, happy you</p><div className="mt-7 flex gap-1.5"><span className="h-1.5 w-5 rounded-full bg-[#7440dc]" /><span className="h-1.5 w-1.5 rounded-full bg-[#c9b8f5]" /><span className="h-1.5 w-1.5 rounded-full bg-[#c9b8f5]" /></div><Link href="/onboarding" className="mt-auto flex h-12 w-full items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Get Started</Link></main></div>;
}

export function OnboardingView() {
  return <div className="min-h-screen bg-white px-5 py-8"><main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[420px] flex-col items-center text-center"><div className="flex min-h-[52vh] w-full items-center justify-center rounded-[20px] bg-[linear-gradient(160deg,#faf8ff,#eee8ff)]"><Image src="/ironwashing.png" alt="" width={280} height={280} priority className="h-[280px] w-[280px] object-contain" /></div><h1 className="mt-7 text-[20px] font-bold">Premium Laundry Service<br />at Your Doorstep</h1><p className="mt-4 max-w-[300px] text-[11px] leading-5 text-[#77798a]">Schedule a pickup and get fresh clothes delivered.</p><div className="mt-5 flex gap-1.5"><span className="h-1.5 w-5 rounded-full bg-[#7440dc]" /><span className="h-1.5 w-1.5 rounded-full bg-[#d4c7f5]" /><span className="h-1.5 w-1.5 rounded-full bg-[#d4c7f5]" /></div><Link href="/register" className="mt-auto flex h-12 w-full items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Next</Link><Link href="/" className="mt-3 text-[10px] font-bold text-[#7440dc]">Skip</Link></main></div>;
}

export function PermissionsView() {
  const [notifications,setNotifications]=useState(true);const [location,setLocation]=useState(true);
  const router=useRouter();
  async function continueToApp(){if(notifications&&"Notification" in window)await Notification.requestPermission();if(location&&navigator.geolocation)navigator.geolocation.getCurrentPosition(()=>undefined,()=>undefined,{timeout:5000});startNavigationProgress();router.replace("/customer");}
  return <div className="min-h-screen bg-white px-5 py-5"><main className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[420px] flex-col"><div className="mt-14 text-center"><h1 className="text-[19px] font-bold">Allow Permissions</h1><p className="mt-3 text-[11px] text-[#77798a]">To serve you better</p></div><div className="mt-10 space-y-3">{[{label:"Enable Notifications",detail:"Get real-time order updates",icon:Bell,value:notifications,set:setNotifications},{label:"Use your Location",detail:"Find the nearest pickup service",icon:MapPin,value:location,set:setLocation}].map(item=>{const Icon=item.icon;return <button key={item.label} type="button" onClick={()=>item.set(!item.value)} className="flex w-full items-center gap-3 rounded-[12px] border border-[#e5e2eb] px-3 py-4 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><b className="block text-[11px]">{item.label}</b><span className="mt-1 block text-[9px] text-[#77798a]">{item.detail}</span></span><span className={cn("flex h-5 w-5 items-center justify-center rounded-full",item.value?"bg-[#7440dc] text-white":"border border-[#c8c7d1]")}><Check className="h-3 w-3" /></span></button>})}</div><button type="button" onClick={()=>void continueToApp()} className="mt-auto flex h-12 items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Continue</button></main></div>;
}
