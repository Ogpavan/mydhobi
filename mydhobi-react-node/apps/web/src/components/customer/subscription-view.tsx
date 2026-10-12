import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import {
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { MuiAction } from "@/components/ui/native-controls";
import {
  useCustomerData,
  invalidateCustomerData,
} from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";
import { apiFetch } from "@/platform/http";
import Link from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import type {
  CustomerSubscription,
  SubscriptionPlan,
} from "@/lib/subscriptions";

type SubscriptionResponse = {
  plans: SubscriptionPlan[];
  active: CustomerSubscription | null;
  history: CustomerSubscription[];
  walletBalance: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function daysLeft(value: string) {
  return Math.max(
    0,
    Math.ceil((new Date(value).getTime() - Date.now()) / 86400000),
  );
}

export function SubscriptionView() {
  const subscription = useCustomerData<SubscriptionResponse>(
    "/api/customer/subscription",
    15_000,
  );
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  async function activate() {
    if (!selectedPlan || saving) return;
    setSaving(true);
    const response = await apiFetch("/api/customer/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: selectedPlan.code }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "Unable to start subscription");
      setSaving(false);
      return;
    }
    setSelectedPlan(null);
    setSaving(false);
    invalidateCustomerData(
      "/api/customer/subscription",
      "/api/customer/wallet",
    );
    subscription.retry();
    toast.success(`${selectedPlan.name} is active`);
  }

  if (subscription.loading)
    return <CustomerPageSkeleton variant="list" rows={4} />;
  if (subscription.error)
    return (
      <CustomerPageError
        message={subscription.error}
        retry={subscription.retry}
      />
    );
  if (!subscription.data) return <CustomerPageSkeleton variant="list" />;

  const { active, plans, walletBalance } = subscription.data;

  return (
    <div className="min-h-screen bg-[#fafafe] text-[#17182c]">
      <CustomerSimpleHeader title="Subscription" backHref="/customer" />
      <main className="mx-auto max-w-[720px] space-y-4 px-4 py-4">
        <section className="overflow-hidden rounded-[16px] bg-[linear-gradient(135deg,#2f1c69,#7440dc)] px-4 py-4 text-white shadow-[0_10px_24px_rgba(90,48,180,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-semibold">
                <Sparkles className="h-3 w-3" /> 30-day plans
              </span>
              <h2 className="mt-3 text-[18px] font-bold">
                Laundry that costs less
              </h2>
            </div>
            <Crown className="h-12 w-12 text-[#f7d889]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px]">
            <div className="rounded-[10px] bg-white/10 px-2 py-2">
              <b className="block text-[15px]">5–15%</b>order savings
            </div>
            <div className="rounded-[10px] bg-white/10 px-2 py-2">
              <b className="block text-[15px]">4–12</b>pickup requests
            </div>
            <div className="rounded-[10px] bg-white/10 px-2 py-2">
              <b className="block text-[15px]">₹299</b>starting price
            </div>
          </div>
        </section>

        {active ? (
          <section className="rounded-[14px] border border-[#bce4c8] bg-[#f0fbf3] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#26934a]">
                  Current plan
                </p>
                <h2 className="mt-1 text-[17px] font-bold">
                  {active.planName}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d8f4df] px-2 py-1 text-[9px] font-bold text-[#218a43]">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <b className="block text-[13px]">
                  {Math.max(active.pickupLimit - active.pickupUsed, 0)}
                </b>
                pickups left
              </div>
              <div>
                <b className="block text-[13px]">{active.discountPercent}%</b>
                order discount
              </div>
              <div>
                <b className="block text-[13px]">{daysLeft(active.endsAt)}</b>
                days left
              </div>
            </div>
            <p className="mt-3 border-t border-[#d6efdc] pt-3 text-[10px] text-[#4e6654]">
              Valid until {formatDate(active.endsAt)}. Your wallet was charged ₹
              {active.amount.toFixed(0)}.
            </p>
          </section>
        ) : (
          <section className="flex items-center gap-3 rounded-[14px] border border-[#e5e2eb] bg-white px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]">
              <WalletCards className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[12px] font-bold">MyDhobi Wallet</h2>
              <p className="mt-1 text-[10px] text-[#77798a]">
                Use your wallet to start a plan.
              </p>
            </div>
            <span className="text-[13px] font-bold">
              ₹{walletBalance.toFixed(0)}
            </span>
          </section>
        )}

        <section>
          <h2 className="text-[14px] font-bold">
            {active ? "More plans after expiry" : "Choose your plan"}
          </h2>
          <div className="mt-3 space-y-3">
            {plans.map((plan) => (
              <article
                key={plan.code}
                className={`rounded-[14px] border bg-white p-4 ${
                  plan.code === "family-care"
                    ? "border-[#bca4f2] shadow-[0_6px_18px_rgba(116,64,220,0.12)]"
                    : "border-[#e5e2eb]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold">{plan.name}</h3>
                      {plan.code === "family-care" && (
                        <span className="rounded-full bg-[#eee8ff] px-2 py-1 text-[8px] font-bold text-[#7440dc]">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-[#77798a]">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <b className="block text-[18px]">₹{plan.price}</b>
                    <span className="text-[9px] text-[#858796]">30 days</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-[10px] bg-[#faf8ff] px-3 py-2 text-[10px]">
                  <span>{plan.pickupLimit} pickup requests</span>
                  <span className="text-right font-bold text-[#7440dc]">
                    {plan.discountPercent}% off orders
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {plan.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-2 text-[10px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#2aa653]" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <MuiAction
                  type="button"
                  disabled={Boolean(active)}
                  onClick={() => setSelectedPlan(plan)}
                  className={`mt-4 flex h-11 w-full items-center justify-center rounded-[10px] text-[11px] font-bold ${
                    active
                      ? "bg-[#efedf4] text-[#858796]"
                      : plan.code === "family-care"
                        ? "bg-[#7440dc] text-white"
                        : "border border-[#8a50ee] text-[#7440dc]"
                  }`}
                >
                  {active ? "Available after current plan" : "Choose plan"}
                </MuiAction>
              </article>
            ))}
          </div>
        </section>

        <Link
          href="/customer/offers"
          className="block rounded-[12px] border border-[#e5e2eb] bg-white px-4 py-3 text-center text-[11px] font-bold text-[#7440dc]"
        >
          View separate offers & coupons
        </Link>
      </main>
      <CustomerBottomNav active="home" />

      <Dialog
        open={Boolean(selectedPlan)}
        onClose={() => !saving && setSelectedPlan(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Start {selectedPlan?.name}</DialogTitle>
        <DialogContent dividers>
          <p className="text-[12px] leading-5 text-[#55566b]">
            Pay ₹{selectedPlan?.price ?? 0} from your MyDhobi Wallet. The plan
            starts immediately and stays active for 30 days.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#faf8ff] px-3 py-3 text-[12px]">
            <span>Wallet balance</span>
            <b>₹{walletBalance.toFixed(0)}</b>
          </div>
          {selectedPlan && walletBalance < selectedPlan.price && (
            <p className="mt-3 text-[11px] text-[#b34b35]">
              Add ₹{(selectedPlan.price - walletBalance).toFixed(0)} more to
              continue. <Link href="/customer/wallet/add">Add money</Link>
            </p>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setSelectedPlan(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              saving ||
              !selectedPlan ||
              walletBalance < (selectedPlan?.price ?? Number.POSITIVE_INFINITY)
            }
            onClick={() => void activate()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Start plan"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
