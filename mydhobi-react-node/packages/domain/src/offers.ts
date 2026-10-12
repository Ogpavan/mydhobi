export type Offer = {
  id: string;
  code: string;
  title: string;
  discountType: "Percentage" | "Flat";
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  storeId: string | null;
  storeName: string | null;
  createdByUserId: string | null;
  createdByRole: string;
  createdAt: string;
};
export type OfferInput = Omit<
  Offer,
  | "id"
  | "usageCount"
  | "storeId"
  | "storeName"
  | "createdByUserId"
  | "createdByRole"
  | "createdAt"
>;
