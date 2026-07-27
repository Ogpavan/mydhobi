"use client";

import { ArrowLeft, Check, Copy, Facebook, Instagram, MessageCircle, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";

export function ReferEarnView() {
  const [profile,setProfile]=useState({code:"",shareCount:0,successfulReferrals:0,rewardsEarned:0});
  const [redeemCode,setRedeemCode]=useState("");
  const [redeeming,setRedeeming]=useState(false);

  useEffect(()=>{
    fetch("/api/customer/referrals").then(async request=>{
      const data=await request.json() as {profile?:typeof profile};
      if(request.ok&&data.profile)setProfile(data.profile);
    }).catch(()=>toast.error("Unable to load referral code"));
  },[]);

  async function copyCode() {
    await navigator.clipboard.writeText(profile.code);
    await fetch("/api/customer/referrals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"share"})});
    toast.success("Referral code copied");
  }

  async function share(label:string){
    const text=`Use my MyDhobi referral code ${profile.code} and get 20% off your first order.`;
    await fetch("/api/customer/referrals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"share"})});
    if(label==="WhatsApp"){window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer");return;}
    if(navigator.share){await navigator.share({title:"MyDhobi referral",text});return;}
    await navigator.clipboard.writeText(text);toast.success("Referral message copied");
  }

  async function redeem(){
    if(!redeemCode.trim()){toast.error("Enter a referral code");return;}
    setRedeeming(true);
    const request=await fetch("/api/customer/referrals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"redeem",code:redeemCode})});
    const data=await request.json() as {message?:string};setRedeeming(false);
    if(!request.ok){toast.error(data.message??"Unable to use code");return;}
    setRedeemCode("");toast.success("Code added. Your first order gets 20% off");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link href="/customer/profile" aria-label="Back to profile" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">Refer & Earn</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <section className="relative min-h-[138px] overflow-hidden rounded-[12px] bg-[linear-gradient(115deg,#eee8ff,#f7f3ff)] px-4 py-4">
          <div className="relative z-10 max-w-[62%]">
            <h2 className="text-[13px] font-bold leading-5 text-[#6840ce]">Refer Your Friends & Earn Rewards!</h2>
            <p className="mt-2 text-[10px] font-semibold text-[#4e5060]">You get ₹100, your friend gets 20% off on their first order.</p>
          </div>
          <Image src="/gift_box.png" alt="" width={130} height={105} className="absolute -bottom-1 right-1 h-[105px] w-[130px] object-contain" />
        </section>

        <section className="mt-5">
          <h2 className="text-[11px] font-bold">Your Referral Code</h2>
          <div className="mt-2 flex h-12 items-center rounded-[10px] border border-[#e1ddea] bg-white pl-3">
            <strong className="min-w-0 flex-1 text-[13px] tracking-wide">{profile.code || "Loading..."}</strong>
            <button type="button" disabled={!profile.code} onClick={copyCode} className="mr-1 flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-bold text-[#7440dc] hover:bg-[#f4efff] disabled:opacity-50">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-[11px] font-bold">Share via</h2>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[
              { label: "WhatsApp", icon: MessageCircle, color: "bg-[#e5f8e9] text-[#24a650]" },
              { label: "Instagram", icon: Instagram, color: "bg-[#fbe8f2] text-[#d64283]" },
              { label: "Facebook", icon: Facebook, color: "bg-[#e8f0ff] text-[#2873d8]" },
              { label: "More", icon: MoreHorizontal, color: "bg-[#efeff3] text-[#676978]" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" disabled={!profile.code} onClick={() => void share(item.label)} className="flex flex-col items-center gap-2 disabled:opacity-50">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}><Icon className="h-5 w-5" /></span>
                  <span className="text-[9px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[12px] border border-[#e4e1ea] bg-white p-3">
          <h2 className="text-[11px] font-bold">Have a Referral Code?</h2>
          <div className="mt-2 flex gap-2">
            <input value={redeemCode} onChange={event=>setRedeemCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20))} placeholder="Enter code" className="h-10 min-w-0 flex-1 rounded-[9px] border border-[#e1ddea] px-3 text-[10px] outline-none focus:border-[#7440dc]" />
            <button type="button" disabled={redeeming} onClick={()=>void redeem()} className="rounded-[9px] bg-[#7440dc] px-4 text-[10px] font-bold text-white disabled:opacity-60">{redeeming?"Adding...":"Use Code"}</button>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-2">
          {[["Shared",profile.shareCount],["Friends",profile.successfulReferrals],["Earned",`₹${profile.rewardsEarned}`]].map(([label,value])=><div key={label} className="rounded-[12px] border border-[#e4e1ea] bg-white p-3 text-center"><b className="block text-[14px] text-[#7440dc]">{value}</b><span className="mt-1 block text-[9px] text-[#77798a]">{label}</span></div>)}
        </section>

        <section className="mt-6 rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3">
          <h2 className="text-[11px] font-bold">How It Works</h2>
          <ol className="mt-3 space-y-3">
            {["Share your referral code", "Your friend places their first order", "You both get rewards"].map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[10px] font-bold text-[#7440dc]">{index + 1}</span>
                <span>{step}</span>
                {index === 2 && <Check className="ml-auto h-4 w-4 text-[#27a652]" />}
              </li>
            ))}
          </ol>
        </section>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  );
}
