import { Gift, IndianRupee, UserCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReferralRecord } from "@/lib/referrals";

export function AdminReferrals({ referrals }: { referrals: ReferralRecord[] }) {
  const rewarded=referrals.filter(item=>item.status==="Rewarded");
  const cards=[
    {label:"Referrals",value:referrals.length,icon:Users},
    {label:"Successful",value:rewarded.length,icon:UserCheck},
    {label:"Pending",value:referrals.length-rewarded.length,icon:Gift},
    {label:"Rewards Paid",value:`₹${rewarded.reduce((sum,item)=>sum+item.rewardAmount,0).toLocaleString("en-IN")}`,icon:IndianRupee},
  ];
  return <div className="space-y-3"><section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({label,value,icon:Icon})=><Card key={label}><CardContent className="flex h-[88px] items-center gap-3 p-4"><Icon className="h-7 w-7 text-[#6D28D9]" /><div><p className="text-[12px] text-[#52627A]">{label}</p><p className="mt-1 text-[22px] font-semibold">{value}</p></div></CardContent></Card>)}</section><Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Referrer</TableHead><TableHead>Friend</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Reward</TableHead></TableRow></TableHeader><TableBody>{referrals.length?referrals.map(item=><TableRow key={item.id}><TableCell className="font-semibold text-[#075DFF]">{item.code}</TableCell><TableCell><p className="font-medium">{item.referrerName}</p><p className="text-[11px] text-[#52627A]">{item.referrerMobile}</p></TableCell><TableCell><p className="font-medium">{item.friendName}</p><p className="text-[11px] text-[#52627A]">{item.friendMobile}</p></TableCell><TableCell>{new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(item.createdAt))}</TableCell><TableCell><Badge variant="outline" className={item.status==="Rewarded"?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-amber-200 bg-amber-50 text-amber-700"}>{item.status}</Badge></TableCell><TableCell className="text-right font-medium">₹{item.rewardAmount}</TableCell></TableRow>):<TableRow><TableCell colSpan={6} className="h-32 text-center text-[#52627A]">No referrals yet</TableCell></TableRow>}</TableBody></Table></CardContent></Card></div>;
}
