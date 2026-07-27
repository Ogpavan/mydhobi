"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/auth";

export function AdminProfileForm({user}:{user:AuthUser}){
  const [saving,setSaving]=useState(false);const router=useRouter();
  async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);const form=new FormData(event.currentTarget);const request=await fetch("/api/admin/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),mobile:form.get("mobile"),password:form.get("password")})});const data=await request.json() as {message?:string};setSaving(false);if(!request.ok){toast.error(data.message??"Unable to update profile");return;}toast.success("Profile updated");router.refresh();}
  return <Card className="max-w-[620px]"><CardContent className="p-4"><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="text-[12px] font-medium">Name<Input name="name" defaultValue={user.name} minLength={2} maxLength={100} required className="mt-1.5" /></label><label className="text-[12px] font-medium">Mobile Number<Input name="mobile" defaultValue={user.mobile} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required onInput={event=>{event.currentTarget.value=event.currentTarget.value.replace(/\D/g,"").slice(0,10)}} className="mt-1.5" /></label><label className="text-[12px] font-medium sm:col-span-2">Email<Input name="email" type="email" defaultValue={user.email} required className="mt-1.5" /></label><label className="text-[12px] font-medium sm:col-span-2">New Password<Input name="password" type="password" minLength={8} placeholder="Leave blank to keep the current password" className="mt-1.5" /></label><div className="sm:col-span-2"><Button disabled={saving} className="bg-[#075DFF]">{saving?"Saving...":"Save Profile"}</Button></div></form></CardContent></Card>;
}
