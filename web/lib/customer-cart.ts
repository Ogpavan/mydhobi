export type CustomerCartItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  image: string;
  garmentId?: string;
  garmentName?: string;
  serviceId?: string;
  serviceName?: string;
  alias?: string;
  packingType?: string;
  brand?: string;
  fabric?: string;
  defect?: string;
  service?: string;
  serviceSlug?: string;
};

export const PACKING_TYPES = ["Bag", "Hanger", "Box", "Other"] as const;
export const FABRIC_TYPES = ["Cotton", "Silk", "Wool", "Synthetic", "Linen", "Other"] as const;
export const DEFECT_TYPES = ["None", "Stain", "Tear", "Missing button", "Color issue", "Other"] as const;

export type CustomerCart = {
  service: string;
  serviceSlug: string;
  items: CustomerCartItem[];
};

export const customerCartKey = "mydhobi_cart";

export function readCustomerCart(): CustomerCart | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(
      localStorage.getItem(customerCartKey) ?? "null",
    ) as CustomerCart | null;
    if (
      !value ||
      typeof value.service !== "string" ||
      !Array.isArray(value.items)
    ) {
      return null;
    }
    const items = value.items.filter(
      (item) =>
        typeof item.name === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0 &&
        (item.alias === undefined || typeof item.alias === "string") &&
        (item.packingType === undefined || typeof item.packingType === "string") &&
        (item.brand === undefined || typeof item.brand === "string") &&
        (item.fabric === undefined || typeof item.fabric === "string") &&
        (item.defect === undefined || typeof item.defect === "string"),
    );
    return items.length ? { ...value, items } : null;
  } catch {
    return null;
  }
}

export function writeCustomerCart(cart: CustomerCart | null) {
  if (cart?.items.length) {
    localStorage.setItem(customerCartKey, JSON.stringify(cart));
  } else {
    localStorage.removeItem(customerCartKey);
  }
  window.dispatchEvent(new Event("mydhobi-cart-change"));
}

export function cartSubtotal(cart: CustomerCart | null) {
  return (
    cart?.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    ) ?? 0
  );
}
