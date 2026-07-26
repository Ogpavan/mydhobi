"use client";

import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Gift,
  Globe2,
  Loader2,
  MessageCircle,
  Moon,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CustomerNotification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  createdAt: string;
};

export function NotificationsView() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/customer/notifications")
      .then(async (request) => {
        const data = (await request.json()) as {
          notifications?: CustomerNotification[];
        };
        if (active && request.ok) setNotifications(data.notifications ?? []);
      })
      .catch(() => toast.error("Unable to load notifications"))
      .finally(() => active && setLoading(false));
    fetch("/api/customer/notifications", { method: "PATCH" }).catch(() => null);
    return () => {
      active = false;
    };
  }, []);
  return <div className="min-h-screen bg-[#fafafe] pb-[88px]"><CustomerSimpleHeader title="Notifications" /><main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">{loading?<div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#7440dc]" /></div>:notifications.length?notifications.map((item) => <article key={item.id} className={cn("flex gap-3 rounded-[12px] border bg-white px-3 py-3",item.is_read?"border-[#e5e2eb]":"border-[#cdbaf5] bg-[#fbf9ff]")}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]"><Bell className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h2 className="text-[11px] font-bold">{item.title}</h2><time className="whitespace-nowrap text-[8px] text-[#858796]">{new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt))}</time></div><p className="mt-2 text-[9px] leading-4 text-[#77798a]">{item.message}</p></div></article>):<p className="py-16 text-center text-[11px] text-[#858796]">No notifications yet</p>}</main><CustomerBottomNav active="home" /></div>;
}

export function OffersView() {
  const [tab, setTab] = useState("Available");
  const [offers,setOffers]=useState<Array<{id:string;code:string;title:string;discountType:string;discountValue:number;minOrder:number;endsAt:string}>>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch("/api/customer/offers").then(async request=>{const data=await request.json() as {offers?:typeof offers};if(request.ok)setOffers(data.offers??[]);}).catch(()=>toast.error("Unable to load offers")).finally(()=>setLoading(false));},[]);
  const featured=offers[0];
  function copyOfferCode(code:string){navigator.clipboard?.writeText(code).catch(()=>null);toast.success(`${code} copied`);}
  return <div className="min-h-screen bg-[#fafafe] pb-[88px]"><CustomerSimpleHeader title="Offers & Coupons" backHref="/customer/profile" /><main className="mx-auto max-w-[720px] px-4 py-4">{featured?<button type="button" onClick={()=>copyOfferCode(featured.code)} className="flex w-full items-center rounded-[12px] bg-[#eee8ff] px-4 py-4 text-left"><span className="min-w-0 flex-1"><b className="block text-[16px] text-[#7040d7]">{featured.title}</b><span className="mt-2 block text-[10px]">Use code: <b className="text-[#7440dc]">{featured.code}</b></span></span><Gift className="h-16 w-16 text-[#7440dc]" /></button>:null}<div className="mt-4 grid grid-cols-2 border-b">{["Available","Expired"].map(item=><button key={item} type="button" onClick={()=>setTab(item)} className={cn("border-b-2 py-3 text-[10px] font-bold",tab===item?"border-[#7440dc] text-[#7440dc]":"border-transparent text-[#858796]")}>{item}</button>)}</div><div className="mt-3 space-y-3">{loading?<div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#7440dc]" /></div>:tab==="Available"?offers.length?offers.map(offer=><article key={offer.id} className="flex items-center rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3"><div className="min-w-0 flex-1"><h2 className="text-[12px] font-bold">{offer.code}</h2><p className="mt-1 text-[10px]">{offer.title}</p><p className="mt-1 text-[9px] text-[#858796]">Min order ₹{offer.minOrder} · Valid until {new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short"}).format(new Date(offer.endsAt))}</p></div><button type="button" onClick={()=>copyOfferCode(offer.code)} className="rounded-[8px] border border-[#8a50ee] px-3 py-2 text-[10px] font-bold text-[#7440dc]">Copy</button></article>):<p className="py-10 text-center text-[11px] text-[#858796]">No offers available</p>:<p className="py-10 text-center text-[11px] text-[#858796]">Expired offers are hidden</p>}</div></main><CustomerBottomNav active="profile" /></div>;
}

