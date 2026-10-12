export const subscriptionPlans = [
  {
    code: "fresh-start",
    name: "Fresh Start",
    price: 299,
    durationDays: 30,
    pickupLimit: 4,
    discountPercent: 5,
    description: "For light weekly laundry",
    benefits: [
      "4 pickup requests",
      "5% off every order",
      "Free pickup scheduling",
    ],
  },
  {
    code: "family-care",
    name: "Family Care",
    price: 599,
    durationDays: 30,
    pickupLimit: 8,
    discountPercent: 10,
    description: "For regular family laundry",
    benefits: [
      "8 pickup requests",
      "10% off every order",
      "Priority pickup slots",
    ],
  },
  {
    code: "premium-care",
    name: "Premium Care",
    price: 899,
    durationDays: 30,
    pickupLimit: 12,
    discountPercent: 15,
    description: "For frequent laundry needs",
    benefits: ["12 pickup requests", "15% off every order", "Priority support"],
  },
] as const;

export type SubscriptionPlan = (typeof subscriptionPlans)[number];
export type SubscriptionPlanCode = SubscriptionPlan["code"];

export type CustomerSubscription = {
  id: string;
  planCode: SubscriptionPlanCode;
  planName: string;
  amount: number;
  durationDays: number;
  pickupLimit: number;
  pickupUsed: number;
  discountPercent: number;
  startedAt: string;
  endsAt: string;
  status: "active" | "expired";
};

export function findSubscriptionPlan(code: string) {
  return subscriptionPlans.find((plan) => plan.code === code) ?? null;
}
