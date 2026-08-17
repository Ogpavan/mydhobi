export type CustomerCartItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  image: string;
  service?: string;
  serviceSlug?: string;
};

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
        item.unitPrice >= 0,
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
