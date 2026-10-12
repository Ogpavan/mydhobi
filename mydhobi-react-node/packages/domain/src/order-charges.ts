export const ORDER_CHARGE_TYPES = ["extra", "delivery", "tax"] as const;
export type OrderChargeType = (typeof ORDER_CHARGE_TYPES)[number];

export type OrderCharge = {
  id: string;
  code: string;
  name: string;
  type: OrderChargeType;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderChargeInput = {
  code: string;
  name: string;
  type: OrderChargeType;
  amount: number;
  isActive: boolean;
};

export function normalizeOrderChargeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function orderChargeCodeFromName(value: unknown) {
  const code = normalizeOrderChargeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return code || "charge";
}

export function normalizeOrderChargeCode(value: unknown) {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
    : "";
}

export function validateOrderChargeInput(input: OrderChargeInput) {
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(input.code)) {
    return "Code must use lowercase letters, numbers, and underscores.";
  }
  if (input.name.length < 2 || input.name.length > 80) {
    return "Charge name must be between 2 and 80 characters.";
  }
  if (!ORDER_CHARGE_TYPES.includes(input.type)) {
    return "Choose a valid charge type.";
  }
  const maxAmount = input.type === "tax" ? 100 : 100000;
  if (
    !Number.isFinite(input.amount) ||
    input.amount < 0 ||
    input.amount > maxAmount
  ) {
    return input.type === "tax"
      ? "Tax rate must be between 0% and 100%."
      : "Charge amount must be between ₹0 and ₹100,000.";
  }
  return null;
}
