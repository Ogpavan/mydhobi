export const DISCOUNT_TYPES = ["Percentage", "Flat"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type DiscountGroupRule = {
  id?: number;
  serviceId: number;
  serviceName: string;
  discountType: DiscountType;
  discountValue: number;
};

export type DiscountGroup = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceCount: number;
  storeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DiscountGroupStore = {
  id: string;
  name: string;
  storeCode: string;
  status: string;
};

export type DiscountGroupDetails = DiscountGroup & {
  rules: DiscountGroupRule[];
  stores: DiscountGroupStore[];
};

export type DiscountGroupPricing = {
  id: number;
  isActive: boolean;
  rules: DiscountGroupRule[];
};

export type DiscountGroupPayload = {
  name: string;
  description: string;
  isActive: boolean;
  rules: Array<{
    serviceId: number;
    discountType: DiscountType;
    discountValue: number;
  }>;
};

export type DiscountPricing = {
  basePrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
};

export function validateDiscountRule(
  discountType: unknown,
  discountValue: unknown,
) {
  if (!DISCOUNT_TYPES.includes(discountType as DiscountType)) {
    return "Choose a valid discount type.";
  }
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value < 0) {
    return "Discount value cannot be negative.";
  }
  if (discountType === "Percentage" && value > 100) {
    return "Percentage discount must be between 0% and 100%.";
  }
  return null;
}

export function calculateDiscountedPrice(
  basePrice: number,
  rule?: Pick<DiscountGroupRule, "discountType" | "discountValue"> | null,
  groupIsActive = true,
): DiscountPricing {
  const safeBasePrice = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  if (!groupIsActive || !rule || rule.discountValue <= 0) {
    return {
      basePrice: safeBasePrice,
      discountType: rule?.discountType ?? null,
      discountValue: rule?.discountValue ?? 0,
      discountAmount: 0,
      finalPrice: safeBasePrice,
    };
  }
  const rawDiscount =
    rule.discountType === "Percentage"
      ? (safeBasePrice * rule.discountValue) / 100
      : rule.discountValue;
  const discountAmount = Math.min(safeBasePrice, Math.max(0, rawDiscount));
  return {
    basePrice: safeBasePrice,
    discountType: rule.discountType,
    discountValue: rule.discountValue,
    discountAmount,
    finalPrice: Math.max(0, safeBasePrice - discountAmount),
  };
}
