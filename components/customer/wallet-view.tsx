"use client";

import { ArrowLeft, Plus, WalletCards } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";

export function WalletView({
  balance,
  portalTransactions,
}: {
  balance: number;
  portalTransactions: Array<{ id: string; label: string; amount: number; createdAt: string }>;
}) {
  const displayTransactions = portalTransactions.map((transaction) => ({
    label: transaction.label,
    date: new Date(transaction.createdAt).toLocaleString("en-IN"),
    amount: `${transaction.amount >= 0 ? "+" : "-"}₹${Math.abs(transaction.amount).toFixed(2)}`,
    positive: transaction.amount >= 0,
    icon: transaction.amount >= 0 ? Plus : WalletCards,
  }));
  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link href="/customer" aria-label="Back to home" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">My Wallet</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <section className="relative overflow-hidden rounded-[12px] bg-[linear-gradient(125deg,#7040db,#8b4def)] px-4 py-4 text-white shadow-[0_10px_24px_rgba(111,58,214,0.22)]">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <p className="text-[10px] text-white/80">Wallet Balance</p>
          <p className="mt-1 text-[25px] font-bold">₹{balance.toFixed(2)}</p>
          <Image src="/wallet.png" alt="" width={76} height={70} className="absolute right-4 top-1 h-[70px] w-[76px] object-contain" />
          <Link href="/customer/wallet/add" className="mt-4 flex h-10 w-full items-center justify-center rounded-[10px] bg-white text-[11px] font-bold text-[#7040db] shadow-sm">
            Add Money
          </Link>
        </section>

        <section className="mt-5">
          <h2 className="text-[12px] font-bold">Transactions</h2>
          <div className="mt-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3">
            {displayTransactions.map((transaction) => {
              const Icon = transaction.icon;
              return (
                <div key={`${transaction.label}-${transaction.date}`} className="flex items-center gap-3 border-b border-[#eeecf2] py-3 last:border-0">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${transaction.positive ? "bg-[#e7f8eb] text-[#26a953]" : "bg-[#f0eaff] text-[#7540dc]"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold">{transaction.label}</p>
                    <p className="mt-1 text-[9px] text-[#858796]">{transaction.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold ${transaction.positive ? "text-[#20a14b]" : "text-[#313342]"}`}>{transaction.amount}</span>
                </div>
              );
            })}
            {!displayTransactions.length && <p className="py-8 text-center text-[10px] text-[#858796]">No transactions yet</p>}
          </div>
        </section>
      </main>

      <CustomerBottomNav active="wallet" />
    </div>
  );
}
