export const GARMENT_AUDIENCES = ["men", "women", "kid", "other"] as const;
export type GarmentAudience = (typeof GARMENT_AUDIENCES)[number];