export function HelpSupportView() {
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState("");
  const questions=[
    {question:"How does pickup and delivery work?",answer:"Choose a pickup time and address. A rider collects your clothes and returns them after cleaning."},
    {question:"How long does it take?",answer:"Most orders are delivered in 1 to 3 days. The service page shows the expected time."},
    {question:"What payment methods are accepted?",answer:"You can pay by UPI, card, MyDhobi Wallet, or cash on delivery."},
    {question:"How is pricing calculated?",answer:"The price depends on the selected service, item quantity, and any coupon discount."},
  ];
  const shown=questions.filter(item=>`${item.question} ${item.answer}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="min-h-screen bg-[#fafafe] pb-[88px]"><CustomerSimpleHeader title="Help & Support" backHref="/customer/profile" /><main className="mx-auto max-w-[720px] px-4 py-4"><label className="flex h-11 items-center gap-2 rounded-[12px] border border-[#e5e2eb] bg-white px-3"><CircleHelp className="h-4 w-4 text-[#77798a]" /><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search for help..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" /></label><h2 className="mt-5 text-[11px] font-bold">Frequently Asked Questions</h2><div className="mt-2 overflow-hidden rounded-[12px] border border-[#e5e2eb] bg-white">{shown.length?shown.map(item=><div key={item.question} className="border-b last:border-0"><button type="button" onClick={()=>setOpen(current=>current===item.question?"":item.question)} className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-3 text-left text-[10px] font-semibold">{item.question}<ChevronDown className={cn("h-4 w-4 shrink-0 text-[#9293a0] transition-transform",open===item.question&&"rotate-180")} /></button>{open===item.question?<p className="px-3 pb-3 text-[9px] leading-4 text-[#77798a]">{item.answer}</p>:null}</div>):<p className="px-3 py-8 text-center text-[10px] text-[#858796]">No answers found</p>}</div><div className="mt-4 space-y-2"><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="flex w-full items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f8e9] text-[#20a44c]"><MessageCircle className="h-5 w-5" /></span><span><b className="block text-[11px]">WhatsApp Support</b><span className="mt-1 block text-[9px] text-[#858796]">Chat with us on WhatsApp</span></span></a><a href="tel:+919876543210" className="flex w-full items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]"><Phone className="h-5 w-5" /></span><span><b className="block text-[11px]">Call Support</b><span className="mt-1 block text-[9px] text-[#858796]">Mon - Sun, 8 AM - 10 PM</span></span></a></div><Link href="/customer/complaints" className="mt-4 flex h-11 items-center justify-center rounded-[12px] border border-[#8a50ee] text-[10px] font-bold text-[#7440dc]">Raise a Complaint</Link></main><CustomerBottomNav active="profile" /></div>;
}

type CustomerComplaint = {
  id: string;
  reference: string;
  subject: string;
  details: string;
  response: string;
  status: string;
  createdAt: string;
};

export function ComplaintsView() {
  const [tab,setTab]=useState<"Open"|"Resolved">("Open");
  const [complaints,setComplaints]=useState<CustomerComplaint[]>([]);
  const [loading,setLoading]=useState(true);
  const [formOpen,setFormOpen]=useState(false);
  const [subject,setSubject]=useState("");
  const [details,setDetails]=useState("");
  const [saving,setSaving]=useState(false);
  async function loadComplaints(){setLoading(true);try{const request=await fetch("/api/customer/complaints");const data=await request.json() as {complaints?:CustomerComplaint[];message?:string};if(!request.ok)throw new Error(data.message);setComplaints(data.complaints??[]);}catch{toast.error("Unable to load complaints");}finally{setLoading(false);}}
  useEffect(()=>{void loadComplaints();},[]);
  async function submitComplaint(){if(!subject.trim()){toast.error("Enter the issue");return;}setSaving(true);const request=await fetch("/api/customer/complaints",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,details})});const data=await request.json() as {complaint?:CustomerComplaint;message?:string};setSaving(false);if(!request.ok||!data.complaint){toast.error(data.message??"Unable to raise complaint");return;}setComplaints(current=>[data.complaint!,...current]);setSubject("");setDetails("");setFormOpen(false);setTab("Open");toast.success("Complaint raised");}
  const visible=complaints.filter(item=>tab==="Resolved"?item.status==="Resolved":item.status!=="Resolved");
  return <div className="min-h-screen bg-[#fafafe] pb-[150px]"><CustomerSimpleHeader title="My Complaints" backHref="/customer/help" /><main className="mx-auto max-w-[720px] px-4 py-4"><div className="grid grid-cols-2 border-b">{["Open","Resolved"].map(item=><button key={item} type="button" onClick={()=>setTab(item as "Open"|"Resolved")} className={cn("border-b-2 py-3 text-[10px] font-bold",tab===item?"border-[#7440dc] text-[#7440dc]":"border-transparent text-[#858796]")}>{item}</button>)}</div><div className="mt-3 space-y-3">{loading?<div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#7440dc]" /></div>:visible.length?visible.map(item=><article key={item.id} className="rounded-[12px] border border-[#e5e2eb] bg-white p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">#{item.reference}</b><span className="whitespace-nowrap text-[8px] text-[#858796]">{new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(item.createdAt))}</span></div><p className="mt-3 text-[10px] font-semibold">{item.subject}</p>{item.details?<p className="mt-1 text-[9px] leading-4 text-[#77798a]">{item.details}</p>:null}<span className={cn("mt-3 inline-block rounded px-2 py-1 text-[8px] font-bold",item.status==="Resolved"?"bg-[#e4f8e9] text-[#24964a]":item.status==="In Progress"?"bg-[#fff0df] text-[#e57419]":"bg-[#eee8ff] text-[#7440dc]")}>{item.status}</span>{item.response?<div className="mt-3 rounded-[10px] bg-[#f5f1fc] p-3"><b className="text-[9px] text-[#7440dc]">Support reply</b><p className="mt-1 text-[9px] leading-4 text-[#555768]">{item.response}</p></div>:null}</article>):<p className="py-16 text-center text-[11px] text-[#858796]">No {tab.toLowerCase()} complaints</p>}</div><button type="button" onClick={()=>setFormOpen(true)} className="fixed inset-x-4 bottom-[86px] z-10 mx-auto flex h-12 max-w-[688px] items-center justify-center gap-1 rounded-[12px] bg-[#7440dc] text-[11px] font-bold text-white"><Plus className="h-4 w-4" /> Raise New Complaint</button></main><CustomerBottomNav active="profile" /><Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-[420px] rounded-[12px]"><DialogHeader><DialogTitle>Raise Complaint</DialogTitle></DialogHeader><div className="space-y-4 p-4"><label className="block text-[10px] font-bold">Issue<input value={subject} onChange={event=>setSubject(event.target.value.slice(0,150))} placeholder="What went wrong?" className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] px-3 text-[11px] outline-none focus:border-[#7440dc]" /></label><label className="block text-[10px] font-bold">Details<textarea value={details} onChange={event=>setDetails(event.target.value.slice(0,1000))} rows={5} placeholder="Add more details" className="mt-2 w-full resize-none rounded-[10px] border border-[#e5e2eb] px-3 py-3 text-[11px] outline-none focus:border-[#7440dc]" /></label><button type="button" disabled={saving} onClick={submitComplaint} className="h-11 w-full rounded-[12px] bg-[#7440dc] text-[11px] font-bold text-white disabled:opacity-60">{saving?"Sending...":"Submit Complaint"}</button></div></DialogContent></Dialog></div>;
}

export function AddMoneyView() {
  const [amount,setAmount]=useState("200");
  const [customAmount,setCustomAmount]=useState("");
  const [adding,setAdding]=useState(false);
  const router=useRouter();
  async function addMoney(){const raw=amount==="Custom"?customAmount:amount;const value=Number(raw.replace(",",""));if(!Number.isFinite(value)||value<1){toast.error("Enter a valid amount");return;}setAdding(true);const response=await fetch("/api/customer/wallet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:value})});const data=await response.json() as {message?:string};if(!response.ok){toast.error(data.message??"Unable to add money");setAdding(false);return;}startNavigationProgress();router.push("/customer/wallet");}
  return <div className="min-h-screen bg-[#fafafe] pb-24"><CustomerSimpleHeader title="Add Money" backHref="/customer/wallet" /><main className="mx-auto max-w-[720px] px-4 py-4"><section className="rounded-[12px] bg-[linear-gradient(120deg,#7040db,#8b4def)] px-4 py-4 text-white"><p className="text-[10px] text-white/80">Wallet</p><p className="mt-1 text-[18px] font-bold">Add balance</p></section><h2 className="mt-5 text-[11px] font-bold">Select Amount</h2><div className="mt-3 grid grid-cols-3 gap-2">{["100","200","500","1,000","2,000","Custom"].map(item=><button key={item} type="button" onClick={()=>setAmount(item)} className={cn("h-11 rounded-[10px] border bg-white text-[11px] font-bold",amount===item?"border-[#7440dc] bg-[#f4efff] text-[#7440dc]":"border-[#e5e2eb]")}>{item==="Custom"?item:`₹${item}`}</button>)}</div>{amount==="Custom"?<label className="mt-3 block text-[10px] font-bold">Amount<input value={customAmount} onChange={event=>setCustomAmount(event.target.value.replace(/\\D/g,"").slice(0,5))} inputMode="numeric" placeholder="Enter amount" className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e2eb] bg-white px-3 text-[11px] outline-none focus:border-[#7440dc]" /></label>:null}<section className="mt-5 rounded-[12px] bg-[#f1edfa] p-3"><h2 className="text-[11px] font-bold">Benefits</h2>{["Faster checkout","Exclusive wallet offers","Secure & safe payments"].map(item=><p key={item} className="mt-3 flex items-center gap-2 text-[10px]"><CheckCircle2 className="h-4 w-4 text-[#25a950]" />{item}</p>)}</section><button type="button" disabled={adding} onClick={addMoney} className="fixed inset-x-4 bottom-3 mx-auto h-12 max-w-[688px] rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white disabled:opacity-60">{adding?"Adding...":"Add Money"}</button></main></div>;
}

export function SettingsView() {
  const [notifications,setNotifications]=useState(true);
  const [dark,setDark]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    let active=true;
    fetch("/api/customer/settings").then(async request=>{
      const data=await request.json() as {settings?:{notificationsEnabled:boolean;darkMode:boolean}};
      if(request.ok&&data.settings&&active){
        setNotifications(data.settings.notificationsEnabled);
        setDark(data.settings.darkMode);
        document.documentElement.classList.toggle("customer-dark",data.settings.darkMode);
      }
    }).catch(()=>toast.error("Unable to load settings")).finally(()=>active&&setLoading(false));
    return()=>{active=false};
  },[]);

  async function save(nextNotifications:boolean,nextDark:boolean){
    setNotifications(nextNotifications);setDark(nextDark);
    document.documentElement.classList.toggle("customer-dark",nextDark);
    setSaving(true);
    const request=await fetch("/api/customer/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({notificationsEnabled:nextNotifications,darkMode:nextDark})});
    setSaving(false);
    if(!request.ok){toast.error("Unable to save settings");return;}
    toast.success("Settings saved");
  }

  async function clearCache(){
    if("caches" in window){const names=await caches.keys();await Promise.all(names.map(name=>caches.delete(name)));}
    toast.success("App cache cleared");
  }

  const rows=[
    {label:"Order Notifications",icon:Bell,control:<input aria-label="Order notifications" disabled={loading||saving} type="checkbox" checked={notifications} onChange={e=>void save(e.target.checked,dark)} className="h-5 w-5 accent-[#7440dc]" />},
    {label:"Dark Theme",icon:Moon,control:<input aria-label="Dark theme" disabled={loading||saving} type="checkbox" checked={dark} onChange={e=>void save(notifications,e.target.checked)} className="h-5 w-5 accent-[#7440dc]" />},
    {label:"Language",icon:Globe2,control:<span className="text-[9px] text-[#77798a]">English</span>},
    {label:"Clear App Cache",icon:Trash2,control:<button type="button" onClick={()=>void clearCache()} className="text-[9px] font-bold text-[#7440dc]">Clear</button>},
  ];
  return <div className="min-h-screen bg-[#fafafe] pb-[88px]"><CustomerSimpleHeader title="Settings" backHref="/customer/profile" /><main className="mx-auto max-w-[720px] px-4 py-4"><section className="overflow-hidden rounded-[12px] border border-[#e5e2eb] bg-white">{rows.map(row=>{const Icon=row.icon;return <div key={row.label} className="flex min-h-[52px] items-center gap-3 border-b px-3 last:border-0"><Icon className="h-4 w-4 text-[#666879]" /><span className="min-w-0 flex-1 text-[10px] font-semibold">{row.label}</span>{row.control}</div>})}</section><h2 className="mt-5 text-[10px] font-bold text-[#77798a]">About App</h2><div className="mt-2 flex h-12 items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3"><ShieldCheck className="h-4 w-4 text-[#7440dc]" /><span className="flex-1 text-[10px] font-semibold">App Version</span><span className="text-[9px] text-[#77798a]">v1.0.0</span></div></main><CustomerBottomNav active="profile" /></div>;
}
