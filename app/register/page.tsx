"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { startNavigationProgress } from "@/components/navigation-loader";

export default function RegisterPage(){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false);const router=useRouter();
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError("");setSaving(true);const form=new FormData(event.currentTarget);const request=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),mobile:form.get("mobile"),email:form.get("email"),password:form.get("password"),referralCode:form.get("referralCode")})});const data=await request.json() as {message?:string};setSaving(false);if(!request.ok){setError(data.message??"Unable to create account.");return;}startNavigationProgress();router.replace("/permissions");router.refresh();}
  const inputClass="mt-2 h-11 w-full rounded-[10px] border border-[#ddd9e5] px-3 text-[12px] outline-none focus:border-[#7440dc]";
  return <main className="min-h-screen bg-[#fafafe] px-4 py-8 text-[#17182c]"><div className="mx-auto max-w-[420px]"><h1 className="text-[22px] font-bold">Create Account</h1><form onSubmit={submit} className="mt-6 space-y-4 rounded-[12px] border border-[#e5e2eb] bg-white p-4"><label className="block text-[11px] font-bold">Name<input name="name" minLength={2} maxLength={100} required className={inputClass} /></label><label className="block text-[11px] font-bold">Mobile Number<input name="mobile" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required onInput={event=>{event.currentTarget.value=event.currentTarget.value.replace(/\D/g,"").slice(0,10)}} className={inputClass} /></label><label className="block text-[11px] font-bold">Email (Optional)<input name="email" type="email" className={inputClass} /></label><label className="block text-[11px] font-bold">Password<input name="password" type="password" minLength={8} required className={inputClass} /></label><label className="block text-[11px] font-bold">Referral Code (Optional)<input name="referralCode" maxLength={20} onInput={event=>{event.currentTarget.value=event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g,"")}} className={inputClass} /></label>{error?<p className="rounded-[8px] bg-red-50 px-3 py-2 text-[10px] text-red-700">{error}</p>:null}<button disabled={saving} className="h-11 w-full rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white disabled:opacity-60">{saving?"Creating...":"Create Account"}</button></form><Link href="/" className="mt-4 block text-center text-[11px] font-bold text-[#7440dc]">Already have an account? Sign in</Link></div></main>;
}
