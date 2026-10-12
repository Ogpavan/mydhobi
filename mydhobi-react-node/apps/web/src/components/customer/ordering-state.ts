import { useEffect, useState } from "react";
import type { CustomerCartItem } from "@/lib/customer-cart";
export type OrderingDraft = {
  storeId: string;
  items: CustomerCartItem[];
  kind: "items" | "quick";
  serviceIds: string[];
  addressId: string;
  date: string;
  slot: string;
  delivery: string;
  instructions: string;
  method: string;
  coupon: string;
  quickItemCount: number;
  requestKey: string;
};
const key = "mydhobi_ordering";
const empty: OrderingDraft = {
  storeId: "",
  items: [],
  kind: "items",
  serviceIds: [],
  addressId: "",
  date: "",
  slot: "",
  delivery: "standard",
  instructions: "",
  method: "cash",
  coupon: "",
  quickItemCount: 0,
  requestKey: "",
};
export function readDraft(): OrderingDraft {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) ?? "null",
    ) as OrderingDraft | null;
    return value &&
      Array.isArray(value.items) &&
      Array.isArray(value.serviceIds)
      ? { ...empty, ...value }
      : { ...empty };
  } catch {
    return { ...empty };
  }
}
export function saveDraft(draft: OrderingDraft) {
  localStorage.setItem(key, JSON.stringify(draft));
  window.dispatchEvent(new Event("mydhobi-ordering-change"));
}
export function clearOrderingDraft() {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event("mydhobi-ordering-change"));
}
export function useOrderingDraft() {
  const [draft, setDraft] = useState(readDraft);
  useEffect(() => {
    const sync = () => setDraft(readDraft());
    window.addEventListener("mydhobi-ordering-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mydhobi-ordering-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function update(change: Partial<OrderingDraft>) {
    const next = { ...readDraft(), ...change, requestKey: "" };
    saveDraft(next);
    setDraft(next);
  }
  return { draft, update };
}
